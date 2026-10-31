import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { WidgetType, type LayoutItem } from '../../../types';
import { SCENE_TEMPLATES, SEGMENTS, type SceneTemplate, type Segment } from '../presets/sceneTemplates';
import { getTextStyle, getWidgetTransformStyle } from '../widgetStyles';
import { IconWidget } from '../../widgets/IconWidget';
import { ShapeWidget } from '../../widgets/ShapeWidget';
import { PanelHeader, SearchBox, STORAGE_FAVORITES, STORAGE_RECENTS, norm, useStoredList } from './panelKit';

interface TemplatesPanelProps {
  /** Orientação da tela em edição: mostra primeiro os modelos que cabem nela. */
  orientation: 'horizontal' | 'vertical';
  onApplyTemplate: (template: SceneTemplate) => void;
  onClose?: () => void;
}

type Filter = 'todos' | 'favoritos' | 'recentes' | Segment | 'geral';

/** Foto menor na miniatura: o modelo guarda a de 1600 px, a lista carrega a de 360 px. */
const smallPhoto = (url: string) => url.replace(/([?&])w=\d+/, '$1w=360');

const justify = (align?: string) => (align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center');

type Item = Omit<LayoutItem, 'i'>;

const ThumbItem: React.FC<{ item: Item; cols: number; rows: number }> = ({ item, cols, rows }) => {
  const d = item.data;
  const box: React.CSSProperties = {
    left: `${(item.x / cols) * 100}%`, top: `${(item.y / rows) * 100}%`,
    width: `${(item.w / cols) * 100}%`, height: `${(item.h / rows) * 100}%`,
    zIndex: d.zIndex ?? 1,
    ...getWidgetTransformStyle(d),
  };
  switch (item.type) {
    case WidgetType.TEXT:
      return (
        <div className="hub-thumb__item hub-thumb__item--text" style={{ ...box, transform: undefined, justifyContent: justify(d.textConfig?.textAlign), textAlign: d.textConfig?.textAlign || 'center' }}>
          <p style={{ ...getTextStyle(d), transform: d.rotation ? `rotate(${d.rotation}deg)` : undefined }}>{d.content}</p>
        </div>
      );
    case WidgetType.IMAGE:
      return d.url ? (
        <div className="hub-thumb__item" style={box}>
          <img src={smallPhoto(d.url)} alt="" loading="lazy" decoding="async" style={{ objectFit: 'cover' }} />
        </div>
      ) : null;
    case WidgetType.ICON:
      return <div className="hub-thumb__item" style={box}><IconWidget data={d} /></div>;
    case WidgetType.SHAPE:
      return <div className="hub-thumb__item" style={box}><ShapeWidget data={d} /></div>;
    case WidgetType.MOTION: {
      // Placeholder estático: o iframe real só roda na cena, para a lista de modelos continuar leve.
      const colors = d.motionConfig?.colors || {};
      const fields = d.motionConfig?.fields || {};
      const firstText = Object.values(fields).find(v => typeof v === 'string' && v && !/^https?:/.test(v)) || 'Animação';
      const bg = colors.fundo || colors.faixa || colors.selo || Object.values(colors)[0] || '#334155';
      const fg = colors.texto || colors.numero || '#ffffff';
      return (
        <div className="hub-thumb__item" style={box}>
          <div className="hub-thumb__motion" style={{ background: bg, color: fg }}>{firstText}</div>
        </div>
      );
    }
    default:
      return null;
  }
};

export const TemplateThumb: React.FC<{ template: SceneTemplate }> = React.memo(({ template }) => {
  const horizontal = template.orientation === 'horizontal';
  const cols = horizontal ? 48 : 27;
  const rows = horizontal ? 27 : 48;
  return (
    <div className={`hub-thumb ${horizontal ? 'hub-thumb--h' : 'hub-thumb--v'}`} aria-hidden="true">
      {template.layout.map((item, index) => <ThumbItem key={index} item={item} cols={cols} rows={rows} />)}
    </div>
  );
});

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ orientation, onApplyTemplate, onClose }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [onlyOrientation, setOnlyOrientation] = useState(true);
  const favorites = useStoredList(STORAGE_FAVORITES);
  const recents = useStoredList(STORAGE_RECENTS, 12);

  const filters: { id: Filter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'favoritos', label: 'Favoritos' },
    { id: 'recentes', label: 'Recentes' },
    ...SEGMENTS.map(s => ({ id: s.id as Filter, label: s.label })),
    { id: 'geral', label: 'Qualquer negócio' },
  ];

  const visible = useMemo(() => {
    const q = norm(query.trim());
    const list = SCENE_TEMPLATES.filter(t => {
      if (onlyOrientation && t.orientation !== orientation) return false;
      if (filter === 'favoritos') return favorites.has(t.id);
      if (filter === 'recentes') return recents.has(t.id);
      if (filter === 'geral') return t.segment === 'todos';
      if (filter !== 'todos' && t.segment !== filter) return false;
      if (!q) return true;
      const segmentLabel = SEGMENTS.find(s => s.id === t.segment)?.label || 'qualquer negocio';
      return norm([t.title, segmentLabel, ...(t.tags || [])].join(' ')).includes(q);
    });
    // Recentes aparecem na ordem de uso; os demais, na ordem do catálogo.
    return filter === 'recentes' ? [...list].sort((a, b) => recents.items.indexOf(a.id) - recents.items.indexOf(b.id)) : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, onlyOrientation, orientation, favorites.items, recents.items]);

  const apply = (t: SceneTemplate) => { recents.push(t.id); onApplyTemplate(t); };
  const vertical = onlyOrientation ? orientation === 'vertical' : false;

  return (
    <div className="hub-panel">
      <PanelHeader title="Modelos" subtitle="Telas prontas. Tudo pode ser editado depois." onClose={onClose} />
      <div className="px-3.5 pt-3 space-y-2.5">
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar: oferta, cardápio, horário" />
        <div className="hub-chip-row" role="group" aria-label="Filtrar por segmento">
          {filters.map(f => (
            <button key={f.id} type="button" className="hub-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 min-h-[44px] md:min-h-0 text-sm md:text-[11px] text-tinta-2 cursor-pointer select-none">
          <input type="checkbox" checked={onlyOrientation} onChange={e => setOnlyOrientation(e.target.checked)} className="w-4 h-4 accent-marca" />
          Só modelos {orientation === 'horizontal' ? 'horizontais' : 'verticais'} (formato desta tela)
        </label>
      </div>
      <div className="hub-panel__body">
        {visible.length === 0 ? (
          <p className="text-sm md:text-xs text-tinta-3 leading-relaxed">
            {filter === 'favoritos' ? 'Toque na estrela de um modelo para guardar aqui.' : filter === 'recentes' ? 'Os modelos que você usar aparecem aqui.' : 'Nenhum modelo encontrado. Tente outra palavra ou outro segmento.'}
          </p>
        ) : (
          <div className={`hub-template-grid ${vertical ? 'hub-template-grid--v' : ''}`}>
            {visible.map(t => (
              <div key={t.id} className="relative">
                <button type="button" className="hub-template-card" onClick={() => apply(t)} aria-label={`Usar modelo ${t.title}`} title={t.title}>
                  <TemplateThumb template={t} />
                  <span className="block mt-1 px-0.5 text-xs md:text-[10px] font-bold text-tinta-2 truncate">{t.title}</span>
                </button>
                <button
                  type="button"
                  className="hub-template-card__fav"
                  aria-pressed={favorites.has(t.id)}
                  aria-label={favorites.has(t.id) ? `Tirar ${t.title} dos favoritos` : `Guardar ${t.title} nos favoritos`}
                  onClick={() => favorites.toggle(t.id)}
                >
                  <Star size={14} fill={favorites.has(t.id) ? '#fde047' : 'none'} color={favorites.has(t.id) ? '#fde047' : '#fff'} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
