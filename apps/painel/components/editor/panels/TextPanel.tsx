import React from 'react';
import { WidgetType, type WidgetData } from '../../../types';
import { getTextStyle, type TextEffectId } from '../widgetStyles';
import { PanelHeader, SectionTitle } from './panelKit';

interface TextPanelProps {
  addWidget: (type: WidgetType, data?: Partial<WidgetData>) => void;
  onClose?: () => void;
}

/** Cores sugeridas por efeito: texto, cor 1 e cor 2 do efeito. Usadas aqui e no painel de efeitos. */
export const EFFECT_DEFAULTS: Record<Exclude<TextEffectId, 'none'>, { color: string; fx1: string; fx2: string; sampleBg: 'dark' | 'light' }> = {
  '3d': { color: '#ffffff', fx1: '#02c2cd', fx2: '#0a5f73', sampleBg: 'dark' },
  neon: { color: '#ffffff', fx1: '#22d3ee', fx2: '#083d65', sampleBg: 'dark' },
  contorno: { color: '#ffffff', fx1: '#02c2cd', fx2: '#083d65', sampleBg: 'dark' },
  'sombra-longa': { color: '#fde047', fx1: '#02c2cd', fx2: '#b45309', sampleBg: 'dark' },
  gradiente: { color: '#ffffff', fx1: '#f43f5e', fx2: '#fbbf24', sampleBg: 'dark' },
  retro: { color: '#fff7ed', fx1: '#f43f5e', fx2: '#7c3aed', sampleBg: 'dark' },
  destaque: { color: '#0b1b2b', fx1: '#fde047', fx2: '#083d65', sampleBg: 'light' },
  carimbo: { color: '#ffffff', fx1: '#f43f5e', fx2: '#083d65', sampleBg: 'dark' },
};

export const EFFECT_SAMPLE_TEXT: Record<Exclude<TextEffectId, 'none'>, string> = {
  '3d': 'Oferta', neon: 'Aberto', contorno: 'Promoção', 'sombra-longa': 'Novidade', gradiente: 'Black Friday', retro: 'Especial', destaque: 'Só hoje', carimbo: 'Últimas',
};

const EFFECT_LABEL: Record<Exclude<TextEffectId, 'none'>, string> = {
  '3d': 'Texto 3D', neon: 'Neon', contorno: 'Contorno vazado', 'sombra-longa': 'Sombra longa', gradiente: 'Degradê', retro: 'Retrô', destaque: 'Marca-texto', carimbo: 'Carimbo',
};

/** Dados de um texto novo com o efeito já aplicado. */
export function effectTextData(effect: Exclude<TextEffectId, 'none'>, content: string): Partial<WidgetData> {
  const d = EFFECT_DEFAULTS[effect];
  return {
    content, color: d.color, fontSize: '', transparentBackground: true,
    textConfig: { textStyle: 'h2', textAlign: 'center', effect, effectColor: d.fx1, effectColor2: d.fx2 },
  };
}

/** Amostra de um texto estilizado, em tamanho fixo e legível. */
export const TextSample: React.FC<{ data: Partial<WidgetData>; light?: boolean; size?: number }> = ({ data, light, size = 13 }) => {
  const full = { ...data, textConfig: { ...data.textConfig, fontSize: `${size}cqw` } } as WidgetData;
  return (
    <div className={`hub-sample ${light ? 'hub-sample--light' : ''}`} aria-hidden="true">
      <p style={getTextStyle(full)}>{data.content}</p>
    </div>
  );
};

const HEADINGS = [
  { id: 'h1', text: 'Título 1', hint: 'Chamada principal da tela' },
  { id: 'h2', text: 'Título 2', hint: 'Subtítulo ou nome do produto' },
  { id: 'h3', text: 'Título 3', hint: 'Seção ou destaque menor' },
  { id: 'body', text: 'Texto comum', hint: 'Descrições e avisos' },
] as const;

export const TextPanel: React.FC<TextPanelProps> = ({ addWidget, onClose }) => (
  <div className="hub-panel">
    <PanelHeader title="Texto" subtitle="Escolha o nível e depois digite na tela." onClose={onClose} />
    <div className="hub-panel__body space-y-5">
      <div>
        <SectionTitle>Hierarquia</SectionTitle>
        <div className="space-y-2">
          {HEADINGS.map(h => {
            const data: Partial<WidgetData> = {
              content: h.text, color: '#ffffff', fontSize: '', transparentBackground: true,
              textConfig: { textStyle: h.id, textAlign: 'center' },
            };
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => addWidget(WidgetType.TEXT, data)}
                className="w-full min-h-[56px] text-left px-3 py-2 bg-papel-3 border border-borda rounded-lg hover:border-marca hover:bg-marca-fundo transition-colors"
              >
                <span className="block font-black text-tinta leading-tight" style={{ fontSize: h.id === 'h1' ? 22 : h.id === 'h2' ? 19 : h.id === 'h3' ? 16 : 14 }}>{h.text}</span>
                <span className="block text-xs md:text-[10px] text-tinta-3 mt-0.5">{h.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionTitle>Texto com efeito</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(EFFECT_DEFAULTS) as (keyof typeof EFFECT_DEFAULTS)[]).map(effect => {
            const data = effectTextData(effect, EFFECT_SAMPLE_TEXT[effect]);
            return (
              <button
                key={effect}
                type="button"
                onClick={() => addWidget(WidgetType.TEXT, data)}
                className="block text-left rounded-lg border-2 border-transparent hover:border-marca focus-visible:border-marca outline-none p-0"
                aria-label={`Adicionar texto com efeito ${EFFECT_LABEL[effect]}`}
              >
                <TextSample data={data} light={EFFECT_DEFAULTS[effect].sampleBg === 'light'} />
                <span className="block mt-1 text-xs md:text-[10px] font-bold text-tinta-2">{EFFECT_LABEL[effect]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
