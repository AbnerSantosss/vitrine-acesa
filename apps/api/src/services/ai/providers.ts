import type { AiProviderId } from './ai-config.service';

/**
 * Clientes dos provedores de imagem, atrás de uma interface só.
 *
 * Regras que valem para os dois:
 * - a chave vai só no header da requisição ao provedor; nunca entra em log,
 *   em mensagem de erro nem em resposta ao painel;
 * - a mensagem de erro devolvida é genérica e em pt-BR; o detalhe técnico do
 *   provedor fica no log do servidor, já sem a chave;
 * - nada aqui grava arquivo: quem chama recebe os bytes e decide onde guardar.
 */

export type AiAspect = 'landscape' | 'portrait';

export interface GeneratedImage {
  buffer: Buffer;
  mimetype: string;
}

export interface AiProviderClient {
  generate(input: { prompt: string; aspect: AiAspect }): Promise<GeneratedImage>;
  edit(input: {
    prompt: string;
    aspect: AiAspect;
    image: { buffer: Buffer; mimetype: string; filename: string };
    /** URL pública da imagem original. A MUAPI só aceita URL, não arquivo. */
    publicUrl: string | null;
  }): Promise<GeneratedImage>;
  /** Teste de conexão sem custo (ou o mais barato possível). */
  test(): Promise<{ ok: boolean; message: string }>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    /** Status HTTP sugerido para a resposta ao painel. */
    readonly status = 502,
    /** Detalhe só para log. Nunca contém a chave. */
    readonly detail?: string
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

function redact(text: string, apiKey: string): string {
  return apiKey ? text.split(apiKey).join('[chave]') : text;
}

async function readErrorDetail(res: Response, apiKey: string): Promise<string> {
  try {
    const text = await res.text();
    return redact(text.slice(0, 500), apiKey);
  } catch {
    return '';
  }
}

function failFromStatus(status: number, detail: string): never {
  if (status === 401 || status === 403) {
    throw new AiProviderError('O provedor de IA recusou a chave. Confira a configuração no admin.', 502, detail);
  }
  if (status === 402 || status === 429) {
    throw new AiProviderError('O provedor de IA está ocupado ou sem saldo. Tente de novo em alguns minutos.', 503, detail);
  }
  if (status === 400 || status === 422) {
    throw new AiProviderError('O provedor de IA não aceitou esse pedido. Tente descrever de outro jeito.', 422, detail);
  }
  throw new AiProviderError('O provedor de IA não respondeu como esperado. Tente de novo.', 502, detail);
}

async function timedFetch(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err: any) {
    const reason = err?.name === 'TimeoutError' ? 'tempo esgotado' : 'falha de rede';
    throw new AiProviderError('Não foi possível falar com o provedor de IA. Tente de novo.', 504, reason);
  }
}

/** Baixa a imagem final que o provedor hospedou. Só https e com teto de tamanho. */
async function downloadImage(url: string): Promise<GeneratedImage> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AiProviderError('O provedor de IA devolveu um endereço de imagem inválido.');
  }
  if (parsed.protocol !== 'https:') {
    throw new AiProviderError('O provedor de IA devolveu um endereço de imagem inválido.');
  }
  const res = await timedFetch(parsed.toString(), { method: 'GET', redirect: 'follow' }, 60_000);
  if (!res.ok) {
    throw new AiProviderError('Não foi possível baixar a imagem gerada. Tente de novo.', 502, `download ${res.status}`);
  }
  const declared = Number(res.headers.get('content-length') || 0);
  if (declared > MAX_IMAGE_BYTES) throw new AiProviderError('A imagem gerada é grande demais.', 502);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new AiProviderError('A imagem gerada é grande demais.', 502);
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  const mimetype = /^image\/(png|jpeg|webp)$/.test(type) ? type : 'image/png';
  return { buffer, mimetype };
}

// ── OpenAI ────────────────────────────────────────────────────────────────────
// POST /v1/images/generations (JSON) e /v1/images/edits (multipart). Os modelos
// gpt-image devolvem a imagem em base64 (`data[0].b64_json`). Teste: GET
// /v1/models, que não gera custo.

const OPENAI_BASE = 'https://api.openai.com/v1';

function openAiSize(aspect: AiAspect): string {
  return aspect === 'portrait' ? '1024x1536' : '1536x1024';
}

async function openAiImageFromResponse(res: Response, apiKey: string): Promise<GeneratedImage> {
  if (!res.ok) failFromStatus(res.status, await readErrorDetail(res, apiKey));
  const body: any = await res.json().catch(() => null);
  const item = body?.data?.[0];
  if (item?.b64_json) return { buffer: Buffer.from(item.b64_json, 'base64'), mimetype: 'image/png' };
  if (item?.url) return downloadImage(item.url);
  throw new AiProviderError('O provedor de IA não devolveu imagem. Tente de novo.', 502, 'resposta sem data[0]');
}

export function createOpenAiClient(apiKey: string, model: string, editModel: string): AiProviderClient {
  const auth = { Authorization: `Bearer ${apiKey}` };
  return {
    async generate({ prompt, aspect }) {
      const res = await timedFetch(`${OPENAI_BASE}/images/generations`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, size: openAiSize(aspect), n: 1 }),
      });
      return openAiImageFromResponse(res, apiKey);
    },
    async edit({ prompt, aspect, image }) {
      const form = new FormData();
      form.append('model', editModel);
      form.append('prompt', prompt);
      form.append('size', openAiSize(aspect));
      form.append('image', new Blob([new Uint8Array(image.buffer)], { type: image.mimetype }), image.filename);
      const res = await timedFetch(`${OPENAI_BASE}/images/edits`, { method: 'POST', headers: auth, body: form });
      return openAiImageFromResponse(res, apiKey);
    },
    async test() {
      const res = await timedFetch(`${OPENAI_BASE}/models`, { method: 'GET', headers: auth }, 15_000);
      if (res.ok) return { ok: true, message: 'Conexão com a OpenAI funcionando. A chave foi aceita.' };
      if (res.status === 401 || res.status === 403) return { ok: false, message: 'A OpenAI recusou a chave.' };
      return { ok: false, message: `A OpenAI respondeu com erro ${res.status}.` };
    },
  };
}

// ── MUAPI ─────────────────────────────────────────────────────────────────────
// Contrato lido em muapi.ai (out/2026): POST https://api.muapi.ai/api/v1/<endpoint>
// com header `x-api-key`; responde `{ request_id }`. O resultado sai de
// GET /api/v1/predictions/<id>/result até `status` = completed, com as URLs em
// `outputs`. Geração usa `aspect_ratio`; edição usa `images_list` (URLs).
// NÃO VERIFICADO com chamada real: o nome exato do endpoint de edição de cada
// família de modelo (o padrão documentado é `<familia>-image-to-image`) e um
// endpoint de teste sem custo. O teste da MUAPI só confere se a chave é aceita
// numa consulta de resultado que não existe.

const MUAPI_BASE = 'https://api.muapi.ai/api/v1';
const MUAPI_POLL_INTERVAL_MS = 2_500;
const MUAPI_MAX_WAIT_MS = 180_000;

function safeEndpoint(name: string): string {
  if (!/^[A-Za-z0-9._-]{1,120}$/.test(name)) {
    throw new AiProviderError('O modelo configurado para a IA é inválido. Ajuste no admin.', 500);
  }
  return name;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createMuapiClient(apiKey: string, model: string, editModel: string): AiProviderClient {
  const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };

  async function submitAndWait(endpoint: string, payload: Record<string, unknown>): Promise<GeneratedImage> {
    const res = await timedFetch(`${MUAPI_BASE}/${safeEndpoint(endpoint)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) failFromStatus(res.status, await readErrorDetail(res, apiKey));
    const submitted: any = await res.json().catch(() => null);
    const requestId = submitted?.request_id || submitted?.id;
    if (typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(requestId)) {
      throw new AiProviderError('O provedor de IA não aceitou o pedido. Tente de novo.', 502, 'sem request_id');
    }

    const started = Date.now();
    while (Date.now() - started < MUAPI_MAX_WAIT_MS) {
      await sleep(MUAPI_POLL_INTERVAL_MS);
      const poll = await timedFetch(`${MUAPI_BASE}/predictions/${requestId}/result`, { method: 'GET', headers }, 30_000);
      if (!poll.ok) {
        if (poll.status >= 500) continue;
        failFromStatus(poll.status, await readErrorDetail(poll, apiKey));
      }
      const body: any = await poll.json().catch(() => null);
      const status = String(body?.status ?? body?.data?.status ?? '').toLowerCase();
      const outputs = body?.outputs ?? body?.data?.outputs;
      if (status === 'completed' || status === 'succeeded') {
        const url = Array.isArray(outputs) ? outputs[0] : null;
        if (typeof url !== 'string') {
          throw new AiProviderError('O provedor de IA não devolveu imagem. Tente de novo.', 502, 'sem outputs');
        }
        return downloadImage(url);
      }
      if (status === 'failed' || status === 'error' || status === 'canceled') {
        throw new AiProviderError(
          'O provedor de IA não conseguiu criar essa imagem. Tente descrever de outro jeito.',
          422,
          redact(String(body?.error ?? '').slice(0, 300), apiKey)
        );
      }
    }
    throw new AiProviderError('A IA demorou demais para responder. Tente de novo.', 504, 'polling esgotado');
  }

  return {
    async generate({ prompt, aspect }) {
      return submitAndWait(model, { prompt, aspect_ratio: aspect === 'portrait' ? '9:16' : '16:9' });
    },
    async edit({ prompt, aspect, publicUrl }) {
      if (!publicUrl) {
        throw new AiProviderError(
          'Para editar com a MUAPI a imagem precisa estar num endereço público. Use o armazenamento R2 ou a OpenAI.',
          422
        );
      }
      return submitAndWait(editModel, {
        prompt,
        images_list: [publicUrl],
        aspect_ratio: aspect === 'portrait' ? '9:16' : '16:9',
      });
    },
    async test() {
      // Consulta um resultado que não existe: não cria tarefa e não gera custo.
      // 401/403 = chave recusada; qualquer outra resposta = chave aceita.
      const res = await timedFetch(
        `${MUAPI_BASE}/predictions/telahub-teste-de-conexao/result`,
        { method: 'GET', headers },
        15_000
      );
      if (res.status === 401 || res.status === 403) return { ok: false, message: 'A MUAPI recusou a chave.' };
      if (res.status >= 500) return { ok: false, message: `A MUAPI respondeu com erro ${res.status}.` };
      return {
        ok: true,
        message: 'A MUAPI respondeu e não recusou a chave. Faça uma geração de teste para confirmar.',
      };
    },
  };
}

export function createProviderClient(
  provider: AiProviderId,
  apiKey: string,
  model: string,
  editModel: string
): AiProviderClient {
  return provider === 'muapi'
    ? createMuapiClient(apiKey, model, editModel)
    : createOpenAiClient(apiKey, model, editModel);
}
