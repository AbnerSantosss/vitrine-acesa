/**
 * IA de criação: liga e desliga a IA do editor, escolhe o provedor e guarda a
 * chave. Só o papel master chega aqui (a API barra o resto com 403).
 *
 * A chave é só de escrita: a tela nunca recebe o valor, só os 4 últimos
 * caracteres. Campo vazio ao salvar mantém a chave atual.
 */
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, PlugZap, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { api, isApiError } from '../lib/api';
import { useAdminQuery } from './useAdminQuery';
import { Button, Card, ErrorState, Field, ForbiddenState, Loading, PageHeader, cx, inputClass } from './ui';

type Provider = 'openai' | 'muapi';

interface AiFeatures {
  generateImage: boolean;
  editImage: boolean;
  generatePreset: boolean;
}

interface AiPublicConfig {
  enabled: boolean;
  provider: Provider;
  model: string;
  editModel: string;
  apiKeyUnreadable: boolean;
  monthlyLimitPerOrg: number;
  features: AiFeatures;
  hasApiKey: boolean;
  apiKeyHint: string | null;
}

const PROVIDERS: { id: Provider; label: string; hint: string }[] = [
  { id: 'openai', label: 'OpenAI', hint: 'Chave criada em platform.openai.com.' },
  { id: 'muapi', label: 'MUAPI', hint: 'Chave criada em muapi.ai. Para editar imagem, a mídia precisa estar num endereço público.' },
];

const DEFAULT_MODELS: Record<Provider, { model: string; editModel: string }> = {
  openai: { model: 'gpt-image-1', editModel: 'gpt-image-1' },
  muapi: { model: 'gpt-image-2-text-to-image', editModel: 'gpt-image-2-image-to-image' },
};

const FEATURES: { key: keyof AiFeatures; label: string; hint: string }[] = [
  { key: 'generateImage', label: 'Gerar imagem', hint: 'O cliente descreve e recebe uma imagem para a cena.' },
  { key: 'editImage', label: 'Editar imagem', hint: 'O cliente muda uma imagem da própria biblioteca por texto.' },
  { key: 'generatePreset', label: 'Tela pronta', hint: 'Fundo gerado com os textos do pedido como itens editáveis.' },
];

const MODEL_PATTERN = /^[A-Za-z0-9._-]*$/;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** Interruptor acessível com alvo de 44 px. */
const Toggle = ({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) => (
  <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start justify-between gap-4 py-2">
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{hint}</span>}
    </span>
    <span className="relative mt-0.5 inline-flex shrink-0 items-center">
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cx(
          'h-6 w-11 rounded-full transition-colors peer-focus-visible:shadow-[var(--anel-marca)]',
          checked ? 'bg-marca' : 'bg-borda-3'
        )}
      />
      <span
        aria-hidden="true"
        className={cx(
          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </span>
  </label>
);

export default function IaCriacaoPage() {
  const [{ data, loading, error, forbidden }, reload, setData] = useAdminQuery<AiPublicConfig>(
    () => api.get<AiPublicConfig>('/admin/ai', true),
    []
  );

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<Provider>('openai');
  const [model, setModel] = useState('');
  const [editModel, setEditModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [limit, setLimit] = useState('50');
  const [features, setFeatures] = useState<AiFeatures>({ generateImage: true, editImage: true, generatePreset: true });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Preenche o formulário com o que veio do servidor.
  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setProvider(data.provider);
    setModel(data.model);
    setEditModel(data.editModel);
    setLimit(String(data.monthlyLimitPerOrg));
    setFeatures(data.features);
    setApiKey('');
  }, [data]);

  const changeProvider = (next: Provider) => {
    // Modelo que ainda é o padrão do provedor anterior acompanha a troca.
    if (!model || model === DEFAULT_MODELS[provider].model) setModel(DEFAULT_MODELS[next].model);
    if (!editModel || editModel === DEFAULT_MODELS[provider].editModel) setEditModel(DEFAULT_MODELS[next].editModel);
    setProvider(next);
    setTestResult(null);
  };

  const limitNumber = Number(limit);
  const limitError =
    limit.trim() === '' || !Number.isInteger(limitNumber) || limitNumber < 0 || limitNumber > 100000
      ? 'Use um número inteiro de 0 a 100000.'
      : null;
  const modelError = MODEL_PATTERN.test(model.trim()) ? null : 'Use só letras, números, ponto, hífen e sublinhado.';
  const editModelError = MODEL_PATTERN.test(editModel.trim()) ? null : 'Use só letras, números, ponto, hífen e sublinhado.';
  const willHaveKey = Boolean(apiKey.trim()) || Boolean(data?.hasApiKey && !data.apiKeyUnreadable);

  const save = async (extra?: { clearApiKey?: boolean }) => {
    if (limitError || modelError || editModelError) {
      toast.error('Confira os campos destacados.');
      return;
    }
    setSaving(true);
    try {
      const saved = await api.put<AiPublicConfig>(
        '/admin/ai',
        {
          enabled,
          provider,
          model: model.trim() || null,
          editModel: editModel.trim() || null,
          apiKey: extra?.clearApiKey ? null : apiKey.trim() || null,
          clearApiKey: extra?.clearApiKey ?? false,
          monthlyLimitPerOrg: limitNumber,
          features,
        },
        true
      );
      setData(() => saved);
      setApiKey('');
      toast.success(extra?.clearApiKey ? 'Chave apagada.' : 'Configuração da IA salva.');
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível salvar a configuração.'));
    } finally {
      setSaving(false);
    }
  };

  const clearKey = async () => {
    if (!window.confirm('Apagar a chave guardada? A IA para de funcionar até você cadastrar outra.')) return;
    await save({ clearApiKey: true });
  };

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.post<{ ok: boolean; message: string }>(
        '/admin/ai/test',
        {
          provider,
          ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
          model: model.trim() || null,
          editModel: editModel.trim() || null,
        },
        true
      );
      setTestResult(result);
    } catch (err) {
      const message =
        isApiError(err) && err.payload && typeof err.payload === 'object' && 'message' in err.payload
          ? String((err.payload as { message: unknown }).message)
          : errorMessage(err, 'Não foi possível testar a conexão agora.');
      setTestResult({ ok: false, message });
    } finally {
      setTesting(false);
    }
  };

  if (loading && !data) return <Loading />;
  if (forbidden) return <ForbiddenState message={error} />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const providerInfo = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title="IA de criação"
        subtitle="Gerar e editar imagens e montar telas prontas no editor dos clientes."
      />

      {data.apiKeyUnreadable && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <p className="text-[13px] leading-relaxed text-ink">
            A chave guardada não pôde ser lida. Isso acontece quando a variável <code>SETTINGS_ENCRYPTION_KEY</code>{' '}
            muda depois do cadastro. Cadastre a chave de novo para a IA voltar a funcionar.
          </p>
        </div>
      )}

      <Card title="Situação" description="Desligada, o editor mostra que a IA ainda não foi ativada.">
        <Toggle
          id="ai-enabled"
          checked={enabled}
          onChange={setEnabled}
          label="IA de criação ligada"
          hint={willHaveKey ? undefined : 'Cadastre uma chave para a IA funcionar.'}
        />
      </Card>

      <Card title="Provedor e chave" description="O custo depende do provedor e do modelo; confira na conta do provedor.">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Provedor">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={provider === p.id}
                onClick={() => changeProvider(p.id)}
                className={cx(
                  'min-h-11 rounded-lg border px-3.5 py-2.5 text-left text-sm font-semibold transition-colors',
                  provider === p.id ? 'border-marca bg-marca/5 text-ink' : 'border-borda-2 text-ink-muted hover:bg-app'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-ink-muted">{providerInfo.hint}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Modelo para gerar" htmlFor="ai-model" error={modelError} hint={`Padrão: ${DEFAULT_MODELS[provider].model}`}>
              <input
                id="ai-model"
                className={inputClass}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={DEFAULT_MODELS[provider].model}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field label="Modelo para editar" htmlFor="ai-edit-model" error={editModelError} hint={`Padrão: ${DEFAULT_MODELS[provider].editModel}`}>
              <input
                id="ai-edit-model"
                className={inputClass}
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                placeholder={DEFAULT_MODELS[provider].editModel}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
          </div>

          <Field
            label="Chave de API"
            htmlFor="ai-key"
            hint={
              data.hasApiKey && !data.apiKeyUnreadable
                ? `Chave atual termina em ${data.apiKeyHint ?? '••••'}. Deixe em branco para manter.`
                : 'Nenhuma chave cadastrada.'
            }
          >
            <div className="relative">
              <KeyRound aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input
                id="ai-key"
                type="password"
                className={cx(inputClass, 'pl-9')}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={data.hasApiKey ? 'Nova chave (opcional)' : 'Cole a chave aqui'}
                autoComplete="new-password"
                spellCheck={false}
              />
            </div>
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={test} loading={testing}>
              <PlugZap aria-hidden="true" className="h-4 w-4" /> Testar conexão
            </Button>
            {data.hasApiKey && (
              <Button type="button" variant="danger" onClick={clearKey} disabled={saving}>
                <Trash2 aria-hidden="true" className="h-4 w-4" /> Apagar chave
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            O teste confere se o provedor aceita a chave, sem gerar imagem. Com o campo vazio, testa a chave guardada.
          </p>

          {testResult && (
            <p
              role="status"
              className={cx(
                'flex items-start gap-2 rounded-lg border p-3 text-[13px]',
                testResult.ok ? 'border-marca/30 bg-marca/5 text-ink' : 'border-danger/30 bg-danger/5 text-ink'
              )}
            >
              {testResult.ok ? (
                <CheckCircle2 aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-marca" />
              ) : (
                <AlertTriangle aria-hidden="true" className="mt-px h-4 w-4 shrink-0 text-danger" />
              )}
              {testResult.message}
            </p>
          )}
        </div>
      </Card>

      <Card title="Limite e recursos" description="O limite conta gerações e edições de cada empresa por mês.">
        <div className="space-y-4">
          <Field label="Criações por empresa no mês" htmlFor="ai-limit" error={limitError} hint="0 deixa sem limite.">
            <input
              id="ai-limit"
              type="number"
              inputMode="numeric"
              min={0}
              max={100000}
              className={cx(inputClass, 'max-w-40')}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </Field>
          <div className="divide-y divide-line">
            {FEATURES.map((f) => (
              <Toggle
                key={f.key}
                id={`ai-feature-${f.key}`}
                checked={features[f.key]}
                onChange={(value) => setFeatures((current) => ({ ...current, [f.key]: value }))}
                label={f.label}
                hint={f.hint}
              />
            ))}
          </div>
          <p className="flex items-start gap-2 text-xs text-ink-muted">
            <Sparkles aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
            O plano do cliente também precisa incluir a criação com IA (recurso ia-criacao).
          </p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="button" variant="primary" onClick={() => void save()} loading={saving}>
          Salvar configuração
        </Button>
      </div>
    </div>
  );
}
