import React, { useEffect, useRef, useState } from 'react';
import { CalendarClock, Copy, MoreHorizontal, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Display, Page } from '../../types';
import { WidgetType } from '../../types';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ScenePreview } from './ScenePreview';
import { getCanvasGeometry } from './canvasGeometry';
import './EditorLayout.css';

export const SCENE_DURATION_MIN = 1;
export const SCENE_DURATION_MAX = 600;
export const SCENE_DURATION_DEFAULT = 15;

/** Id único para cena ou elemento. */
export function createId(prefix = ''): string {
  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}${uuid}`;
}

/** A cena não tem campo de nome: usa "Cena N", e o primeiro texto da cena quando existe. */
export function getSceneName(page: Page, idx: number): string {
  const text = [...page.layout]
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))
    .find(w => w.type === WidgetType.TEXT && (w.data.content ?? '').trim());
  const base = `Cena ${idx + 1}`;
  if (!text) return base;
  const snippet = (text.data.content ?? '').replace(/\s+/g, ' ').trim();
  return `${base}: ${snippet.length > 24 ? `${snippet.slice(0, 24)}…` : snippet}`;
}

/** Cópia da cena com ids novos (a cena e cada elemento), sem vínculo com agendamento. */
export function cloneScene(page: Page): Page {
  const copy: Page = {
    ...page,
    id: createId('p'),
    layout: page.layout.map(w => ({ ...w, i: createId(), data: { ...w.data } })),
  };
  delete copy.broadcast_id;
  delete copy.start_time;
  delete copy.end_time;
  delete copy.is_permanent;
  return copy;
}

const renumber = (pages: Page[]): Page[] => pages.map((p, i) => (p.order === i + 1 ? p : { ...p, order: i + 1 }));

function useIsPhone(): boolean {
  const query = '(max-width: 767px)';
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return match;
}

/** Campo de duração em segundos: aceita digitar à vontade e confirma ao sair do campo ou com Enter. */
const DurationField: React.FC<{ value: number; label: string; onCommit: (seconds: number) => void }> = ({ value, label, onCommit }) => {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);

  const commit = () => {
    const parsed = Math.round(Number(text));
    if (!Number.isFinite(parsed) || text.trim() === '') { setText(String(value)); return; }
    const clamped = Math.min(SCENE_DURATION_MAX, Math.max(SCENE_DURATION_MIN, parsed));
    setText(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <label className="hub-scene-card__duration">
      <input
        type="number"
        inputMode="numeric"
        min={SCENE_DURATION_MIN}
        max={SCENE_DURATION_MAX}
        value={text}
        aria-label={label}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur(); }
          else if (e.key === 'Escape') { setText(String(value)); (e.target as HTMLInputElement).blur(); }
        }}
        onFocus={e => e.target.select()}
      />
      <span aria-hidden="true">s</span>
    </label>
  );
};

interface SceneTabsProps {
  display: Display;
  setDisplay: React.Dispatch<React.SetStateAction<Display | null>>;
  activePageIdx: number;
  /** Seleciona a cena (o Editor também limpa a seleção e envia o que está pendente). */
  onSelectPage: (idx: number) => void;
  /** Pede a exclusão (o Editor abre a confirmação). */
  removePage: (idx: number) => void;
  /** Desenha as divisões do videowall nas miniaturas. */
  showSeams?: boolean;
}

/** Faixa de cenas com miniatura real, duração editável e menu de ações. */
export const SceneTabs: React.FC<SceneTabsProps> = ({ display, setDisplay, activePageIdx, onSelectPage, removePage, showSeams = false }) => {
  const phone = useIsPhone();
  const stripRef = useRef<HTMLDivElement>(null);
  const total = display.pages.length;

  // Dimensões do cartão (iguais às do CSS): quadro 4:3 com a cena centralizada.
  const cardW = phone ? 124 : 160;
  const frameW = cardW - 4;
  const frameH = Math.round(cardW * 0.75) - 4;
  const geometry = getCanvasGeometry(display.orientation, display.wall);
  const ratio = geometry.width / geometry.height;
  const previewW = Math.floor(Math.min(frameW - 8, (frameH - 8) * ratio));

  useEffect(() => {
    const active = stripRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [activePageIdx, total]);

  const updatePages = (fn: (pages: Page[]) => Page[]) =>
    setDisplay(d => (d ? { ...d, pages: renumber(fn(d.pages)) } : d));

  const setDuration = (idx: number, seconds: number) =>
    updatePages(pages => pages.map((p, i) => (i === idx ? { ...p, duration: seconds } : p)));

  const duplicate = (idx: number) => {
    updatePages(pages => {
      const source = pages[idx];
      if (!source) return pages;
      const next = [...pages];
      next.splice(idx + 1, 0, cloneScene(source));
      return next;
    });
    onSelectPage(idx + 1);
  };

  const move = (idx: number, delta: -1 | 1) => {
    const to = idx + delta;
    if (to < 0 || to >= total) return;
    updatePages(pages => {
      const next = [...pages];
      const [page] = next.splice(idx, 1);
      next.splice(to, 0, page);
      return next;
    });
    if (activePageIdx === idx) onSelectPage(to);
    else if (activePageIdx === to) onSelectPage(idx);
  };

  const addScene = () => {
    updatePages(pages => [...pages, { id: createId('p'), order: pages.length + 1, duration: SCENE_DURATION_DEFAULT, layout: [] }]);
    onSelectPage(total);
  };

  return (
    <nav className="hub-scenes" ref={stripRef} aria-label="Cenas da tela">
      {display.pages.map((page, idx) => {
        const active = idx === activePageIdx;
        const name = getSceneName(page, idx);
        return (
          <div key={page.id} className="hub-scene-card" data-active={active}>
            <button
              type="button"
              className="hub-scene-card__frame"
              aria-current={active ? 'true' : undefined}
              aria-label={`${name}, ${page.duration} segundos${active ? ', cena aberta' : ''}`}
              onClick={() => onSelectPage(idx)}
            >
              <span className="hub-scene-card__badge" aria-hidden="true">{idx + 1}</span>
              {page.broadcast_id && (
                <span className="hub-scene-card__sched" title="Cena de um comunicado agendado" aria-hidden="true"><CalendarClock size={13} /></span>
              )}
              <ScenePreview page={page} orientation={display.orientation} wall={display.wall} width={previewW} showSeams={showSeams} />
            </button>
            <div className="hub-scene-card__foot">
              <DurationField value={page.duration} label={`Duração da cena ${idx + 1} em segundos`} onCommit={s => setDuration(idx, s)} />
              <span className="hub-scene-card__name" title={name}>{name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="hub-scene-card__menu" aria-label={`Ações da cena ${idx + 1}`}>
                    <MoreHorizontal size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 min-w-52">
                  <DropdownMenuItem className="min-h-11 text-sm md:min-h-9" onSelect={() => duplicate(idx)}>
                    <Copy size={16} /> Duplicar cena
                  </DropdownMenuItem>
                  <DropdownMenuItem className="min-h-11 text-sm md:min-h-9" disabled={idx === 0} onSelect={() => move(idx, -1)}>
                    <ArrowLeft size={16} /> Mover para a esquerda
                  </DropdownMenuItem>
                  <DropdownMenuItem className="min-h-11 text-sm md:min-h-9" disabled={idx === total - 1} onSelect={() => move(idx, 1)}>
                    <ArrowRight size={16} /> Mover para a direita
                  </DropdownMenuItem>
                  {total > 1 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" className="min-h-11 text-sm md:min-h-9" onSelect={() => removePage(idx)}>
                        <Trash2 size={16} /> Excluir cena
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
      <button type="button" className="hub-scene-new" onClick={addScene}>
        <Plus size={22} aria-hidden="true" />
        Nova cena
      </button>
    </nav>
  );
};
