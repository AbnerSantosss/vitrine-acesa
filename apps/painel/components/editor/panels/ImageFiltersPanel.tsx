import React from 'react';
import { Sparkles } from 'lucide-react';
import { WidgetType, type EditorLeftPanel, type LayoutItem, type WidgetData } from '../../../types';
import { IMAGE_FILTERS, type ImageFilterId } from '../widgetStyles';
import { NoSelection, PanelHeader, SectionTitle } from './panelKit';

interface ImageFiltersPanelProps {
  currentWidget?: LayoutItem | null;
  updateWidgetData?: (id: string, data: Partial<WidgetData>) => void;
  onPanelChange?: (panel: EditorLeftPanel) => void;
  onBack?: () => void;
  onClose?: () => void;
}

type Frame = NonNullable<NonNullable<WidgetData['imageConfig']>['frame']>;

const FRAMES: { id: Frame; label: string }[] = [
  { id: 'none', label: 'Sem moldura' },
  { id: 'rounded', label: 'Cantos suaves' },
  { id: 'circle', label: 'Círculo' },
  { id: 'arch', label: 'Arco' },
  { id: 'blob', label: 'Orgânica' },
  { id: 'polaroid', label: 'Polaroid' },
];

const Slider: React.FC<{ label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void }> = ({ label, value, min, max, unit = '%', onChange }) => (
  <div>
    <div className="flex justify-between text-xs md:text-[10px] font-bold text-tinta-2 mb-0.5"><span>{label}</span><span className="font-mono text-marca">{value}{unit}</span></div>
    <input type="range" min={min} max={max} value={value} aria-label={label} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-marca h-8 md:h-4" />
  </div>
);

/** Filtros, ajustes finos e molduras da imagem selecionada. */
export const ImageFiltersPanel: React.FC<ImageFiltersPanelProps> = ({ currentWidget, updateWidgetData, onPanelChange, onBack, onClose }) => {
  const header = <PanelHeader title="Filtros da imagem" subtitle="Vale para a imagem selecionada." onBack={onBack} onClose={onClose} />;
  const isImage = currentWidget && (currentWidget.type === WidgetType.IMAGE || currentWidget.type === WidgetType.GIF);
  if (!currentWidget || !isImage || !updateWidgetData) {
    return <div className="hub-panel">{header}<div className="hub-panel__body"><NoSelection text="Selecione uma imagem na tela para aplicar filtros." /></div></div>;
  }
  const cfg = currentWidget.data.imageConfig || {};
  const patch = (next: Partial<NonNullable<WidgetData['imageConfig']>>) => updateWidgetData(currentWidget.i, { imageConfig: { ...cfg, ...next } });
  const filter: ImageFilterId = cfg.filter || 'none';
  const url = currentWidget.data.url || '';
  const thumbUrl = /unsplash\.com/.test(url) ? url.replace(/([?&])w=\d+/, '$1w=240') : url;

  return (
    <div className="hub-panel">
      {header}
      <div className="hub-panel__body space-y-5">
        <div>
          <SectionTitle>Filtros prontos</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {IMAGE_FILTERS.map(f => (
              <button key={f.id} type="button" className="hub-filter-thumb" aria-pressed={filter === f.id} onClick={() => patch({ filter: f.id })} aria-label={`Filtro ${f.label}`}>
                {thumbUrl && <img src={thumbUrl} alt="" loading="lazy" decoding="async" style={{ filter: f.css || undefined }} />}
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionTitle>Ajustes</SectionTitle>
          <Slider label="Brilho" value={cfg.brightness ?? 100} min={40} max={160} onChange={v => patch({ brightness: v })} />
          <Slider label="Contraste" value={cfg.contrast ?? 100} min={40} max={180} onChange={v => patch({ contrast: v })} />
          <Slider label="Saturação" value={cfg.saturation ?? 100} min={0} max={200} onChange={v => patch({ saturation: v })} />
          <Slider label="Desfoque" value={cfg.blur ?? 0} min={0} max={20} unit=" px" onChange={v => patch({ blur: v })} />
          <button type="button" onClick={() => patch({ filter: 'none', brightness: 100, contrast: 100, saturation: 100, blur: 0 })} className="text-xs md:text-[10px] font-bold text-marca hover:underline min-h-[44px] md:min-h-0">Voltar ao original</button>
        </div>

        <div>
          <SectionTitle>Moldura</SectionTitle>
          <div className="grid grid-cols-2 gap-1.5">
            {FRAMES.map(f => (
              <button key={f.id} type="button" aria-pressed={(cfg.frame || 'none') === f.id} onClick={() => patch({ frame: f.id })}
                className={`min-h-[44px] md:min-h-[32px] rounded-lg border-2 text-xs md:text-[10px] font-bold text-tinta-2 bg-papel-3 ${(cfg.frame || 'none') === f.id ? 'border-marca' : 'border-transparent hover:border-borda-3'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {onPanelChange && (
          <button type="button" onClick={() => onPanelChange('ai-edit')}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-marca text-white text-sm md:text-xs font-bold hover:bg-marca-hover transition-colors">
            <Sparkles size={15} /> Editar com IA
          </button>
        )}
      </div>
    </div>
  );
};
