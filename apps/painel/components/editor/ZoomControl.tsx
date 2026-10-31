import React from 'react';
import { ChevronDown, Grid2x2, Minus, Plus } from 'lucide-react';
import type { DisplayWall } from '../../types';
import { isWall } from './canvasGeometry';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import './CanvasStage.css';

/** Contrato do controle de zoom. */
export interface ZoomControlProps {
  /** null = "Ajustado" (a cena cabe inteira na área). Número = escala real, 1 = 100%. */
  zoom: number | null;
  /** Escala que o Canvas calculou para caber na área (vem de onFitScaleChange). */
  fitScale: number;
  onChange: (zoom: number | null) => void;
  /** Videowall: quando presente, mostra o botão das linhas-guia das divisões. */
  wall?: DisplayWall | null;
  showGuides?: boolean;
  onToggleGuides?: () => void;
}

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 4;

/** Passos do menu, em pontos percentuais sobre o zoom atual (pedido do dono, seção 10.2). */
const ZOOM_STEPS = [-25, -50, -75, -100, 25, 50, 75, 100];

export const clampZoom = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));

// O slider é logarítmico: de 10% a 100% ocupa metade da barra, que é onde a
// pessoa mais mexe (a cena ajustada costuma ficar entre 20% e 60%).
const SLIDER_STEPS = 1000;
const toSlider = (zoom: number) => Math.round((Math.log(clampZoom(zoom) / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN)) * SLIDER_STEPS);
const fromSlider = (position: number) => ZOOM_MIN * Math.pow(ZOOM_MAX / ZOOM_MIN, position / SLIDER_STEPS);

export const ZoomControl: React.FC<ZoomControlProps> = ({ zoom, fitScale, onChange, wall, showGuides = false, onToggleGuides }) => {
  const current = clampZoom(zoom ?? (fitScale > 0 ? fitScale : 1));
  const percent = Math.round(current * 100);
  const fitted = zoom === null;
  const applyPercent = (value: number) => onChange(clampZoom(Math.round(value) / 100));
  const label = fitted ? 'Ajustado' : `${percent}%`;

  return (
    <div className="hub-zoom" role="group" aria-label="Zoom da cena">
      {isWall(wall) && onToggleGuides && (
        <button
          type="button"
          className="hub-zoom__btn hub-zoom__guides"
          aria-pressed={showGuides}
          aria-label="Divisões entre TVs"
          title={showGuides ? 'Esconder divisões entre TVs' : 'Mostrar divisões entre TVs'}
          onClick={onToggleGuides}
        >
          <Grid2x2 size={16} aria-hidden="true" />
          <span>Divisões</span>
        </button>
      )}
      <button type="button" className="hub-zoom__btn hub-zoom__icon" aria-label="Diminuir zoom" title="Diminuir zoom" disabled={current <= ZOOM_MIN} onClick={() => applyPercent(percent - 10)}>
        <Minus size={16} />
      </button>
      <input
        type="range"
        className="hub-zoom__slider"
        min={0}
        max={SLIDER_STEPS}
        step={1}
        value={toSlider(current)}
        aria-label="Zoom"
        aria-valuetext={fitted ? `Ajustado, ${percent}%` : `${percent}%`}
        style={{ '--fill': `${(toSlider(current) / SLIDER_STEPS) * 100}%` } as React.CSSProperties}
        onChange={event => onChange(clampZoom(Math.round(fromSlider(Number(event.target.value)) * 100) / 100))}
      />
      <button type="button" className="hub-zoom__btn hub-zoom__icon" aria-label="Aumentar zoom" title="Aumentar zoom" disabled={current >= ZOOM_MAX} onClick={() => applyPercent(percent + 10)}>
        <Plus size={16} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="hub-zoom__btn hub-zoom__value" aria-label={`Zoom: ${label}. Abrir opções`} title={fitted ? `Ajustado (${percent}%)` : 'Opções de zoom'}>
            <span>{label}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="hub-zoom__menu w-auto min-w-36">
          {ZOOM_STEPS.map(step => {
            const target = clampZoom((percent + step) / 100);
            return (
              <DropdownMenuItem key={step} className="min-h-11 md:min-h-9 text-base md:text-sm" disabled={Math.round(target * 100) === percent} onSelect={() => applyPercent(percent + step)}>
                {step > 0 ? `+${step}%` : `−${Math.abs(step)}%`}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-11 md:min-h-9 text-base md:text-sm font-semibold" disabled={fitted} onSelect={() => onChange(null)}>
            Ajustar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
