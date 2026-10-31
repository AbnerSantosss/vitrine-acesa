import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Display } from '../types';

/** Foco em campo de texto, lista ou área editável: os atalhos do editor não valem ali. */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    // Botões, caixas e cores não recebem texto; o resto sim.
    return !['button', 'checkbox', 'radio', 'submit', 'reset', 'color', 'range', 'file'].includes(type);
  }
  return false;
}

/** Cópia independente do estado. Guardar a cópia (e não a referência) protege o histórico de código que altera cenas no lugar. */
function snapshot(display: Display): Display {
  try {
    return structuredClone(display);
  } catch {
    return JSON.parse(JSON.stringify(display)) as Display;
  }
}

interface Options {
  /** Máximo de estados guardados para desfazer. */
  limit?: number;
  /** Mudanças seguidas dentro desta janela (arrastar, digitar) viram um passo só. */
  groupMs?: number;
  /** false desliga os atalhos de teclado (ex.: com um diálogo aberto). */
  shortcutsEnabled?: boolean;
}

/**
 * Desfazer e refazer do editor. Observa o `display`: cada troca de objeto vira
 * um passo, com mudanças em rajada agrupadas. Atalhos: Ctrl/Cmd+Z desfaz,
 * Ctrl/Cmd+Shift+Z e Ctrl/Cmd+Y refazem, ignorados em campos de texto.
 *
 * O histórico guarda cópias do estado. Mesmo assim, o editor deve atualizar o
 * `display` de forma imutável: se só a referência de `display` não mudar, a
 * alteração não é percebida.
 */
export function useEditorHistory(
  display: Display | null,
  setDisplay: Dispatch<SetStateAction<Display | null>>,
  { limit = 50, groupMs = 600, shortcutsEnabled = true }: Options = {},
) {
  const past = useRef<Display[]>([]);
  const future = useRef<Display[]>([]);
  const present = useRef<Display | null>(null);
  const presentSnap = useRef<Display | null>(null);
  const lastChangeAt = useRef(0);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!display) { present.current = null; presentSnap.current = null; return; }
    if (!present.current || present.current.id !== display.id) {
      // Primeira carga (ou outra tela): começa uma história nova.
      present.current = display;
      presentSnap.current = snapshot(display);
      past.current = [];
      future.current = [];
      lastChangeAt.current = 0;
      rerender();
      return;
    }
    if (display === present.current) return;

    const now = Date.now();
    if (now - lastChangeAt.current >= groupMs && presentSnap.current) {
      past.current.push(presentSnap.current);
      if (past.current.length > limit) past.current.shift();
    }
    lastChangeAt.current = now;
    future.current = [];
    present.current = display;
    presentSnap.current = snapshot(display);
    rerender();
  }, [display, groupMs, limit]);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous || !present.current || !presentSnap.current) return;
    future.current.push(presentSnap.current);
    present.current = previous;
    presentSnap.current = snapshot(previous);
    lastChangeAt.current = 0;
    setDisplay(previous);
    rerender();
  }, [setDisplay]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next || !present.current || !presentSnap.current) return;
    past.current.push(presentSnap.current);
    present.current = next;
    presentSnap.current = snapshot(next);
    lastChangeAt.current = 0;
    setDisplay(next);
    rerender();
  }, [setDisplay]);

  useEffect(() => {
    if (!shortcutsEnabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) { event.preventDefault(); undo(); }
      else if ((key === 'z' && event.shiftKey) || key === 'y') { event.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcutsEnabled, undo, redo]);

  return {
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
