import React, { useMemo, useState } from 'react';
import { WidgetType, type LayoutItem, type WidgetData } from '../../../types';
import { ICON_GROUPS, ICON_LIST, IconWidget } from '../../widgets/IconWidget';
import { widgetCatalog } from '../widgetCatalogData';
import { PanelHeader, SearchBox, SectionTitle, norm } from './panelKit';

interface IconsPanelProps {
  addWidget: (type: WidgetType, data?: Partial<WidgetData>) => void;
  currentWidget?: LayoutItem | null;
  updateWidgetData?: (id: string, data: Partial<WidgetData>) => void;
  onClose?: () => void;
}

const stretch = { fillContainer: true, contentAlignment: 'stretch' as const, transparentBackground: true };

/** Ícones por grupo, com busca. Com um ícone selecionado, o clique troca o desenho e mantém cor e efeitos. */
export const IconsPanel: React.FC<IconsPanelProps> = ({ addWidget, currentWidget, updateWidgetData, onClose }) => {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('todos');
  const selectedIcon = currentWidget?.type === WidgetType.ICON ? currentWidget : null;
  const presets = widgetCatalog[WidgetType.ICON].presets;

  const results = useMemo(() => {
    const q = norm(query.trim());
    return ICON_LIST.filter(i => (group === 'todos' || i.groupId === group) && (!q || norm(`${i.label} ${i.keywords} ${i.groupLabel}`).includes(q)));
  }, [query, group]);

  const pick = (key: string) => {
    if (selectedIcon && updateWidgetData) {
      updateWidgetData(selectedIcon.i, { iconConfig: { ...(selectedIcon.data.iconConfig || { name: key }), name: key } });
      return;
    }
    addWidget(WidgetType.ICON, { ...stretch, iconConfig: { name: key, color: '#ffffff', strokeWidth: 2, variant: 'stroke' } });
  };

  return (
    <div className="hub-panel">
      <PanelHeader
        title="Ícones"
        subtitle={selectedIcon ? 'O clique troca o ícone selecionado.' : 'O clique adiciona o ícone na tela.'}
        onClose={onClose}
      />
      <div className="px-3.5 pt-3 space-y-2.5">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar: pizza, wifi, desconto" />
        <div className="hub-chip-row" role="group" aria-label="Grupos de ícones">
          <button type="button" className="hub-chip" aria-pressed={group === 'todos'} onClick={() => setGroup('todos')}>Todos</button>
          {ICON_GROUPS.map(g => (
            <button key={g.id} type="button" className="hub-chip" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>{g.label}</button>
          ))}
        </div>
      </div>
      <div className="hub-panel__body space-y-5">
        {!query && group === 'todos' && presets.length > 0 && (
          <div>
            <SectionTitle>Prontos com efeito</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(p => {
                const data = p.data();
                return (
                  <button key={p.id} type="button" onClick={() => addWidget(WidgetType.ICON, data)} title={p.description} aria-label={`Adicionar ${p.title}`}
                    className="block text-left rounded-lg border-2 border-transparent hover:border-marca focus-visible:border-marca outline-none p-0">
                    <div className="hub-sample" style={{ aspectRatio: '1 / 1' }}><div style={{ width: '70%', height: '70%' }}><IconWidget data={data as WidgetData} /></div></div>
                    <span className="block mt-1 text-[11px] md:text-[10px] font-bold text-tinta-2 leading-tight">{p.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <SectionTitle>{query ? `Resultados (${results.length})` : 'Todos os ícones'}</SectionTitle>
          {results.length === 0 ? (
            <p className="text-sm md:text-xs text-tinta-3">Nenhum ícone com essa palavra.</p>
          ) : (
            <div className="hub-icon-grid">
              {results.map(i => (
                <button key={i.key} type="button" className="hub-icon-btn" title={i.label} aria-label={i.label} aria-pressed={selectedIcon?.data.iconConfig?.name === i.key} onClick={() => pick(i.key)}>
                  <i.Icon size={22} strokeWidth={2} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
