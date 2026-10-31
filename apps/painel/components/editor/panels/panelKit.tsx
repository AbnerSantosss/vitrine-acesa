import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import './panels.css';

/** Cabeçalho comum dos painéis: título, voltar (opcional) e fechar (gaveta no celular). */
export const PanelHeader: React.FC<{ title: string; subtitle?: string; onBack?: () => void; onClose?: () => void }> = ({ title, subtitle, onBack, onClose }) => (
  <div className="hub-panel__head">
    {onBack && (
      <button type="button" aria-label="Voltar" onClick={onBack} className="shrink-0 w-11 h-11 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-tinta-2 hover:bg-papel-3 hover:text-tinta">
        <ArrowLeft size={16} />
      </button>
    )}
    <div className="min-w-0 flex-1">
      <h3 className="text-[11px] font-black text-marca uppercase tracking-widest truncate">{title}</h3>
      {subtitle && <p className="text-xs text-tinta-3 leading-snug mt-0.5">{subtitle}</p>}
    </div>
    {onClose && (
      <button type="button" aria-label="Fechar painel" onClick={onClose} className="md:hidden shrink-0 w-11 h-11 flex items-center justify-center rounded-lg text-tinta-3 hover:bg-papel-3 hover:text-tinta">
        <X size={18} />
      </button>
    )}
  </div>
);

export const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-3 pointer-events-none" />
    <input
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full min-h-[44px] md:min-h-[36px] bg-papel-2 border border-borda-3 rounded-lg pl-9 pr-3 text-base md:text-xs text-tinta outline-none focus:border-marca focus:ring-1 focus:ring-marca"
    />
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="text-[10px] font-black text-tinta-3 uppercase tracking-widest mb-2">{children}</h4>
);

export const FieldLabel: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="text-[10px] font-black text-tinta-3 uppercase mb-1 block">{children}</label>
);

export const NoSelection: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-sm md:text-xs text-tinta-3 bg-papel-2 border border-dashed border-borda-2 rounded-lg p-3 leading-relaxed">{text}</p>
);

export const STORAGE_FAVORITES = 'telahub.editor.favoritos';
export const STORAGE_RECENTS = 'telahub.editor.recentes';

const readList = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
};

/** Lista de ids guardada no navegador (favoritos e recentes). Falha de armazenamento nunca quebra o editor. */
export function useStoredList(key: string, max = 24) {
  const [items, setItems] = useState<string[]>(() => readList(key));
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === key) setItems(readList(key)); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);
  const save = useCallback((next: string[]) => {
    setItems(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* armazenamento cheio ou bloqueado */ }
  }, [key]);
  /** Coloca o id no começo da lista (recentes). */
  const push = useCallback((id: string) => save([id, ...readList(key).filter(x => x !== id)].slice(0, max)), [key, max, save]);
  /** Liga ou desliga o id (favoritos). */
  const toggle = useCallback((id: string) => {
    const current = readList(key);
    save(current.includes(id) ? current.filter(x => x !== id) : [id, ...current].slice(0, max));
  }, [key, max, save]);
  return { items, push, toggle, has: (id: string) => items.includes(id) };
}

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
