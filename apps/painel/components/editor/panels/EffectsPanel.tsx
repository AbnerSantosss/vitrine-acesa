import React from 'react';
import { WidgetType, type LayoutItem, type WidgetData, type WidgetEffects } from '../../../types';
import { FieldLabel, NoSelection, PanelHeader, SectionTitle } from './panelKit';

interface EffectsPanelProps {
  currentWidget?: LayoutItem | null;
  updateWidgetData?: (id: string, data: Partial<WidgetData>) => void;
  onBack?: () => void;
  onClose?: () => void;
}

type Container = NonNullable<WidgetEffects['container']>;

const CONTAINER_SHAPES: { id: Container['shape']; label: string }[] = [
  { id: 'none', label: 'Sem bloco' },
  { id: 'square', label: 'Quadrado' },
  { id: 'rect', label: 'Retângulo' },
  { id: 'circle', label: 'Círculo' },
  { id: 'pill', label: 'Pílula' },
];

const Color: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="flex items-center gap-2 bg-papel-2 border border-borda-3 rounded-lg p-1.5 min-h-[44px] md:min-h-0 cursor-pointer">
    <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)} className="w-8 h-8 md:w-6 md:h-6 rounded p-0 border-0 bg-transparent cursor-pointer flex-none" />
    <span className="text-xs md:text-[10px] font-bold text-tinta-2">{label}</span>
  </label>
);

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div>
    <div className="flex justify-between text-xs md:text-[10px] font-bold text-tinta-2 mb-0.5"><span>{label}</span><span className="font-mono text-marca">{value}{unit}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-marca h-8 md:h-4" />
  </div>
);

const Toggle: React.FC<{ label: string; on: boolean; onChange: (on: boolean) => void; children?: React.ReactNode }> = ({ label, on, onChange, children }) => (
  <div className="bg-papel-3 border border-borda rounded-lg p-2.5">
    <label className="flex items-center gap-2 min-h-[44px] md:min-h-0 cursor-pointer select-none">
      <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-marca" />
      <span className="text-sm md:text-xs font-black text-tinta">{label}</span>
    </label>
    {on && children && <div className="mt-2 space-y-2">{children}</div>}
  </div>
);

/** Sombra, contorno, bloco, recipiente, opacidade e rotação do elemento selecionado. */
export const EffectsPanel: React.FC<EffectsPanelProps> = ({ currentWidget, updateWidgetData, onBack, onClose }) => {
  const header = <PanelHeader title="Efeitos" subtitle="Vale para o elemento selecionado." onBack={onBack} onClose={onClose} />;
  if (!currentWidget || !updateWidgetData) {
    return <div className="hub-panel">{header}<div className="hub-panel__body"><NoSelection text="Selecione um texto, ícone, forma ou imagem na tela para aplicar efeitos." /></div></div>;
  }
  const d = currentWidget.data;
  const e: WidgetEffects = d.effects || {};
  const type = currentWidget.type;
  const hasShapeFx = type === WidgetType.TEXT || type === WidgetType.ICON || type === WidgetType.SHAPE || type === WidgetType.IMAGE || type === WidgetType.GIF;
  const hasContainer = type === WidgetType.ICON || type === WidgetType.SHAPE;
  const textEffectOn = type === WidgetType.TEXT && !!d.textConfig?.effect && d.textConfig.effect !== 'none';

  const setFx = (next: Partial<WidgetEffects>) => {
    const merged: WidgetEffects = { ...e, ...next };
    (Object.keys(merged) as (keyof WidgetEffects)[]).forEach(k => { if (merged[k] === undefined) delete merged[k]; });
    updateWidgetData(currentWidget.i, { effects: Object.keys(merged).length ? merged : undefined });
  };
  const container: Container = e.container || { shape: 'none', color: '#ffffff', padding: 12 };

  return (
    <div className="hub-panel">
      {header}
      <div className="hub-panel__body space-y-3">
        {textEffectOn && (
          <p className="text-xs text-tinta-3 bg-papel-2 border border-borda rounded-lg p-2.5 leading-relaxed">
            Este texto usa um efeito pronto, que já cuida da sombra e do contorno. Para usar os itens abaixo, escolha &quot;Sem efeito&quot; em Efeitos do texto.
          </p>
        )}

        {hasShapeFx && (
          <>
            <Toggle label="Sombra" on={!!e.shadow} onChange={on => setFx({ shadow: on ? { color: 'rgba(0,0,0,.45)', blur: 14, x: 0, y: 6 } : undefined })}>
              <Color label="Cor da sombra" value={/^#/.test(e.shadow?.color || '') ? e.shadow!.color! : '#000000'} onChange={v => setFx({ shadow: { ...e.shadow, color: v } })} />
              <Slider label="Desfoque" value={e.shadow?.blur ?? 14} min={0} max={40} onChange={v => setFx({ shadow: { ...e.shadow, blur: v } })} />
              <Slider label="Distância na horizontal" value={e.shadow?.x ?? 0} min={-30} max={30} onChange={v => setFx({ shadow: { ...e.shadow, x: v } })} />
              <Slider label="Distância na vertical" value={e.shadow?.y ?? 6} min={-30} max={30} onChange={v => setFx({ shadow: { ...e.shadow, y: v } })} />
            </Toggle>
            <Toggle label="Contorno" on={!!e.outline} onChange={on => setFx({ outline: on ? { color: '#ffffff', width: 3 } : undefined })}>
              <Color label="Cor do contorno" value={e.outline?.color || '#ffffff'} onChange={v => setFx({ outline: { ...e.outline, color: v } })} />
              <Slider label="Espessura" value={e.outline?.width ?? 3} min={1} max={14} unit=" px" onChange={v => setFx({ outline: { ...e.outline, width: v } })} />
            </Toggle>
            <Toggle label="Bloco deslocado" on={!!e.block} onChange={on => setFx({ block: on ? { color: '#0b1b2b', offset: 8 } : undefined })}>
              <Color label="Cor do bloco" value={e.block?.color || '#0b1b2b'} onChange={v => setFx({ block: { ...e.block, color: v } })} />
              <Slider label="Deslocamento" value={e.block?.offset ?? 8} min={1} max={30} unit=" px" onChange={v => setFx({ block: { ...e.block, offset: v } })} />
            </Toggle>
          </>
        )}

        {hasContainer && (
          <div className="bg-papel-3 border border-borda rounded-lg p-2.5">
            <SectionTitle>Recipiente atrás</SectionTitle>
            <div className="grid grid-cols-2 gap-1.5">
              {CONTAINER_SHAPES.map(s => (
                <button key={s.id} type="button" aria-pressed={container.shape === s.id}
                  onClick={() => setFx({ container: s.id === 'none' ? undefined : { ...container, shape: s.id, color: container.color || '#ffffff' } })}
                  className={`min-h-[44px] md:min-h-[32px] rounded-lg border-2 text-xs md:text-[10px] font-bold text-tinta-2 bg-papel ${container.shape === s.id ? 'border-marca' : 'border-transparent hover:border-borda-3'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            {container.shape !== 'none' && (
              <div className="mt-2 space-y-2">
                <Color label="Cor do recipiente" value={container.color || '#ffffff'} onChange={v => setFx({ container: { ...container, color: v } })} />
                <Slider label="Espaço interno" value={container.padding ?? 12} min={0} max={40} unit="%" onChange={v => setFx({ container: { ...container, padding: v } })} />
              </div>
            )}
          </div>
        )}

        <div className="bg-papel-3 border border-borda rounded-lg p-2.5 space-y-2">
          <FieldLabel>Posição e transparência</FieldLabel>
          <Slider label="Opacidade" value={Math.round((d.opacity ?? 1) * 100)} min={0} max={100} unit="%" onChange={v => updateWidgetData(currentWidget.i, { opacity: v / 100 })} />
          <Slider label="Rotação" value={d.rotation ?? 0} min={-180} max={180} unit="°" onChange={v => updateWidgetData(currentWidget.i, { rotation: v })} />
          <button type="button" onClick={() => updateWidgetData(currentWidget.i, { opacity: 1, rotation: 0 })} className="text-xs md:text-[10px] font-bold text-marca hover:underline min-h-[44px] md:min-h-0">Zerar opacidade e rotação</button>
        </div>

        {(e.shadow || e.outline || e.block || e.container) && (
          <button type="button" onClick={() => updateWidgetData(currentWidget.i, { effects: undefined })}
            className="w-full min-h-[44px] md:min-h-[36px] rounded-lg border border-danger/30 bg-danger-fundo text-danger text-xs font-bold">
            Remover todos os efeitos
          </button>
        )}
      </div>
    </div>
  );
};
