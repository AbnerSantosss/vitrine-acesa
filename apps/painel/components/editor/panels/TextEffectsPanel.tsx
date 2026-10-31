import React from 'react';
import { WidgetType, type LayoutItem, type WidgetData } from '../../../types';
import { TEXT_EFFECTS, TEXT_STYLE_PRESETS, type TextEffectId } from '../widgetStyles';
import { EFFECT_DEFAULTS, EFFECT_SAMPLE_TEXT, TextSample } from './TextPanel';
import { FieldLabel, NoSelection, PanelHeader, SectionTitle } from './panelKit';

interface TextEffectsPanelProps {
  currentWidget?: LayoutItem | null;
  updateWidgetData?: (id: string, data: Partial<WidgetData>) => void;
  onBack?: () => void;
  onClose?: () => void;
}

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="flex items-center gap-2 bg-papel-2 border border-borda-3 rounded-lg p-1.5 min-h-[44px] md:min-h-0 cursor-pointer">
    <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'} onChange={e => onChange(e.target.value)} className="w-8 h-8 md:w-6 md:h-6 rounded p-0 border-0 bg-transparent cursor-pointer flex-none" />
    <span className="text-xs md:text-[10px] font-bold text-tinta-2 leading-tight">{label}</span>
  </label>
);

/** Efeitos do texto selecionado: o texto continua editável e o efeito acompanha. */
export const TextEffectsPanel: React.FC<TextEffectsPanelProps> = ({ currentWidget, updateWidgetData, onBack, onClose }) => {
  const header = <PanelHeader title="Efeitos do texto" subtitle="Vale para o texto selecionado." onBack={onBack} onClose={onClose} />;
  if (!currentWidget || currentWidget.type !== WidgetType.TEXT || !updateWidgetData) {
    return <div className="hub-panel">{header}<div className="hub-panel__body"><NoSelection text="Selecione um texto na tela para aplicar efeitos." /></div></div>;
  }
  const d = currentWidget.data;
  const cfg = d.textConfig || {};
  const effect: TextEffectId = cfg.effect || 'none';
  const patchText = (next: Partial<NonNullable<WidgetData['textConfig']>>) => updateWidgetData(currentWidget.i, { textConfig: { ...cfg, ...next } });

  const chooseEffect = (id: TextEffectId) => {
    if (id === 'none') return patchText({ effect: 'none' });
    const def = EFFECT_DEFAULTS[id];
    // Só troca as cores do efeito; a cor do texto muda apenas se o efeito não funciona com a atual.
    updateWidgetData(currentWidget.i, {
      color: id === 'destaque' && (d.color || '#ffffff').toLowerCase() === '#ffffff' ? def.color : d.color || def.color,
      textConfig: { ...cfg, effect: id, effectColor: def.fx1, effectColor2: def.fx2 },
    });
  };

  return (
    <div className="hub-panel">
      {header}
      <div className="hub-panel__body space-y-5">
        <div>
          <SectionTitle>Efeito</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={effect === 'none'} onClick={() => chooseEffect('none')}
              className={`min-h-[44px] rounded-lg border-2 text-xs md:text-[10px] font-bold text-tinta-2 bg-papel-3 ${effect === 'none' ? 'border-marca' : 'border-transparent hover:border-borda-3'}`}>
              Sem efeito
            </button>
            {TEXT_EFFECTS.filter(e => e.id !== 'none').map(e => {
              const id = e.id as Exclude<TextEffectId, 'none'>;
              const def = EFFECT_DEFAULTS[id];
              const sample: Partial<WidgetData> = { content: EFFECT_SAMPLE_TEXT[id], color: def.color, fontSize: '', textConfig: { effect: id, effectColor: def.fx1, effectColor2: def.fx2, textStyle: 'h2' } };
              return (
                <button key={id} type="button" aria-pressed={effect === id} onClick={() => chooseEffect(id)}
                  className={`block text-left rounded-lg border-2 p-0 ${effect === id ? 'border-marca' : 'border-transparent hover:border-borda-3'}`}>
                  <TextSample data={sample} light={def.sampleBg === 'light'} size={11} />
                  <span className="block mt-1 text-xs md:text-[10px] font-bold text-tinta-2">{e.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Cores</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="Texto" value={d.color || '#ffffff'} onChange={v => updateWidgetData(currentWidget.i, { color: v })} />
            {effect !== 'none' && effect !== 'contorno' && <ColorField label="Cor do efeito" value={cfg.effectColor || '#02c2cd'} onChange={v => patchText({ effectColor: v })} />}
            {(effect === '3d' || effect === 'sombra-longa' || effect === 'gradiente' || effect === 'retro') && (
              <ColorField label="Segunda cor" value={cfg.effectColor2 || '#083d65'} onChange={v => patchText({ effectColor2: v })} />
            )}
          </div>
        </div>

        <div>
          <FieldLabel>Tamanho</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(TEXT_STYLE_PRESETS) as (keyof typeof TEXT_STYLE_PRESETS)[]).map(key => (
              <button key={key} type="button" aria-pressed={cfg.textStyle === key}
                onClick={() => updateWidgetData(currentWidget.i, { fontSize: '', textConfig: { ...cfg, textStyle: key, fontSize: '' } })}
                className={`min-h-[44px] rounded-lg border-2 text-xs md:text-[10px] font-bold text-tinta-2 bg-papel-3 ${cfg.textStyle === key ? 'border-marca' : 'border-transparent hover:border-borda-3'}`}>
                {TEXT_STYLE_PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
