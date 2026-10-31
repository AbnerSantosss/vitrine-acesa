import React, { useId } from 'react';

export interface QuickSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Texto mostrado ao lado do rótulo (ex.: "120%"). */
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

/** Controle deslizante com rótulo e valor, usado dentro dos popovers. */
export function QuickSlider({ label, value, min, max, step = 1, format, onChange }: QuickSliderProps) {
  const id = useId();
  const shown = format ? format(value) : String(value);
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="hub-pop-slider">
      <div className="hub-pop-slider__head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{shown}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={shown}
        style={{ '--fill': `${Math.max(0, Math.min(100, fill))}%` } as React.CSSProperties}
        onChange={event => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
    </div>
  );
}
