import React from 'react';
import type { WidgetData } from '../../types';
import { getContainerStyle, getEffectFilter } from '../editor/widgetStyles';

const burstPoints = Array.from({ length: 32 }, (_, i) => {
  const r = i % 2 ? 40 : 49;
  const a = (Math.PI * 2 * i) / 32;
  return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

/** Forma vetorial editável (fundo, selo, destaque). */
export const ShapeWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const cfg = data.shapeConfig || { kind: 'rounded' };
  const fill = cfg.fill || '#02c2cd';
  const stroke = cfg.stroke || 'none';
  const sw = cfg.strokeWidth ?? 0;
  const common = { fill, stroke, strokeWidth: sw, vectorEffect: 'non-scaling-stroke' as const };
  let shape: React.ReactNode;
  switch (cfg.kind) {
    case 'circle': shape = <ellipse cx="50" cy="50" rx="49" ry="49" {...common} />; break;
    case 'pill': shape = <rect x="1" y="1" width="98" height="98" rx="49" {...common} />; break;
    case 'triangle': shape = <polygon points="50,2 98,98 2,98" {...common} />; break;
    case 'star': shape = <polygon points="50,3 61,37 97,37 68,59 79,95 50,73 21,95 32,59 3,37 39,37" {...common} />; break;
    case 'burst': shape = <polygon points={burstPoints} {...common} />; break;
    case 'line': shape = <line x1="0" y1="50" x2="100" y2="50" stroke={fill} strokeWidth={Math.max(2, sw || 4)} vectorEffect="non-scaling-stroke" />; break;
    case 'arrow': shape = <polygon points="2,38 64,38 64,14 98,50 64,86 64,62 2,62" {...common} />; break;
    case 'rect': shape = <rect x="1" y="1" width="98" height="98" {...common} />; break;
    default: shape = <rect x="1" y="1" width="98" height="98" rx="10" {...common} />;
  }
  const container = getContainerStyle(data.effects);
  const filter = getEffectFilter(data.effects);
  const svg = (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full block" style={{ filter: container ? undefined : filter, overflow: 'visible' }} aria-hidden="true">
      {shape}
    </svg>
  );
  if (!container) return svg;
  // Bloco de fundo (quadrado, retângulo, círculo ou pílula) em volta da forma.
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ containerType: 'size' }}>
      <div style={{ ...container, filter }}>{svg}</div>
    </div>
  );
};
