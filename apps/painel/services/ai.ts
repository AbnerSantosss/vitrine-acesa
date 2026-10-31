/**
 * Cliente da IA de criação (imagem, edição por prompt, cena pronta).
 * O provedor e a chave ficam no servidor, configurados só pelo administrador
 * master. O painel nunca vê a chave: só manda o pedido para /api/ai/*.
 *
 * Todas as travas (ligada, recurso, plano, limite do mês) são conferidas no
 * servidor. O status aqui serve só para a interface mostrar o que pode fazer.
 */
import type { LayoutItem, Page } from '../types';
import { api, getApiErrorMessage } from '../libs/api';

export type AiProvider = 'openai' | 'muapi';

export interface AiStatus {
  enabled: boolean;
  provider?: AiProvider;
  features: { generateImage: boolean; editImage: boolean; generatePreset: boolean };
  /** Texto para o cliente quando estiver desligado ou fora do plano. */
  reason?: string;
  /** Gerações restantes no mês, se houver limite. */
  remaining?: number | null;
  /** Limite mensal da empresa, se houver. */
  limit?: number | null;
}

export interface AiImageResult { url: string; mediaId?: string }
export interface AiPresetResult { layout: LayoutItem[]; page?: Partial<Pick<Page, 'backgroundImage' | 'backgroundAnimation'>> }

export const AI_PROMPT_MAX = 1000;

const OFF: AiStatus = {
  enabled: false,
  features: { generateImage: false, editImage: false, generatePreset: false },
  reason: 'A criação com IA ainda não foi ativada pelo administrador.',
};

type Orientation = 'horizontal' | 'vertical';

const FALLBACK_ERROR = 'Não foi possível concluir o pedido de IA agora. Tente de novo.';

/** Repassa a mensagem do servidor (já em pt-BR) como `Error` comum. */
async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new Error(getApiErrorMessage(error, FALLBACK_ERROR));
  }
}

export async function getAiStatus(): Promise<AiStatus> {
  try {
    const status = await api.get<AiStatus>('/ai/status');
    if (!status || typeof status !== 'object' || !status.features) return OFF;
    return status;
  } catch {
    // Sem resposta do servidor: a interface fica no estado desligado.
    return OFF;
  }
}

export async function generateImage(input: { prompt: string; orientation: Orientation; segment?: string }): Promise<AiImageResult> {
  return call(() => api.post<AiImageResult>('/ai/image', input));
}

export async function editImage(input: { imageUrl: string; prompt: string; orientation?: Orientation }): Promise<AiImageResult> {
  return call(() => api.post<AiImageResult>('/ai/image/edit', { ...input, orientation: input.orientation ?? 'horizontal' }));
}

export async function generatePreset(input: { prompt: string; orientation: Orientation; segment?: string }): Promise<AiPresetResult> {
  return call(() => api.post<AiPresetResult>('/ai/preset', input));
}
