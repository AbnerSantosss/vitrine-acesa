import React from 'react';
import { type LayoutItem, type WidgetData } from '../../../types';
import { IMAGE_FILTERS, TEXT_EFFECTS, type ImageFilterId, type TextEffectId } from '../widgetStyles';
import { ICON_LIST } from '../../widgets/IconWidget';
import { MotionProperties } from '../MotionProperties';

/**
 * Campos de estilo do painel de propriedades (lado direito) para imagem, texto,
 * ícone, forma e motion. Cada bloco só chama updateWidgetData com objetos novos
 * (nunca altera o que veio do estado), para desfazer e autosave enxergarem a mudança.
 */
type Update = (id: string, data: Partial<WidgetData>) => void;
interface Props { widget: LayoutItem; updateWidgetData: Update; }

const LABEL = 'text-[9px] font-black text-tinta-3 uppercase mb-1 block';
const SELECT = 'w-full bg-papel-2 border border-borda-3 rounded p-2 text-base md:text-xs text-tinta outline-none focus:border-marca cursor-pointer';
const INPUT = 'w-full bg-papel-2 border border-borda-3 rounded p-1.5 text-base md:text-[10px] text-tinta outline-none focus:border-marca';

const Range: React.FC<{ label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div>
    <div className="flex justify-between"><label className={LABEL}>{label}</label><span className="text-[9px] font-mono text-marca">{value}{unit}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-marca h-8 md:h-4" />
  </div>
);

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="flex items-center gap-2 bg-papel-2 border border-borda-3 rounded p-1.5 cursor-pointer min-h-[44px] md:min-h-0">
    <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)} className="w-8 h-8 md:w-6 md:h-6 p-0 border-0 bg-transparent cursor-pointer flex-none" />
    <span className="text-xs md:text-[10px] font-bold text-tinta-2">{label}</span>
  </label>
);

export const ImageStyleFields: React.FC<Props> = ({ widget, updateWidgetData }) => {
  const cfg = widget.data.imageConfig || {};
  const patch = (next: Partial<NonNullable<WidgetData['imageConfig']>>) => updateWidgetData(widget.i, { imageConfig: { ...cfg, ...next } });
  return (
    <div className="space-y-3 bg-papel-3 border border-borda rounded-lg p-2.5">
      <label className="text-[9px] font-black text-tinta-3 uppercase">Filtro e ajustes</label>
      <div>
        <label className={LABEL}>Filtro</label>
        <select className={SELECT} value={cfg.filter || 'none'} onChange={e => patch({ filter: e.target.value as ImageFilterId })}>
          {IMAGE_FILTERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>
      <Range label="Brilho" value={cfg.brightness ?? 100} min={40} max={160} unit="%" onChange={v => patch({ brightness: v })} />
      <Range label="Contraste" value={cfg.contrast ?? 100} min={40} max={180} unit="%" onChange={v => patch({ contrast: v })} />
      <Range label="Saturação" value={cfg.saturation ?? 100} min={0} max={200} unit="%" onChange={v => patch({ saturation: v })} />
      <Range label="Desfoque" value={cfg.blur ?? 0} min={0} max={20} unit=" px" onChange={v => patch({ blur: v })} />
      <div>
        <label className={LABEL}>Moldura</label>
        <select className={SELECT} value={cfg.frame || 'none'} onChange={e => patch({ frame: e.target.value as NonNullable<typeof cfg.frame> })}>
          <option value="none">Sem moldura</option>
          <option value="rounded">Cantos suaves</option>
          <option value="circle">Círculo</option>
          <option value="arch">Arco</option>
          <option value="blob">Orgânica</option>
          <option value="polaroid">Polaroid</option>
        </select>
      </div>
    </div>
  );
};

const TEXT_STYLES: { id: NonNullable<NonNullable<WidgetData['textConfig']>['textStyle']>; label: string }[] = [
  { id: 'h1', label: 'Título 1' },
  { id: 'h2', label: 'Título 2' },
  { id: 'h3', label: 'Título 3' },
  { id: 'body', label: 'Texto comum' },
];

export const TextStyleFields: React.FC<Props> = ({ widget, updateWidgetData }) => {
  const tc = widget.data.textConfig || {};
  const patch = (next: Partial<NonNullable<WidgetData['textConfig']>>) => updateWidgetData(widget.i, { textConfig: { ...tc, ...next } });
  const effect: TextEffectId = tc.effect || 'none';
  return (
    <div className="space-y-3 bg-papel-3 border border-borda rounded-lg p-2.5">
      <label className="text-[9px] font-black text-tinta-3 uppercase">Estilo do texto</label>
      <div>
        <label className={LABEL}>Hierarquia</label>
        <select
          className={SELECT}
          value={tc.textStyle || ''}
          onChange={e => {
            const textStyle = e.target.value as NonNullable<typeof tc.textStyle>;
            // O estilo define o tamanho; um tamanho fixo antigo o anularia.
            updateWidgetData(widget.i, { textConfig: { ...tc, textStyle, fontSize: '' }, fontSize: '' });
          }}
        >
          <option value="" disabled>Tamanho livre</option>
          {TEXT_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <Range label="Entrelinha" value={tc.lineHeight ?? 1.2} min={0.8} max={2.5} step={0.05} onChange={v => patch({ lineHeight: v })} />
      <Range label="Espaço entre letras" value={tc.letterSpacing ?? 0} min={-0.1} max={0.5} step={0.01} unit=" em" onChange={v => patch({ letterSpacing: v })} />
      <div>
        <label className={LABEL}>Efeito</label>
        <select className={SELECT} value={effect} onChange={e => patch({ effect: e.target.value as TextEffectId })}>
          {TEXT_EFFECTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>
      {effect !== 'none' && (
        <div className="grid grid-cols-1 gap-2">
          <ColorField label="Cor do efeito" value={tc.effectColor || '#02c2cd'} onChange={v => patch({ effectColor: v })} />
          <ColorField label="Segunda cor" value={tc.effectColor2 || '#0b1b2b'} onChange={v => patch({ effectColor2: v })} />
        </div>
      )}
    </div>
  );
};

export const IconStyleFields: React.FC<Props> = ({ widget, updateWidgetData }) => {
  const cfg = widget.data.iconConfig || { name: 'star' };
  const patch = (next: Partial<NonNullable<WidgetData['iconConfig']>>) => updateWidgetData(widget.i, { iconConfig: { ...cfg, ...next } });
  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Ícone</label>
        <select className={SELECT} value={cfg.name} onChange={e => patch({ name: e.target.value })}>
          {ICON_LIST.map(i => <option key={i.key} value={i.key}>{i.groupLabel}: {i.label}</option>)}
        </select>
      </div>
      <ColorField label="Cor do ícone" value={cfg.color || '#0b1b2b'} onChange={v => patch({ color: v })} />
      <Range label="Espessura do traço" value={cfg.strokeWidth ?? 2} min={0.5} max={4} step={0.25} onChange={v => patch({ strokeWidth: v })} />
      <div>
        <label className={LABEL}>Variante</label>
        <select className={SELECT} value={cfg.variant || 'stroke'} onChange={e => patch({ variant: e.target.value as 'stroke' | 'filled' })}>
          <option value="stroke">Só o traço</option>
          <option value="filled">Preenchido</option>
        </select>
      </div>
    </div>
  );
};

const SHAPE_KINDS: { id: NonNullable<WidgetData['shapeConfig']>['kind']; label: string }[] = [
  { id: 'rect', label: 'Retângulo' }, { id: 'rounded', label: 'Arredondado' }, { id: 'circle', label: 'Círculo' },
  { id: 'pill', label: 'Pílula' }, { id: 'triangle', label: 'Triângulo' }, { id: 'star', label: 'Estrela' },
  { id: 'burst', label: 'Selo' }, { id: 'arrow', label: 'Seta' }, { id: 'line', label: 'Linha' },
];

export const ShapeStyleFields: React.FC<Props> = ({ widget, updateWidgetData }) => {
  const cfg = widget.data.shapeConfig || { kind: 'rect' as const, fill: '#02c2cd' };
  const patch = (next: Partial<NonNullable<WidgetData['shapeConfig']>>) => updateWidgetData(widget.i, { shapeConfig: { ...cfg, ...next } });
  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Forma</label>
        <select className={SELECT} value={cfg.kind} onChange={e => patch({ kind: e.target.value as typeof cfg.kind })}>
          {SHAPE_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
      </div>
      <ColorField label="Preenchimento" value={cfg.fill || '#02c2cd'} onChange={v => patch({ fill: v })} />
      <ColorField label="Contorno" value={cfg.stroke || '#000000'} onChange={v => patch({ stroke: v, strokeWidth: cfg.strokeWidth || 2 })} />
      <Range label="Espessura do contorno" value={cfg.strokeWidth ?? 0} min={0} max={20} unit=" px" onChange={v => patch({ strokeWidth: v })} />
      {(cfg.strokeWidth ?? 0) > 0 && (
        <button type="button" onClick={() => patch({ stroke: undefined, strokeWidth: 0 })} className="text-xs md:text-[10px] font-bold text-marca hover:underline min-h-[44px] md:min-h-0">Tirar o contorno</button>
      )}
    </div>
  );
};

export const MotionStyleFields: React.FC<Props & { setMediaLibraryConfig?: React.Dispatch<React.SetStateAction<any>> }> = ({ widget, updateWidgetData, setMediaLibraryConfig }) => (
  <MotionProperties widget={widget} updateWidgetData={updateWidgetData} setMediaLibraryConfig={setMediaLibraryConfig} />
);

export { INPUT as STYLE_INPUT_CLASS };
