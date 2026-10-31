/**
 * Estilos de desenho compartilhados entre o editor (Canvas) e a TV (Player).
 * Regra: tudo que muda a aparência de um elemento sai daqui, para a prévia e
 * a TV nunca divergirem. Contrato da reestruturação de 30/10/2026.
 */
import type React from 'react';
import type { WidgetData, WidgetEffects } from '../../types';

/**
 * Hierarquia de texto para TV. A ABNT (NBR 14724) regula documento impresso e
 * não serve para leitura a distância; aqui a escala segue a mesma ideia de
 * hierarquia com tamanhos para 1080p lidos a 3 ou 4 metros. Unidade `cqmin`
 * para valer igual em 16:9, 9:16 e videowall.
 */
export const TEXT_STYLE_PRESETS = {
  h1: { label: 'Título 1', fontSize: '11cqmin', fontWeight: '800', lineHeight: 1.05 },
  h2: { label: 'Título 2', fontSize: '7.5cqmin', fontWeight: '700', lineHeight: 1.1 },
  h3: { label: 'Título 3', fontSize: '5.5cqmin', fontWeight: '700', lineHeight: 1.15 },
  body: { label: 'Texto comum', fontSize: '3.7cqmin', fontWeight: '500', lineHeight: 1.35 },
} as const;

export type TextEffectId = NonNullable<NonNullable<WidgetData['textConfig']>['effect']>;

export const TEXT_EFFECTS: { id: TextEffectId; label: string }[] = [
  { id: 'none', label: 'Sem efeito' },
  { id: '3d', label: 'Texto 3D' },
  { id: 'neon', label: 'Neon' },
  { id: 'contorno', label: 'Contorno vazado' },
  { id: 'sombra-longa', label: 'Sombra longa' },
  { id: 'gradiente', label: 'Degradê' },
  { id: 'retro', label: 'Retrô' },
  { id: 'destaque', label: 'Marca-texto' },
  { id: 'carimbo', label: 'Carimbo' },
];

export type ImageFilterId = NonNullable<NonNullable<WidgetData['imageConfig']>['filter']>;

export const IMAGE_FILTERS: { id: ImageFilterId; label: string; css: string }[] = [
  { id: 'none', label: 'Original', css: '' },
  { id: 'pb', label: 'Preto e branco', css: 'grayscale(1)' },
  { id: 'sepia', label: 'Sépia', css: 'sepia(0.85)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.4) contrast(1.1) saturate(0.8) brightness(1.05)' },
  { id: 'quente', label: 'Quente', css: 'sepia(0.25) saturate(1.3) hue-rotate(-8deg)' },
  { id: 'frio', label: 'Frio', css: 'saturate(0.9) hue-rotate(12deg) brightness(1.05)' },
  { id: 'vivido', label: 'Vívido', css: 'saturate(1.6) contrast(1.1)' },
  { id: 'suave', label: 'Suave', css: 'contrast(0.9) brightness(1.08) saturate(0.85)' },
  { id: 'drama', label: 'Drama', css: 'contrast(1.4) saturate(0.7) brightness(0.9)' },
  { id: 'noite', label: 'Noite', css: 'brightness(0.75) contrast(1.2) saturate(1.2) hue-rotate(195deg)' },
];

const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

/** `filter` CSS de uma imagem/GIF: filtro pronto + ajustes finos + efeitos. */
export function getImageFilter(data: WidgetData): string | undefined {
  const cfg = data.imageConfig || {};
  const parts: string[] = [];
  const preset = IMAGE_FILTERS.find(f => f.id === cfg.filter);
  if (preset?.css) parts.push(preset.css);
  if (num(cfg.brightness, 100) !== 100) parts.push(`brightness(${num(cfg.brightness, 100) / 100})`);
  if (num(cfg.contrast, 100) !== 100) parts.push(`contrast(${num(cfg.contrast, 100) / 100})`);
  if (num(cfg.saturation, 100) !== 100) parts.push(`saturate(${num(cfg.saturation, 100) / 100})`);
  if (num(cfg.blur, 0) > 0) parts.push(`blur(${num(cfg.blur, 0)}px)`);
  const fx = getEffectFilter(data.effects);
  if (fx) parts.push(fx);
  return parts.length ? parts.join(' ') : undefined;
}

/** Recorte da foto conforme a moldura escolhida. */
export function getImageFrameStyle(data: WidgetData): React.CSSProperties {
  switch (data.imageConfig?.frame) {
    case 'rounded': return { borderRadius: '6cqmin' };
    case 'circle': return { borderRadius: '50%' };
    case 'arch': return { borderRadius: '50% 50% 4cqmin 4cqmin / 35% 35% 4cqmin 4cqmin' };
    case 'blob': return { borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%' };
    case 'polaroid': return { border: '1.6cqmin solid #fff', borderBottomWidth: '6cqmin', boxShadow: '0 1cqmin 3cqmin rgba(0,0,0,.35)', background: '#fff' };
    default: return {};
  }
}

/** Sombra, contorno e bloco como `filter` (servem para ícone, forma e imagem com transparência). */
export function getEffectFilter(effects?: WidgetEffects): string | undefined {
  if (!effects) return undefined;
  const parts: string[] = [];
  if (effects.outline && num(effects.outline.width, 0) > 0) {
    const w = num(effects.outline.width, 2);
    const c = effects.outline.color || '#ffffff';
    parts.push(`drop-shadow(${w}px 0 0 ${c}) drop-shadow(-${w}px 0 0 ${c}) drop-shadow(0 ${w}px 0 ${c}) drop-shadow(0 -${w}px 0 ${c})`);
  }
  if (effects.block && num(effects.block.offset, 0) > 0) {
    const o = num(effects.block.offset, 8);
    parts.push(`drop-shadow(${o}px ${o}px 0 ${effects.block.color || '#0b1b2b'})`);
  }
  if (effects.shadow) {
    const s = effects.shadow;
    parts.push(`drop-shadow(${num(s.x, 0)}px ${num(s.y, 6)}px ${num(s.blur, 14)}px ${s.color || 'rgba(0,0,0,.45)'})`);
  }
  return parts.length ? parts.join(' ') : undefined;
}

/** Bloco de fundo (quadrado, retângulo, círculo, pílula) em volta do elemento. */
export function getContainerStyle(effects?: WidgetEffects): React.CSSProperties | undefined {
  const c = effects?.container;
  if (!c || c.shape === 'none') return undefined;
  const radius = c.shape === 'circle' ? '50%' : c.shape === 'pill' ? '999px' : c.shape === 'square' ? '0' : '3cqmin';
  const square = c.shape === 'circle' || c.shape === 'square';
  return {
    background: c.color || '#ffffff',
    borderRadius: radius,
    padding: `${num(c.padding, 12)}%`,
    boxSizing: 'border-box',
    // Círculo e quadrado ocupam o menor lado do widget, sem esticar.
    width: square ? 'min(100cqw, 100cqh)' : '100%',
    height: square ? 'min(100cqw, 100cqh)' : '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    maxWidth: '100%', maxHeight: '100%',
  };
}

/** Estilo do bloco de texto (tamanho, peso, espaçamentos, efeito). */
export function getTextStyle(data: WidgetData): React.CSSProperties {
  const t = data.textConfig || {};
  const preset = t.textStyle ? TEXT_STYLE_PRESETS[t.textStyle] : undefined;
  const color = data.color || '#ffffff';
  const fx1 = t.effectColor || '#02c2cd';
  const fx2 = t.effectColor2 || '#083d65';
  const style: React.CSSProperties & Record<string, unknown> = {
    color,
    fontSize: t.fontSize || data.fontSize?.replace('vw', 'cqw') || preset?.fontSize || '4cqw',
    fontFamily: t.fontFamily,
    fontWeight: t.fontWeight || preset?.fontWeight || 'bold',
    fontStyle: t.fontStyle || 'normal',
    textDecoration: t.textDecoration === 'underline' ? 'underline' : undefined,
    textUnderlineOffset: t.textDecoration === 'underline' ? '0.12em' : undefined,
    lineHeight: num(t.lineHeight, preset?.lineHeight ?? 1.15),
    letterSpacing: t.letterSpacing ? `${t.letterSpacing}em` : undefined,
    whiteSpace: 'pre-line',
  };
  switch (t.effect) {
    case '3d':
      style.textShadow = Array.from({ length: 8 }, (_, i) => `${(i + 1) * 0.014}em ${(i + 1) * 0.014}em 0 ${fx2}`).join(', ') + ', 0.16em 0.2em 0.2em rgba(0,0,0,.4)';
      break;
    case 'neon':
      style.textShadow = `0 0 0.03em ${color}, 0 0 0.1em ${fx1}, 0 0 0.25em ${fx1}, 0 0 0.5em ${fx1}, 0 0 0.9em ${fx1}`;
      break;
    case 'contorno':
      style.color = 'transparent';
      style.WebkitTextStroke = `0.035em ${color}`;
      break;
    case 'sombra-longa':
      style.textShadow = Array.from({ length: 24 }, (_, i) => `${(i + 1) * 0.016}em ${(i + 1) * 0.016}em 0 ${fx2}`).join(', ');
      break;
    case 'gradiente':
      style.backgroundImage = `linear-gradient(100deg, ${fx1}, ${fx2})`;
      style.WebkitBackgroundClip = 'text';
      style.backgroundClip = 'text';
      style.color = 'transparent';
      break;
    case 'retro':
      style.textShadow = `0.05em 0.05em 0 ${fx1}, 0.1em 0.1em 0 ${fx2}`;
      break;
    case 'destaque':
      style.backgroundImage = `linear-gradient(transparent 52%, ${fx1} 52%, ${fx1} 94%, transparent 94%)`;
      style.backgroundSize = `100% ${num(t.lineHeight, preset?.lineHeight ?? 1.15)}em`;
      style.backgroundRepeat = 'repeat-y';
      style.boxDecorationBreak = 'clone';
      style.WebkitBoxDecorationBreak = 'clone';
      break;
    case 'carimbo':
      style.color = fx1;
      style.textTransform = 'uppercase';
      style.letterSpacing = style.letterSpacing || '0.04em';
      style.border = `0.07em solid ${fx1}`;
      style.borderRadius = '0.12em';
      style.padding = '0.08em 0.3em';
      style.display = 'inline-block';
      style.transform = 'rotate(-4deg)';
      style.opacity = 0.92;
      break;
  }
  const e = data.effects;
  if (!t.effect || t.effect === 'none') {
    const shadows: string[] = [];
    if (e?.block && num(e.block.offset, 0) > 0) shadows.push(`${num(e.block.offset, 6)}px ${num(e.block.offset, 6)}px 0 ${e.block.color || '#0b1b2b'}`);
    if (e?.shadow) shadows.push(`${num(e.shadow.x, 0)}px ${num(e.shadow.y, 4)}px ${num(e.shadow.blur, 12)}px ${e.shadow.color || 'rgba(0,0,0,.5)'}`);
    if (shadows.length) style.textShadow = shadows.join(', ');
    if (e?.outline && num(e.outline.width, 0) > 0) style.WebkitTextStroke = `${num(e.outline.width, 2)}px ${e.outline.color || '#000'}`;
  }
  return style as React.CSSProperties;
}

/** Opacidade e rotação do elemento inteiro. */
export function getWidgetTransformStyle(data: WidgetData): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (typeof data.opacity === 'number' && data.opacity < 1) style.opacity = Math.max(0, data.opacity);
  if (data.rotation) style.transform = `rotate(${data.rotation}deg)`;
  return style;
}
