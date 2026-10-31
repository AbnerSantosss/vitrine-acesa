import React from 'react';
import { Upload } from 'lucide-react';
import type { LayoutItem, WidgetData } from '../../types';
import { MOTION_PRESETS, getMotionDefaults, getMotionPreset } from './presets/motionPresets';

interface MotionPropertiesProps {
  widget: LayoutItem;
  updateWidgetData: (id: string, data: Partial<WidgetData>) => void;
  /** Opcional: abre a biblioteca de mídia para os campos de imagem (QR Code, logo). */
  setMediaLibraryConfig?: React.Dispatch<React.SetStateAction<any>>;
}

const LABEL = 'text-[9px] font-black text-tinta-3 uppercase mb-1 block';
const INPUT = 'w-full bg-papel-2 border border-borda-3 rounded-lg p-2.5 text-base md:text-xs text-tinta outline-none focus:border-marca';

/** Campos editáveis do widget de motion: textos, cores, velocidade e troca de modelo. */
export const MotionProperties: React.FC<MotionPropertiesProps> = ({ widget, updateWidgetData, setMediaLibraryConfig }) => {
  const cfg = widget.data.motionConfig;
  const preset = getMotionPreset(cfg?.presetId) || MOTION_PRESETS[0];
  const fields = cfg?.fields || {};
  const colors = cfg?.colors || {};
  const speed = Math.max(0.5, Math.min(2, Number(cfg?.speed) || 1));

  const patch = (next: Partial<NonNullable<WidgetData['motionConfig']>>) =>
    updateWidgetData(widget.i, { motionConfig: { presetId: preset.id, ...cfg, ...next } });

  const changePreset = (id: string) => {
    const defaults = getMotionDefaults(id);
    const newPreset = getMotionPreset(id);
    // Mantém o que o cliente já escreveu quando o campo existe nos dois modelos.
    const keepFields: Record<string, string> = { ...defaults.fields };
    for (const key of Object.keys(keepFields)) if (fields[key] !== undefined && newPreset?.fields.some(f => f.key === key)) keepFields[key] = fields[key];
    const keepColors: Record<string, string> = { ...defaults.colors };
    for (const key of Object.keys(keepColors)) if (colors[key] !== undefined) keepColors[key] = colors[key];
    updateWidgetData(widget.i, { motionConfig: { presetId: id, fields: keepFields, colors: keepColors, speed } });
  };

  const resetColors = () => patch({ colors: getMotionDefaults(preset.id).colors });

  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL}>Modelo de animação</label>
        <select value={preset.id} onChange={e => changePreset(e.target.value)} className={`${INPUT} cursor-pointer`}>
          {MOTION_PRESETS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {preset.description && <p className="text-[10px] text-tinta-3 mt-1">{preset.description}</p>}
      </div>

      <div className="space-y-3">
        <label className={LABEL}>Textos e imagens</label>
        {preset.fields.map(f => (
          <div key={f.key}>
            <label className="text-[10px] font-bold text-tinta-2 block mb-1">{f.label}</label>
            {f.kind === 'image' ? (
              <div className="space-y-2">
                {setMediaLibraryConfig && (
                  <button
                    type="button"
                    onClick={() => setMediaLibraryConfig({
                      isOpen: true,
                      allowedTypes: 'image',
                      onSelect: (url: string) => patch({ fields: { ...fields, [f.key]: url } }),
                    })}
                    className="w-full min-h-[44px] md:min-h-0 py-2.5 bg-papel-3 text-tinta-2 rounded-lg font-bold text-xs hover:bg-borda hover:text-tinta transition-all border border-borda-2 hover:border-marca flex items-center justify-center gap-2"
                  >
                    <Upload size={14} /> Escolher imagem
                  </button>
                )}
                <input
                  type="text"
                  placeholder="Endereço da imagem (https://...)"
                  value={fields[f.key] ?? f.default}
                  onChange={e => patch({ fields: { ...fields, [f.key]: e.target.value } })}
                  className={INPUT}
                />
              </div>
            ) : (
              <input
                type="text"
                value={fields[f.key] ?? f.default}
                onChange={e => patch({ fields: { ...fields, [f.key]: e.target.value } })}
                className={INPUT}
              />
            )}
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={`${LABEL} mb-0`}>Cores</label>
          <button type="button" onClick={resetColors} className="text-[10px] font-bold text-marca hover:underline min-h-[44px] md:min-h-0 px-1">Cores originais</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {preset.colors.map(c => {
            const value = colors[c.key] ?? c.default;
            // O seletor nativo só entende #rrggbb; cores com transparência ou rgba ficam só no valor salvo.
            const picker = /^#[0-9a-f]{6}$/i.test(value) ? value : /^#[0-9a-f]{8}$/i.test(value) ? value.slice(0, 7) : '#ffffff';
            return (
              <label key={c.key} className="flex items-center gap-2 bg-papel-2 border border-borda-3 rounded-lg p-1.5 cursor-pointer min-h-[44px] md:min-h-0">
                <input
                  type="color"
                  value={picker}
                  onChange={e => patch({ colors: { ...colors, [c.key]: e.target.value } })}
                  className="w-8 h-8 md:w-6 md:h-6 rounded cursor-pointer bg-transparent border-0 p-0 flex-none"
                />
                <span className="text-[10px] font-bold text-tinta-2 leading-tight">{c.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className={LABEL}>Velocidade</label>
        <input
          type="range" min="0.5" max="2" step="0.1"
          value={speed}
          onChange={e => patch({ speed: parseFloat(e.target.value) })}
          className="w-full accent-marca"
        />
        <div className="flex justify-between text-[9px] font-mono text-tinta-3">
          <span>Lenta</span>
          <span className="text-marca">{speed.toFixed(1)}x</span>
          <span>Rápida</span>
        </div>
      </div>
    </div>
  );
};
