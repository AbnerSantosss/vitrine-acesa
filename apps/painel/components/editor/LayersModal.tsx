import React, { useState } from 'react';
import {
  Layers, X, ImageIcon, Film, Type, Clock, CalendarDays, CloudSun, LayoutDashboard, Rss, Globe, Sparkles,
  StickyNote, ListTodo, Timer, ClipboardList, Utensils, TrendingUp, Aperture, FileText, BookOpen, BarChart3,
  Code2, Database, Trash2, GripVertical, ArrowUp, ArrowDown, Lock, LockOpen, SlidersHorizontal, Shapes, Square, Clapperboard,
} from 'lucide-react';
import type { Display, LayoutItem, Page } from '../../types';
import { WidgetType } from '../../types';
import { WIDGET_LABELS } from './ScenePreview';
import './EditorLayout.css';

export type LayerMove = 'up' | 'down' | 'top' | 'bottom';

const BASE_Z = 10;
const zOf = (w: LayoutItem) => w.data.zIndex ?? BASE_Z;

/** Camadas da frente para o fundo (a mais alta primeiro). Empate: o que vem depois no array fica na frente. */
export function sortLayersFrontToBack(layout: LayoutItem[]): LayoutItem[] {
  return layout
    .map((w, i) => ({ w, i }))
    .sort((a, b) => (zOf(b.w) - zOf(a.w)) || (b.i - a.i))
    .map(x => x.w);
}

/**
 * Grava a ordem frente-fundo: reatribui zIndex (10 + posição) e devolve o array do fundo para a frente,
 * de modo que a ordem do array e o zIndex nunca discordem. Não altera objetos recebidos.
 */
function applyLayerOrder(frontToBack: LayoutItem[]): LayoutItem[] {
  const n = frontToBack.length;
  return frontToBack
    .map((w, idx) => {
      const z = BASE_Z + (n - 1 - idx);
      return w.data.zIndex === z ? w : { ...w, data: { ...w.data, zIndex: z } };
    })
    .reverse();
}

/** Sobe, desce, leva ao topo ou ao fundo. Devolve o mesmo array se nada mudar. */
export function reorderLayers(layout: LayoutItem[], id: string, move: LayerMove): LayoutItem[] {
  const sorted = sortLayersFrontToBack(layout);
  const from = sorted.findIndex(w => w.i === id);
  if (from === -1) return layout;
  const last = sorted.length - 1;
  const to = move === 'up' ? Math.max(0, from - 1) : move === 'down' ? Math.min(last, from + 1) : move === 'top' ? 0 : last;
  if (to === from) return layout;
  const [item] = sorted.splice(from, 1);
  sorted.splice(to, 0, item);
  return applyLayerOrder(sorted);
}

/** Arrastar e soltar: leva a camada `id` para a posição da camada `targetId`. */
export function moveLayerTo(layout: LayoutItem[], id: string, targetId: string): LayoutItem[] {
  if (id === targetId) return layout;
  const sorted = sortLayersFrontToBack(layout);
  const from = sorted.findIndex(w => w.i === id);
  const to = sorted.findIndex(w => w.i === targetId);
  if (from === -1 || to === -1) return layout;
  const [item] = sorted.splice(from, 1);
  sorted.splice(to, 0, item);
  return applyLayerOrder(sorted);
}

const SHAPE_NAMES: Record<string, string> = {
  rect: 'Retângulo', rounded: 'Retângulo arredondado', circle: 'Círculo', pill: 'Pílula', triangle: 'Triângulo',
  star: 'Estrela', burst: 'Explosão', line: 'Linha', arrow: 'Seta',
};

const humanize = (id: string) => id.replace(/[-_]+/g, ' ').replace(/^\w/, c => c.toUpperCase());

/** Nome amigável da camada: o conteúdo quando existe, senão o tipo. */
export function describeLayer(w: LayoutItem): { name: string; typeLabel: string } {
  const typeLabel = WIDGET_LABELS[w.type] ?? 'Elemento';
  let name = typeLabel;
  if (w.type === WidgetType.TEXT) {
    const text = (w.data.content ?? '').replace(/\s+/g, ' ').trim();
    name = text ? (text.length > 36 ? `${text.slice(0, 36)}…` : text) : 'Texto vazio';
  } else if (w.type === WidgetType.ICON && w.data.iconConfig?.name) {
    name = humanize(w.data.iconConfig.name);
  } else if (w.type === WidgetType.SHAPE && w.data.shapeConfig?.kind) {
    name = SHAPE_NAMES[w.data.shapeConfig.kind] ?? typeLabel;
  } else if (w.type === WidgetType.MOTION && w.data.motionConfig?.presetId) {
    name = humanize(w.data.motionConfig.presetId);
  }
  return { name, typeLabel };
}

type IconComp = React.ComponentType<{ size?: number; strokeWidth?: number }>;

const TYPE_VISUAL: Partial<Record<WidgetType, { Icon: IconComp; color: string }>> = {
  [WidgetType.TEXT]: { Icon: Type, color: '#083d65' },
  [WidgetType.IMAGE]: { Icon: ImageIcon, color: '#0e7490' },
  [WidgetType.GIF]: { Icon: Sparkles, color: '#0e7490' },
  [WidgetType.VIDEO]: { Icon: Film, color: '#0e7490' },
  [WidgetType.ICON]: { Icon: Shapes, color: '#6d28d9' },
  [WidgetType.SHAPE]: { Icon: Square, color: '#6d28d9' },
  [WidgetType.MOTION]: { Icon: Clapperboard, color: '#6d28d9' },
  [WidgetType.CLOCK]: { Icon: Clock, color: '#b45309' },
  [WidgetType.CALENDAR]: { Icon: CalendarDays, color: '#b45309' },
  [WidgetType.WEATHER]: { Icon: CloudSun, color: '#b45309' },
  [WidgetType.FULL_INFO]: { Icon: LayoutDashboard, color: '#b45309' },
  [WidgetType.RSS]: { Icon: Rss, color: '#b45309' },
  [WidgetType.NOTES]: { Icon: StickyNote, color: '#b45309' },
  [WidgetType.TODO]: { Icon: ListTodo, color: '#b45309' },
  [WidgetType.COUNTDOWN]: { Icon: Timer, color: '#b45309' },
  [WidgetType.CHORES]: { Icon: ClipboardList, color: '#b45309' },
  [WidgetType.MEAL_PLAN]: { Icon: Utensils, color: '#b45309' },
  [WidgetType.MARKET_WATCH]: { Icon: TrendingUp, color: '#b45309' },
  [WidgetType.IFRAME]: { Icon: Globe, color: '#475569' },
  [WidgetType.BROWSER_SNAPSHOT]: { Icon: Aperture, color: '#475569' },
  [WidgetType.GOOGLE_DOCS]: { Icon: FileText, color: '#475569' },
  [WidgetType.OFFICE_DOCS]: { Icon: BookOpen, color: '#475569' },
  [WidgetType.POWER_BI]: { Icon: BarChart3, color: '#475569' },
  [WidgetType.EMBED_HTML]: { Icon: Code2, color: '#475569' },
  [WidgetType.AIRTABLE]: { Icon: Database, color: '#475569' },
  [WidgetType.PDF_DOCUMENT]: { Icon: FileText, color: '#475569' },
};

interface LayersModalProps {
  display: Display;
  setDisplay: React.Dispatch<React.SetStateAction<Display | null>>;
  activePageIdx: number;
  activePage: Page;
  selectedWidget: string | null;
  setSelectedWidget: React.Dispatch<React.SetStateAction<string | null>>;
  removeWidget: (wId: string) => void;
  onEditProperties: () => void;
  /** Mostra o botão de fechar (o painel volta para a biblioteca). */
  onClose?: () => void;
  /** Compatibilidade com o uso antigo: false esconde o painel. */
  showLayersModal?: boolean;
  setShowLayersModal?: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Conteúdo do painel Camadas (vai no `layersSlot` da biblioteca à esquerda). Não é mais um bloco fixo
 * ao lado do canvas, então não espreme a área de edição.
 */
export const LayersModal: React.FC<LayersModalProps> = ({
  setDisplay, activePageIdx, activePage, selectedWidget, setSelectedWidget, removeWidget, onEditProperties,
  onClose, showLayersModal = true, setShowLayersModal,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (!showLayersModal) return null;
  const close = onClose ?? (setShowLayersModal ? () => setShowLayersModal(false) : undefined);

  const layers = sortLayersFrontToBack(activePage.layout);
  const total = layers.length;

  const updateLayout = (fn: (layout: LayoutItem[]) => LayoutItem[]) => {
    setDisplay(d => {
      if (!d) return d;
      const page = d.pages[activePageIdx];
      if (!page) return d;
      const next = fn(page.layout);
      if (next === page.layout) return d;
      return { ...d, pages: d.pages.map((p, i) => (i === activePageIdx ? { ...p, layout: next } : p)) };
    });
  };

  const toggleLock = (id: string) =>
    updateLayout(layout => layout.map(w => (w.i === id ? { ...w, data: { ...w.data, locked: !w.data.locked } } : w)));

  const endDrag = () => { setDraggedId(null); setOverId(null); };

  return (
    <div className="hub-layers-panel" id="editor-layers" role="region" aria-label="Camadas da cena">
      <div className="hub-layers-panel__head">
        <h3 className="hub-layers-panel__title">
          <Layers size={18} aria-hidden="true" /> Camadas
          <span className="hub-layers-panel__count" aria-label={`${total} ${total === 1 ? 'camada' : 'camadas'}`}>{total}</span>
        </h3>
        {close && (
          <button type="button" className="hub-layer-btn" aria-label="Fechar painel de camadas" onClick={close}>
            <X size={18} />
          </button>
        )}
      </div>

      {selectedWidget && (
        <button type="button" className="hub-layers-props" onClick={onEditProperties}>
          <SlidersHorizontal size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: '-3px' }} aria-hidden="true" />
          Editar propriedades
        </button>
      )}

      {total > 1 && (
        <div className="hub-layers-panel__edge" aria-hidden="true">
          <span>Na frente</span>
          <span>No fundo</span>
        </div>
      )}

      {total === 0 ? (
        <div className="hub-layers-empty">Nenhum elemento nesta cena. Adicione textos, imagens ou formas pela biblioteca.</div>
      ) : (
        <ul className="hub-layers-list" aria-label="Elementos da cena, do que está na frente para o que está no fundo">
          {layers.map((layer, index) => {
            const visual = TYPE_VISUAL[layer.type];
            const Icon: IconComp = visual?.Icon ?? Layers;
            const { name, typeLabel } = describeLayer(layer);
            const selected = selectedWidget === layer.i;
            const locked = !!layer.data.locked;
            return (
              <li
                key={layer.i}
                className="hub-layer-row"
                data-selected={selected}
                data-locked={locked}
                data-dragging={draggedId === layer.i}
                data-over={overId === layer.i && draggedId !== layer.i}
                tabIndex={0}
                aria-current={selected ? 'true' : undefined}
                draggable
                onClick={() => setSelectedWidget(layer.i)}
                onKeyDown={e => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedWidget(layer.i); }
                  else if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); updateLayout(l => reorderLayers(l, layer.i, 'up')); }
                  else if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); updateLayout(l => reorderLayers(l, layer.i, 'down')); }
                }}
                onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', layer.i); setDraggedId(layer.i); }}
                onDragOver={e => { if (!draggedId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (overId !== layer.i) setOverId(layer.i); }}
                onDragLeave={() => setOverId(prev => (prev === layer.i ? null : prev))}
                onDrop={e => {
                  e.preventDefault();
                  if (draggedId) updateLayout(l => moveLayerTo(l, draggedId, layer.i));
                  endDrag();
                }}
                onDragEnd={endDrag}
              >
                <span className="hub-layer-row__grip" aria-hidden="true"><GripVertical size={16} /></span>
                <span className="hub-layer-row__icon" style={{ background: visual?.color ?? '#083d65' }} aria-hidden="true">
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className="hub-layer-row__text">
                  <span className="hub-layer-row__name">{name}</span>
                  <span className="hub-layer-row__type">
                    {typeLabel}
                    {locked ? ' · Travado' : ''}
                    {total > 1 && index === 0 ? ' · Na frente' : ''}
                    {total > 1 && index === total - 1 ? ' · No fundo' : ''}
                  </span>
                </span>
                <span className="hub-layer-row__actions">
                  <button
                    type="button" className="hub-layer-btn" aria-label={`Trazer ${name} para frente`} title="Trazer para frente"
                    disabled={index === 0}
                    onClick={e => { e.stopPropagation(); updateLayout(l => reorderLayers(l, layer.i, 'up')); }}
                  ><ArrowUp size={16} /></button>
                  <button
                    type="button" className="hub-layer-btn" aria-label={`Enviar ${name} para trás`} title="Enviar para trás"
                    disabled={index === total - 1}
                    onClick={e => { e.stopPropagation(); updateLayout(l => reorderLayers(l, layer.i, 'down')); }}
                  ><ArrowDown size={16} /></button>
                  <button
                    type="button" className="hub-layer-btn" aria-pressed={locked}
                    aria-label={locked ? `Destravar ${name}` : `Travar ${name}`} title={locked ? 'Destravar' : 'Travar posição'}
                    onClick={e => { e.stopPropagation(); toggleLock(layer.i); }}
                  >{locked ? <Lock size={16} /> : <LockOpen size={16} />}</button>
                  <button
                    type="button" className="hub-layer-btn hub-layer-btn--danger" aria-label={`Excluir ${name}`} title="Excluir"
                    onClick={e => { e.stopPropagation(); removeWidget(layer.i); }}
                  ><Trash2 size={16} /></button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {total > 1 && (
        <p className="hub-layers-panel__hint">
          Arraste para mudar a ordem, ou use as setas. O que está no alto da lista aparece na frente dos outros.
        </p>
      )}
    </div>
  );
};
