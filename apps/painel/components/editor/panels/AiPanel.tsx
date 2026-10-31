import React, { useCallback, useEffect, useState } from 'react';
import { ImagePlus, LayoutTemplate, Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { WidgetType, type LayoutItem, type WidgetData } from '../../../types';
import {
  AI_PROMPT_MAX,
  editImage,
  generateImage,
  generatePreset,
  getAiStatus,
  type AiPresetResult,
  type AiStatus,
} from '../../../services/ai';
import { SEGMENTS } from '../presets/sceneTemplates';
import { FieldLabel, NoSelection, PanelHeader } from './panelKit';

/**
 * Painel de IA da coluna esquerda.
 * mode 'create' gera imagem ou tela pronta; mode 'edit' edita a imagem selecionada por prompt.
 * A chave e o provedor ficam no servidor: aqui só vai o pedido.
 */
export interface AiPanelProps {
  mode: 'create' | 'edit';
  orientation: 'horizontal' | 'vertical';
  currentWidget?: LayoutItem | null;
  /** Insere uma imagem nova no canvas. */
  onInsertImage: (url: string) => void;
  /** Aplica uma cena gerada (troca o layout da cena ativa). */
  onApplyPreset: (result: AiPresetResult) => void;
  updateWidgetData?: (id: string, data: Partial<WidgetData>) => void;
}

type Tab = 'image' | 'preset';

const btnBase =
  'w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimary = `${btnBase} bg-marca text-white hover:opacity-90`;
const btnSecondary = `${btnBase} border border-borda-3 bg-papel-2 text-tinta hover:bg-papel-3`;
const chipClass = 'hub-chip min-h-[44px] md:min-h-[32px]';

const PLACEHOLDER: Record<Tab | 'edit', string> = {
  image: 'Ex.: pão francês saindo do forno, luz quente, fundo de madeira',
  preset: 'Ex.: Promoção de inverno. Casacos a partir de R$ 89,90',
  edit: 'Ex.: troque o fundo por uma vitrine iluminada',
};

const remainingText = (status: AiStatus): string | null => {
  if (status.remaining == null) return null;
  const n = status.remaining;
  return n === 1 ? 'Resta 1 criação este mês.' : `Restam ${n} criações este mês.`;
};

export const AiPanel: React.FC<AiPanelProps> = ({
  mode,
  orientation,
  currentWidget,
  onInsertImage,
  onApplyPreset,
  updateWidgetData,
}) => {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [tab, setTab] = useState<Tab>('image');
  const [prompt, setPrompt] = useState('');
  const [segment, setSegment] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [presetResult, setPresetResult] = useState<AiPresetResult | null>(null);

  const loadStatus = useCallback(async () => {
    setStatus(await getAiStatus());
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // Se só um dos recursos de criação estiver ligado, abre direto nele.
  useEffect(() => {
    if (!status) return;
    if (tab === 'image' && !status.features.generateImage && status.features.generatePreset) setTab('preset');
    if (tab === 'preset' && !status.features.generatePreset && status.features.generateImage) setTab('image');
  }, [status, tab]);

  const editTarget =
    mode === 'edit' && currentWidget?.type === WidgetType.IMAGE && currentWidget.data?.url ? currentWidget : null;

  const trimmed = prompt.trim();
  const tooShort = trimmed.length < 3;

  const run = async () => {
    if (busy || tooShort) return;
    if (mode === 'edit' && !editTarget?.data.url) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'edit' && editTarget?.data.url) {
        const result = await editImage({ imageUrl: editTarget.data.url, prompt: trimmed, orientation });
        setImageResult(result.url);
      } else if (tab === 'image') {
        const result = await generateImage({ prompt: trimmed, orientation, segment: segment || undefined });
        setImageResult(result.url);
        setPresetResult(null);
      } else {
        const result = await generatePreset({ prompt: trimmed, orientation, segment: segment || undefined });
        setPresetResult(result);
        setImageResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o pedido agora.');
    } finally {
      setBusy(false);
      // Atualiza o saldo do mês depois de cada pedido.
      void loadStatus();
    }
  };

  const title = mode === 'edit' ? 'Editar com IA' : 'Criar com IA';

  if (!status) {
    return (
      <div className="hub-panel">
        <PanelHeader title={title} />
        <div className="hub-panel__body flex items-center gap-2 text-sm text-tinta-3">
          <Loader2 size={16} className="animate-spin" /> Carregando
        </div>
      </div>
    );
  }

  const canCreateImage = status.enabled && status.features.generateImage;
  const canCreatePreset = status.enabled && status.features.generatePreset;
  const canEdit = status.enabled && status.features.editImage;
  const available = mode === 'edit' ? canEdit : canCreateImage || canCreatePreset;

  if (!available) {
    return (
      <div className="hub-panel">
        <PanelHeader title={title} />
        <div className="hub-panel__body space-y-3">
          <div className="rounded-lg border border-borda-2 bg-papel-2 p-4">
            <Sparkles size={20} className="text-marca mb-2" />
            <p className="text-base md:text-sm text-tinta leading-relaxed">
              {status.enabled && mode === 'edit'
                ? 'A edição de imagem com IA está desligada no momento.'
                : status.reason || 'A criação com IA não está disponível agora.'}
            </p>
          </div>
          <button type="button" className={btnSecondary} onClick={() => void loadStatus()}>
            <RefreshCw size={16} /> Verificar de novo
          </button>
        </div>
      </div>
    );
  }

  const left = remainingText(status);
  const placeholder = mode === 'edit' ? PLACEHOLDER.edit : PLACEHOLDER[tab];
  const actionLabel = mode === 'edit' ? 'Editar imagem' : tab === 'image' ? 'Gerar imagem' : 'Gerar tela pronta';
  const showForm = mode === 'create' || Boolean(editTarget);

  return (
    <div className="hub-panel">
      <PanelHeader
        title={title}
        subtitle={
          mode === 'edit'
            ? 'Descreva a mudança. A imagem original continua na biblioteca.'
            : 'Descreva o que você quer. O resultado entra como item editável.'
        }
      />
      <div className="hub-panel__body space-y-4">
        {mode === 'create' && canCreateImage && canCreatePreset && (
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="O que criar">
            {(
              [
                { id: 'image', label: 'Imagem', icon: ImagePlus },
                { id: 'preset', label: 'Tela pronta', icon: LayoutTemplate },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-bold ${
                  tab === id ? 'border-marca bg-marca text-white' : 'border-borda-3 bg-papel-2 text-tinta-2 hover:bg-papel-3'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        )}

        {mode === 'edit' && !editTarget && <NoSelection text="Selecione uma imagem na cena para editar com IA." />}

        {mode === 'edit' && editTarget?.data.url && (
          <div>
            <FieldLabel>Imagem selecionada</FieldLabel>
            <img
              src={editTarget.data.url}
              alt="Imagem selecionada"
              className="w-full max-h-40 object-contain rounded-lg border border-borda-2 bg-papel-2"
            />
          </div>
        )}

        {mode === 'create' && (
          <div>
            <FieldLabel>Segmento (opcional)</FieldLabel>
            <div className="hub-chip-row" role="group" aria-label="Segmento">
              <button type="button" className={chipClass} aria-pressed={segment === ''} onClick={() => setSegment('')}>
                Qualquer
              </button>
              {SEGMENTS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={chipClass}
                  aria-pressed={segment === s.id}
                  onClick={() => setSegment(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div>
            <FieldLabel htmlFor="ai-prompt">
              {mode === 'edit' ? 'O que mudar' : tab === 'preset' ? 'Texto e tema da tela' : 'Descrição da imagem'}
            </FieldLabel>
            <textarea
              id="ai-prompt"
              value={prompt}
              maxLength={AI_PROMPT_MAX}
              rows={4}
              onChange={e => setPrompt(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-papel-2 border border-borda-3 rounded-lg p-3 text-base md:text-sm text-tinta outline-none focus:border-marca focus:ring-1 focus:ring-marca resize-y"
            />
            <div className="flex justify-between gap-2 text-xs text-tinta-3 mt-1">
              <span>{mode === 'create' && tab === 'preset' ? 'Os textos da tela saem do que você escrever.' : ''}</span>
              <span aria-live="polite" className="shrink-0">
                {prompt.length}/{AI_PROMPT_MAX}
              </span>
            </div>
          </div>
        )}

        {showForm && (
          <button type="button" className={btnPrimary} disabled={busy || tooShort} onClick={() => void run()}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {busy ? 'Criando, pode levar até um minuto' : actionLabel}
          </button>
        )}

        {left && <p className="text-xs text-tinta-3 text-center">{left}</p>}

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        {imageResult && (
          <div className="space-y-2">
            <FieldLabel>Resultado</FieldLabel>
            <img
              src={imageResult}
              alt="Imagem criada com IA"
              className="w-full max-h-56 object-contain rounded-lg border border-borda-2 bg-papel-2"
            />
            {mode === 'edit' && editTarget && updateWidgetData ? (
              <>
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={() => {
                    updateWidgetData(editTarget.i, { url: imageResult });
                    setImageResult(null);
                    setPrompt('');
                  }}
                >
                  Trocar a imagem da cena
                </button>
                <button type="button" className={btnSecondary} onClick={() => onInsertImage(imageResult)}>
                  Inserir como imagem nova
                </button>
              </>
            ) : (
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  onInsertImage(imageResult);
                  setImageResult(null);
                }}
              >
                Inserir na cena
              </button>
            )}
          </div>
        )}

        {presetResult && (
          <div className="space-y-2">
            <FieldLabel>Tela pronta</FieldLabel>
            <div
              className={`relative w-full overflow-hidden rounded-lg border border-borda-2 bg-papel-3 ${
                orientation === 'vertical' ? 'aspect-[9/16] max-h-72 mx-auto' : 'aspect-video'
              }`}
            >
              {presetResult.page?.backgroundImage && (
                <img src={presetResult.page.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs text-tinta-3">
              Aplicar troca os itens da cena atual por esta tela. Os textos continuam editáveis.
            </p>
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                onApplyPreset(presetResult);
                setPresetResult(null);
              }}
            >
              Aplicar na cena
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiPanel;
