import { settingsService } from '../settings.service';
import { decryptSecret, encryptSecret, maskSecret } from '../../lib/secret-box';

/**
 * Configuração da IA de criação, guardada na tabela `Setting` (sem migração).
 *
 * Chaves:
 * - `ai.enabled`               "true" | "false"
 * - `ai.provider`              "openai" | "muapi"
 * - `ai.model`                 modelo de geração (OpenAI) ou endpoint (MUAPI)
 * - `ai.editModel`             modelo/endpoint de edição (opcional)
 * - `ai.apiKey`                chave do provedor, CIFRADA (lib/secret-box)
 * - `ai.monthlyLimitPerOrg`    usos por organização por mês (0 = sem limite)
 * - `ai.features.generateImage` | `ai.features.editImage` | `ai.features.generatePreset`
 *
 * A chave nunca sai deste módulo em texto puro para fora do servidor: a visão
 * pública (`toPublic`) mostra só os 4 últimos caracteres.
 */

export type AiProviderId = 'openai' | 'muapi';

export const AI_PROVIDERS: AiProviderId[] = ['openai', 'muapi'];

export const DEFAULT_MODELS: Record<AiProviderId, { model: string; editModel: string }> = {
  openai: { model: 'gpt-image-1', editModel: 'gpt-image-1' },
  muapi: { model: 'gpt-image-2-text-to-image', editModel: 'gpt-image-2-image-to-image' },
};

export const DEFAULT_MONTHLY_LIMIT = 50;

export interface AiFeatureFlags {
  generateImage: boolean;
  editImage: boolean;
  generatePreset: boolean;
}

export interface AiConfig {
  enabled: boolean;
  provider: AiProviderId;
  model: string;
  editModel: string;
  apiKey: string | null;
  /** A chave existe no banco mas não pôde ser decifrada (chave de cifra trocada). */
  apiKeyUnreadable: boolean;
  monthlyLimitPerOrg: number;
  features: AiFeatureFlags;
}

export interface AiPublicConfig extends Omit<AiConfig, 'apiKey'> {
  hasApiKey: boolean;
  apiKeyHint: string | null;
}

const KEYS = [
  'ai.enabled',
  'ai.provider',
  'ai.model',
  'ai.editModel',
  'ai.apiKey',
  'ai.monthlyLimitPerOrg',
  'ai.features.generateImage',
  'ai.features.editImage',
  'ai.features.generatePreset',
];

const flag = (value: string | undefined, fallback: boolean) =>
  value === undefined ? fallback : value === 'true';

export function isAiProvider(value: unknown): value is AiProviderId {
  return typeof value === 'string' && (AI_PROVIDERS as string[]).includes(value);
}

export class AiConfigService {
  async get(): Promise<AiConfig> {
    const s = await settingsService.getMultiple(KEYS);
    const provider: AiProviderId = isAiProvider(s['ai.provider']) ? s['ai.provider'] : 'openai';
    const storedKey = s['ai.apiKey'];
    const apiKey = decryptSecret(storedKey);
    const limit = Number(s['ai.monthlyLimitPerOrg']);

    return {
      enabled: flag(s['ai.enabled'], false),
      provider,
      model: s['ai.model']?.trim() || DEFAULT_MODELS[provider].model,
      editModel: s['ai.editModel']?.trim() || DEFAULT_MODELS[provider].editModel,
      apiKey,
      apiKeyUnreadable: Boolean(storedKey) && !apiKey,
      monthlyLimitPerOrg: Number.isInteger(limit) && limit >= 0 ? limit : DEFAULT_MONTHLY_LIMIT,
      features: {
        generateImage: flag(s['ai.features.generateImage'], true),
        editImage: flag(s['ai.features.editImage'], true),
        generatePreset: flag(s['ai.features.generatePreset'], true),
      },
    };
  }

  toPublic(config: AiConfig): AiPublicConfig {
    const { apiKey, ...rest } = config;
    return { ...rest, hasApiKey: Boolean(apiKey), apiKeyHint: maskSecret(apiKey) };
  }

  /**
   * Salva. `apiKey` ausente ou vazia mantém a atual; `clearApiKey` apaga.
   * Trocar de provedor sem mandar chave nova também mantém a chave, porque o
   * operador pode estar só testando o formulário; o teste de conexão avisa se
   * ela não servir para o provedor novo.
   */
  async save(input: {
    enabled: boolean;
    provider: AiProviderId;
    model?: string | null;
    editModel?: string | null;
    apiKey?: string | null;
    clearApiKey?: boolean;
    monthlyLimitPerOrg: number;
    features: AiFeatureFlags;
  }): Promise<AiConfig> {
    const entries: Record<string, string> = {
      'ai.enabled': String(input.enabled),
      'ai.provider': input.provider,
      'ai.model': (input.model ?? '').trim(),
      'ai.editModel': (input.editModel ?? '').trim(),
      'ai.monthlyLimitPerOrg': String(input.monthlyLimitPerOrg),
      'ai.features.generateImage': String(input.features.generateImage),
      'ai.features.editImage': String(input.features.editImage),
      'ai.features.generatePreset': String(input.features.generatePreset),
    };

    const newKey = input.apiKey?.trim();
    if (input.clearApiKey) entries['ai.apiKey'] = '';
    else if (newKey) entries['ai.apiKey'] = encryptSecret(newKey);

    await settingsService.setMultiple(entries);
    return this.get();
  }
}

export const aiConfigService = new AiConfigService();
