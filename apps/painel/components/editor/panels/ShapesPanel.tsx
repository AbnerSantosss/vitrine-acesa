import React from 'react';
import { WidgetType, type LayoutItem, type WidgetData } from '../../../types';
import { ShapeWidget } from '../../widgets/ShapeWidget';
import { widgetCatalog } from '../widgetCatalogData';
import { PanelHeader, SectionTitle } from './panelKit';

interface ShapesPanelProps {
  addWidget: (type: WidgetType, data?: Partial<WidgetData>) => void;
  currentWidget?: LayoutItem | null;
  updateWidgetData?: (id: string, data: Partial<WidgetData>) => void;
  onClose?: () => void;
}

type Kind = NonNullable<WidgetData['shapeConfig']>['kind'];

const KINDS: { kind: Kind; label: string }[] = [
  { kind: 'rect', label: 'Retângulo' },
  { kind: 'rounded', label: 'Arredondado' },
  { kind: 'circle', label: 'Círculo' },
  { kind: 'pill', label: 'Pílula' },
  { kind: 'triangle', label: 'Triângulo' },
  { kind: 'star', label: 'Estrela' },
  { kind: 'burst', label: 'Selo' },
  { kind: 'arrow', label: 'Seta' },
  { kind: 'line', label: 'Linha' },
];

const stretch = { fillContainer: true, contentAlignment: 'stretch' as const, transparentBackground: true };

export const ShapesPanel: React.FC<ShapesPanelProps> = ({ addWidget, currentWidget, updateWidgetData, onClose }) => {
  const selected = currentWidget?.type === WidgetType.SHAPE ? currentWidget : null;
  const presets = widgetCatalog[WidgetType.SHAPE].presets;

  const pick = (kind: Kind) => {
    if (selected && updateWidgetData) {
      updateWidgetData(selected.i, { shapeConfig: { ...(selected.data.shapeConfig || { fill: '#02c2cd' }), kind } });
      return;
    }
    addWidget(WidgetType.SHAPE, { ...stretch, shapeConfig: { kind, fill: '#02c2cd' } });
  };

  return (
    <div className="hub-panel">
      <PanelHeader title="Formas" subtitle={selected ? 'O clique troca a forma selecionada.' : 'Fundos, selos e detalhes para a tela.'} onClose={onClose} />
      <div className="hub-panel__body space-y-5">
        <div>
          <SectionTitle>Formas básicas</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map(k => (
              <button key={k.kind} type="button" onClick={() => pick(k.kind)} aria-label={k.label} title={k.label}
                className="block rounded-lg border-2 border-transparent hover:border-marca focus-visible:border-marca outline-none p-0 text-left">
                <div className="hub-sample hub-sample--light" style={{ aspectRatio: '1 / 1' }}>
                  <div style={{ width: k.kind === 'line' ? '70%' : '58%', height: k.kind === 'line' ? '12%' : '58%' }}>
                    <ShapeWidget data={{ shapeConfig: { kind: k.kind, fill: '#0b1b2b' } } as WidgetData} />
                  </div>
                </div>
                <span className="block mt-1 text-[11px] md:text-[10px] font-bold text-tinta-2">{k.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Prontas</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {presets.map(p => {
              const data = p.data();
              return (
                <button key={p.id} type="button" onClick={() => addWidget(WidgetType.SHAPE, data)} title={p.description} aria-label={`Adicionar ${p.title}`}
                  className="block rounded-lg border-2 border-transparent hover:border-marca focus-visible:border-marca outline-none p-0 text-left">
                  <div className="hub-sample"><div style={{ width: data.shapeConfig?.kind === 'line' ? '70%' : '50%', height: data.shapeConfig?.kind === 'line' ? '10%' : '70%' }}><ShapeWidget data={data as WidgetData} /></div></div>
                  <span className="block mt-1 text-[11px] md:text-[10px] font-bold text-tinta-2 leading-tight">{p.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
