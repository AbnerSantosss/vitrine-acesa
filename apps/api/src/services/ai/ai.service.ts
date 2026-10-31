import crypto from 'node:crypto';
import prisma from '../../lib/prisma';
import { mediaService } from '../media.service';
import { subscriptionService } from '../subscription.service';
import { subscriptionOverrideService } from '../subscription-override.service';
import { hasFeature, planService } from '../plan.service';
import { aiConfigService, AiConfig, AiProviderId } from './ai-config.service';
import { AiAspect, AiProviderError, createProviderClient } from './providers';

/**
 * Regras de uso da IA de criação para o cliente final.
 *
 * Ordem das travas (todas no servidor; o painel só espelha):
 * 1. ligada pelo master e com chave cadastrada;
 * 2. o recurso pedido (gerar, editar, tela pronta) ligado no admin;
 * 3. feature `ia-criacao` no plano da organização (ou concessão manual);
 * 4. limite mensal por organização, contado na trilha de auditoria.
 *
 * O contador usa a tabela `AuditLog` (que já tem índice por organização e
 * data) para não precisar de migração. Pedidos simultâneos podem passar do
 * limite por uma ou duas unidades; para custo, isso é aceitável.
 */

export const AI_FEATURE_KEY = 'ia-criacao';
export const AI_PROMPT_MAX = 1000;

export const AI_ACTIONS = {
  generateImage: 'ai.image.generate',
  editImage: 'ai.image.edit',
  generatePreset: 'ai.preset.generate',
} as const;

export type AiCapability = keyof typeof AI_ACTIONS;

export type Orientation = 'horizontal' | 'vertical';

export class AiUseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = 'AiUseError';
  }
}

export interface AiStatusResponse {
  enabled: boolean;
  provider?: AiProviderId;
  features: { generateImage: boolean; editImage: boolean; generatePreset: boolean };
  reason?: string;
  remaining: number | null;
  limit: number | null;
}

const OFF_FEATURES = { generateImage: false, editImage: false, generatePreset: false };
const OFF_REASON = 'A criação com IA ainda não foi ativada pelo administrador.';

function monthStart(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function countMonthlyUsage(organizationId: string, now = new Date()): Promise<number> {
  return prisma.auditLog.count({
    where: {
      organizationId,
      action: { in: Object.values(AI_ACTIONS) },
      createdAt: { gte: monthStart(now) },
    },
  });
}

/** Plano libera? Master e organização sem assinatura passam (mesma regra do requireFeature). */
async function planAllows(organizationId: string | null, isMaster: boolean): Promise<boolean> {
  if (isMaster || !organizationId) return isMaster;
  const subscription = await subscriptionService.getByOrganization(organizationId);
  if (!subscription) return true;
  if (hasFeature(subscription, AI_FEATURE_KEY)) return true;
  return subscriptionOverrideService.grantsFeature(organizationId, AI_FEATURE_KEY);
}

async function notInPlanReason(): Promise<string> {
  const plan = await planService.cheapestPlanWithFeature(AI_FEATURE_KEY).catch(() => null);
  return plan
    ? `A criação com IA faz parte do plano ${plan.name}. Fale com a gente para liberar.`
    : 'A criação com IA não faz parte do seu plano.';
}

function limitReason(limit: number): string {
  return `Sua empresa já usou as ${limit} criações com IA deste mês. O limite renova no dia 1º.`;
}

export class AiService {
  async status(organizationId: string | null, isMaster: boolean): Promise<AiStatusResponse> {
    const config = await aiConfigService.get();
    if (!config.enabled || !config.apiKey) {
      return { enabled: false, features: OFF_FEATURES, reason: OFF_REASON, remaining: null, limit: null };
    }

    if (!(await planAllows(organizationId, isMaster))) {
      return { enabled: false, features: OFF_FEATURES, reason: await notInPlanReason(), remaining: null, limit: null };
    }

    const limit = config.monthlyLimitPerOrg > 0 ? config.monthlyLimitPerOrg : null;
    let remaining: number | null = null;
    if (limit !== null && organizationId) {
      remaining = Math.max(0, limit - (await countMonthlyUsage(organizationId)));
    }
    if (remaining === 0 && !isMaster) {
      return {
        enabled: false,
        provider: config.provider,
        features: OFF_FEATURES,
        reason: limitReason(limit!),
        remaining: 0,
        limit,
      };
    }

    const features = config.features;
    const anyOn = features.generateImage || features.editImage || features.generatePreset;
    return {
      enabled: anyOn,
      provider: config.provider,
      features,
      reason: anyOn ? undefined : OFF_REASON,
      remaining,
      limit,
    };
  }

  /** Confere todas as travas antes de gastar dinheiro no provedor. */
  private async assertCanUse(
    capability: AiCapability,
    organizationId: string,
    isMaster: boolean
  ): Promise<AiConfig> {
    const config = await aiConfigService.get();
    if (!config.enabled || !config.apiKey) throw new AiUseError(OFF_REASON, 503, 'ai_disabled');
    if (!config.features[capability]) {
      throw new AiUseError('Esse recurso de IA está desligado pelo administrador.', 403, 'ai_feature_disabled');
    }
    if (!(await planAllows(organizationId, isMaster))) {
      throw new AiUseError(await notInPlanReason(), 403, 'feature_not_in_plan');
    }
    if (!isMaster && config.monthlyLimitPerOrg > 0) {
      const used = await countMonthlyUsage(organizationId);
      if (used >= config.monthlyLimitPerOrg) {
        throw new AiUseError(limitReason(config.monthlyLimitPerOrg), 429, 'ai_monthly_limit');
      }
    }
    return config;
  }

  private client(config: AiConfig) {
    return createProviderClient(config.provider, config.apiKey!, config.model, config.editModel);
  }

  private async store(organizationId: string, image: { buffer: Buffer; mimetype: string }) {
    const ext = image.mimetype === 'image/jpeg' ? 'jpg' : image.mimetype === 'image/webp' ? 'webp' : 'png';
    const saved = await mediaService.saveBuffer(
      { buffer: image.buffer, mimetype: image.mimetype, originalname: `ia-${crypto.randomUUID().slice(0, 8)}.${ext}` },
      organizationId
    );
    return { url: saved.url, mediaId: saved.key };
  }

  async generateImage(input: {
    organizationId: string;
    isMaster: boolean;
    prompt: string;
    orientation: Orientation;
    segment?: string;
  }) {
    const config = await this.assertCanUse('generateImage', input.organizationId, input.isMaster);
    const image = await this.client(config).generate({
      prompt: buildImagePrompt(input.prompt, input.segment, input.orientation, false),
      aspect: aspectOf(input.orientation),
    });
    return { ...(await this.store(input.organizationId, image)), provider: config.provider };
  }

  async editImage(input: {
    organizationId: string;
    isMaster: boolean;
    imageUrl: string;
    prompt: string;
    orientation: Orientation;
  }) {
    const config = await this.assertCanUse('editImage', input.organizationId, input.isMaster);
    const source = await mediaService.readOwnMedia(input.imageUrl, input.organizationId);
    if (!source) {
      throw new AiUseError(
        'Só dá para editar com IA uma imagem PNG, JPG ou WEBP enviada para a sua biblioteca.',
        422,
        'ai_image_not_owned'
      );
    }
    const image = await this.client(config).edit({
      prompt: input.prompt,
      aspect: aspectOf(input.orientation),
      image: source,
      publicUrl: absolutePublicUrl(input.imageUrl),
    });
    return { ...(await this.store(input.organizationId, image)), provider: config.provider };
  }

  async generatePreset(input: {
    organizationId: string;
    isMaster: boolean;
    prompt: string;
    orientation: Orientation;
    segment?: string;
  }) {
    const config = await this.assertCanUse('generatePreset', input.organizationId, input.isMaster);
    const image = await this.client(config).generate({
      prompt: buildImagePrompt(input.prompt, input.segment, input.orientation, true),
      aspect: aspectOf(input.orientation),
    });
    const stored = await this.store(input.organizationId, image);
    return {
      layout: buildPresetLayout(input.prompt, input.orientation),
      page: { backgroundImage: stored.url },
      mediaId: stored.mediaId,
      provider: config.provider,
    };
  }

  /** Teste de conexão do admin. Usa a chave nova se vier, senão a salva. */
  async testConnection(input: { provider?: AiProviderId; apiKey?: string; model?: string; editModel?: string }) {
    const config = await aiConfigService.get();
    const provider = input.provider ?? config.provider;
    const apiKey = input.apiKey?.trim() || config.apiKey;
    if (!apiKey) return { ok: false, message: 'Cadastre uma chave antes de testar.' };
    const client = createProviderClient(
      provider,
      apiKey,
      input.model?.trim() || config.model,
      input.editModel?.trim() || config.editModel
    );
    try {
      return await client.test();
    } catch (err) {
      if (err instanceof AiProviderError) return { ok: false, message: err.message };
      return { ok: false, message: 'Não foi possível testar a conexão agora.' };
    }
  }
}

function aspectOf(orientation: Orientation): AiAspect {
  return orientation === 'vertical' ? 'portrait' : 'landscape';
}

/** Monta a URL pública absoluta (a MUAPI precisa baixar a imagem original). */
function absolutePublicUrl(url: string): string | null {
  if (/^https:\/\//i.test(url)) return url;
  const base = (process.env.PUBLIC_MEDIA_BASE_URL || process.env.APP_URL || '').replace(/\/+$/, '');
  if (!base || !/^https:\/\//i.test(base) || !url.startsWith('/')) return null;
  return `${base}${url}`;
}

const SEGMENT_LABEL: Record<string, string> = {
  padaria: 'padaria',
  restaurante: 'restaurante',
  lanchonete: 'lanchonete',
  mercado: 'mercado',
  farmacia: 'farmácia',
  clinica: 'clínica',
  academia: 'academia',
  moda: 'loja de roupas',
  shopping: 'shopping',
  servicos: 'empresa de serviços',
  igreja: 'igreja',
  escola: 'escola',
};

export function segmentLabel(segment?: string): string | null {
  if (!segment) return null;
  return SEGMENT_LABEL[segment] ?? segment.slice(0, 40);
}

function buildImagePrompt(prompt: string, segment: string | undefined, orientation: Orientation, forScene: boolean) {
  const where = segmentLabel(segment);
  const format = orientation === 'vertical' ? 'vertical 9:16' : 'horizontal 16:9';
  const parts = [
    `Imagem publicitária ${format} para uma tela de TV${where ? ` de ${where}` : ''}.`,
    prompt,
  ];
  if (forScene) {
    parts.push(
      'Não escreva nenhum texto, letra, número ou logotipo na imagem.',
      orientation === 'vertical'
        ? 'Deixe a parte de baixo mais limpa para receber texto por cima.'
        : 'Deixe o lado esquerdo mais limpo para receber texto por cima.'
    );
  }
  return parts.join(' ');
}

// ── Tela pronta: layout determinístico a partir do texto ─────────────────────
//
// A imagem de fundo vem do provedor; os textos NÃO são inventados pela IA:
// saem do próprio pedido do cliente (título = primeira frase, preço = o valor
// em reais que ele digitou). Tudo vira widget comum, 100% editável.

const PRICE_RE = /R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\b\d{1,4},\d{2}\b/i;

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function cap(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

function upperFirst(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function extractPresetTexts(prompt: string): { title: string; subtitle: string | null; price: string | null } {
  const priceMatch = prompt.match(PRICE_RE);
  let price: string | null = null;
  if (priceMatch) {
    const raw = priceMatch[0].replace(/^R\$\s*/i, '');
    price = `R$ ${raw.includes(',') ? raw : `${raw},00`}`;
  }
  const withoutPrice = clean(priceMatch ? prompt.replace(priceMatch[0], ' ') : prompt);
  const pieces = withoutPrice
    .split(/[.!?;\n]|,\s+/)
    .map((p) => clean(p).replace(/^(por|a|o|de)\s+$/i, ''))
    .filter((p) => p.length > 1);

  const title = upperFirst(cap(pieces[0] || 'Sua oferta aqui', 42));
  const subtitle = pieces[1] ? upperFirst(cap(pieces[1], 70)) : null;
  return { title, subtitle, price };
}

let seq = 0;
function newId(prefix: string) {
  seq = (seq + 1) % 1_000_000;
  return `${prefix}-ia-${Date.now().toString(36)}-${seq}`;
}

export function buildPresetLayout(prompt: string, orientation: Orientation) {
  const { title, subtitle, price } = extractPresetTexts(prompt);
  const vertical = orientation === 'vertical';
  const accent = '#F59E0B';
  const layout: any[] = [];

  // Faixa escura atrás do texto: garante leitura sobre qualquer foto.
  layout.push({
    i: newId('shape'),
    type: 'SHAPE',
    ...(vertical ? { x: 0, y: 27, w: 27, h: 21 } : { x: 0, y: 0, w: 25, h: 27 }),
    data: { shapeConfig: { kind: 'rect', fill: 'rgba(0,0,0,0.55)' }, transparentBackground: true, zIndex: 1 },
  });

  layout.push({
    i: newId('text'),
    type: 'TEXT',
    ...(vertical ? { x: 2, y: 29, w: 23, h: 8 } : { x: 2, y: 5, w: 21, h: 9 }),
    data: {
      content: title,
      color: '#FFFFFF',
      transparentBackground: true,
      zIndex: 2,
      textConfig: { textStyle: 'h1', fontSize: '11cqmin', fontWeight: '800', textAlign: 'left', lineHeight: 1.05 },
    },
  });

  if (subtitle) {
    layout.push({
      i: newId('text'),
      type: 'TEXT',
      ...(vertical ? { x: 2, y: 37, w: 23, h: 4 } : { x: 2, y: 14, w: 21, h: 4 }),
      data: {
        content: subtitle,
        color: '#F3F4F6',
        transparentBackground: true,
        zIndex: 2,
        textConfig: { textStyle: 'body', fontSize: '3.7cqmin', fontWeight: '500', textAlign: 'left', lineHeight: 1.35 },
      },
    });
  }

  if (price) {
    const box = vertical ? { x: 2, y: 42, w: 14, h: 4 } : { x: 2, y: 19, w: 12, h: 5 };
    layout.push({
      i: newId('shape'),
      type: 'SHAPE',
      ...box,
      data: { shapeConfig: { kind: 'pill', fill: accent }, transparentBackground: true, zIndex: 2 },
    });
    layout.push({
      i: newId('text'),
      type: 'TEXT',
      ...box,
      data: {
        content: price,
        color: '#111827',
        transparentBackground: true,
        zIndex: 3,
        textConfig: { textStyle: 'h2', fontSize: '7.5cqmin', fontWeight: '800', textAlign: 'center', lineHeight: 1.1 },
      },
    });
  }

  return layout;
}

export const aiService = new AiService();
