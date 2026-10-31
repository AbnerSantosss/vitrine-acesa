import React, { useEffect, useState } from 'react';
import { QuickPopover } from './QuickPopover';

/** Cores da marca e as mais pedidas em cartaz de comércio. */
export const QUICK_COLORS = [
  '#ffffff', '#000000', '#0b1b2b', '#083d65', '#2e7ce1', '#02c2cd',
  '#16a34a', '#facc15', '#f97316', '#dc2626', '#db2777', '#7c3aed',
  '#94a3b8', '#f5e6c8',
];

const HEX = /^#[0-9a-f]{6}$/i;
const expandHex = (value: string) => /^#[0-9a-f]{3}$/i.test(value) ? `#${value.slice(1).split('').map(c => c + c).join('')}` : value;

export interface QuickColorProps {
  label: string;
  value: string | undefined;
  fallback?: string;
  onChange: (value: string) => void;
  /** Ícone opcional dentro do botão (ex.: letra "A" para cor do texto). */
  icon?: React.ReactNode;
  /** Mostra a opção "Sem cor" (contorno de forma, por exemplo). */
  allowNone?: boolean;
}

/** Botão com amostra da cor e popover com paleta, seletor livre e código hex. */
export function QuickColor({ label, value, fallback = '#ffffff', onChange, icon, allowNone }: QuickColorProps) {
  const isNone = allowNone && (!value || value === 'none' || value === 'transparent');
  const current = HEX.test(expandHex(value || '')) ? expandHex(value as string) : fallback;
  const [draft, setDraft] = useState(current);
  useEffect(() => setDraft(current), [current]);

  const commitDraft = () => {
    const next = expandHex(draft.trim().startsWith('#') ? draft.trim() : `#${draft.trim()}`);
    if (HEX.test(next)) onChange(next.toLowerCase());
    else setDraft(current);
  };

  return (
    <QuickPopover
      label={label}
      trigger={
        <button type="button" className="hub-quick-icon hub-quick-swatch" aria-label={label} title={label}>
          {icon}
          <span className={`hub-quick-swatch__chip ${isNone ? 'is-none' : ''}`} style={isNone ? undefined : { background: current }} aria-hidden="true" />
        </button>
      }
    >
      <div className="hub-pop-colors" role="group" aria-label="Cores prontas">
        {allowNone && (
          <button type="button" className={`hub-pop-color is-none ${isNone ? 'is-active' : ''}`} aria-label="Sem cor" title="Sem cor" aria-pressed={!!isNone} onClick={() => onChange('none')} />
        )}
        {QUICK_COLORS.map(color => (
          <button
            key={color}
            type="button"
            className={`hub-pop-color ${!isNone && current.toLowerCase() === color ? 'is-active' : ''}`}
            style={{ background: color }}
            aria-label={`Cor ${color}`}
            title={color}
            aria-pressed={!isNone && current.toLowerCase() === color}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
      <div className="hub-pop-row">
        <label className="hub-pop-picker" title="Escolher outra cor">
          <span className="hub-quick-sr-only">Escolher outra cor</span>
          <input type="color" value={current} onChange={event => onChange(event.target.value)} />
        </label>
        <label className="hub-pop-hex">
          <span className="hub-quick-sr-only">Código da cor</span>
          <input
            type="text"
            inputMode="text"
            spellCheck={false}
            maxLength={7}
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={event => { if (event.key === 'Enter') commitDraft(); }}
          />
        </label>
      </div>
    </QuickPopover>
  );
}
