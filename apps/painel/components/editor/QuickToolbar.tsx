import type { EditorLeftPanel } from '../../types';
import React, { useEffect, useState } from 'react';
import {
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  ArrowDown, ArrowUp, ArrowUpDown, Blend, Bold, BringToFront, Clapperboard, Copy, Frame, Italic, Layers, Lock, LockOpen,
  MoreHorizontal, MousePointer2, Pencil, Replace, SendToBack, SlidersHorizontal, Sparkles, Trash2, Underline, Volume2, VolumeX, X,
} from 'lucide-react';
import { LayoutItem, WidgetData, WidgetType } from '../../types';
import { TEXT_STYLE_PRESETS } from './widgetStyles';
import { QuickPopover } from './toolbar/QuickPopover';
import { QuickSlider } from './toolbar/QuickSlider';
import { QuickColor } from './toolbar/QuickColor';
import './QuickToolbar.css';

export interface QuickToolbarProps {
  onOpenPanel?: (panel: EditorLeftPanel) => void;
  onLayer?: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
  currentWidget: LayoutItem | undefined;
  updateWidgetData: (id: string, data: Partial<WidgetData>) => void;
  onMore: () => void;
  moreOpen?: boolean;
  onMedia: (kind: 'image' | 'video') => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

/** Fontes carregadas pelo painel (index.css e index.html) e já oferecidas no painel de propriedades. */
export const QUICK_FONTS = ['Inter', 'Geist', 'Outfit', 'Exo 2', 'Roboto', 'Georgia', 'Courier New', 'Impact'];

type ImageFrame = NonNullable<NonNullable<WidgetData['imageConfig']>['frame']>;
const FRAME_OPTIONS: { value: ImageFrame; label: string }[] = [
  { value: 'none', label: 'Sem moldura' },
  { value: 'rounded', label: 'Cantos redondos' },
  { value: 'circle', label: 'Círculo' },
  { value: 'arch', label: 'Arco' },
  { value: 'blob', label: 'Orgânica' },
  { value: 'polaroid', label: 'Polaroid' },
];

const LAYER_ACTIONS = [
  { direction: 'top', label: 'Trazer para a frente', Icon: BringToFront },
  { direction: 'up', label: 'Subir uma camada', Icon: ArrowUp },
  { direction: 'down', label: 'Descer uma camada', Icon: ArrowDown },
  { direction: 'bottom', label: 'Enviar para o fundo', Icon: SendToBack },
] as const;

const pct = (value: number) => `${Math.round(value)}%`;
const decimal = (value: number) => value.toFixed(2).replace('.', ',');

const widgetPresentation: Record<WidgetType, [string, number]> = {
  IMAGE: ['Imagem', 0], VIDEO: ['Vídeo', 1], TEXT: ['Texto', 2], GIF: ['GIF', 3], IFRAME: ['Site', 4],
  CLOCK: ['Relógio', 5], WEATHER: ['Clima', 6], FULL_INFO: ['Painel completo', 7], RSS: ['Notícias', 8], CALENDAR: ['Agenda', 9],
  NOTES: ['Notas', 10], TODO: ['Tarefas', 11], COUNTDOWN: ['Contador', 12], CHORES: ['Deveres', 13], MEAL_PLAN: ['Cardápio', 14],
  MARKET_WATCH: ['Cotações', 15], BROWSER_SNAPSHOT: ['Captura de site', 16], GOOGLE_DOCS: ['Google Docs', 17], OFFICE_DOCS: ['Office', 18],
  POWER_BI: ['Power BI', 19], AIRTABLE: ['Airtable', 20], PDF_DOCUMENT: ['PDF', 21], EMBED_HTML: ['HTML', 22],
  ICON: ['Ícone', 2], SHAPE: ['Forma', 0], MOTION: ['Motion', 22],
};

export function QuickWidgetArt({ type }: { type: WidgetType }) {
  const index = widgetPresentation[type][1];
  return <span className="hub-quick-art" aria-hidden="true" style={{ backgroundPosition: `${(index % 5) * 25}% ${[3.9, 27.83, 50.39, 73.44, 96.68][Math.floor(index / 5)]}%` }} />;
}

export const QuickToolbar: React.FC<QuickToolbarProps> = ({ currentWidget, updateWidgetData, onMore, moreOpen = false, onMedia, onRemove, onDuplicate, onOpenPanel, onLayer }) => {
  const [editingContent, setEditingContent] = useState(false);
  useEffect(() => setEditingContent(false), [currentWidget?.i]);

  if (!currentWidget) return (
    <div className="hub-quick-tools hub-quick-tools--empty" aria-label="Ferramentas da tela">
      <MousePointer2 size={17} aria-hidden="true" />
      <span>Escolha um elemento na TV ou adicione pela biblioteca.</span>
    </div>
  );

  const { data, type, i: id } = currentWidget;
  const patch = (updates: Partial<WidgetData>) => updateWidgetData(id, updates);
  const patchText = (updates: Partial<NonNullable<WidgetData['textConfig']>>) => patch({ textConfig: { ...data.textConfig, ...updates } });
  const patchImage = (updates: Partial<NonNullable<WidgetData['imageConfig']>>) => patch({ imageConfig: { ...data.imageConfig, ...updates } });
  const patchIcon = (updates: Partial<NonNullable<WidgetData['iconConfig']>>) => patch({ iconConfig: { name: 'star', ...data.iconConfig, ...updates } });
  const patchShape = (updates: Partial<NonNullable<WidgetData['shapeConfig']>>) => patch({ shapeConfig: { kind: 'rect', ...data.shapeConfig, ...updates } });
  /** Botão que abre um painel na coluna da esquerda. Some quando o Editor não ligou `onOpenPanel` e não há alternativa. */
  const panelButton = (panel: EditorLeftPanel, label: string, Icon: React.ComponentType<{ size?: number }>, fallback?: () => void) => {
    const action = onOpenPanel ? () => onOpenPanel(panel) : fallback;
    if (!action) return null;
    return <button type="button" className="hub-quick-labeled" onClick={action}><Icon size={16} />{label}</button>;
  };
  const contentEditable = type === WidgetType.TEXT || type === WidgetType.NOTES;
  const isText = type === WidgetType.TEXT;
  const isBold = !data.textConfig?.fontWeight || data.textConfig.fontWeight === 'bold' || Number(data.textConfig.fontWeight) >= 600;
  const fontSize = isText ? data.textConfig?.fontSize || data.fontSize || '4cqw' : data.fontSize || '8cqw';
  const fontUnit = fontSize.match(/[a-z%]+$/i)?.[0] || 'px';
  const fontNumber = parseFloat(fontSize) || 4;
  const sizeControl = (
    <label className="hub-quick-size" title="Tamanho da fonte">
      <span className="hub-quick-sr-only">Tamanho da fonte</span>
      <input aria-label="Tamanho da fonte" type="number" min="0.5" step={fontUnit === 'px' ? 1 : 0.1} value={fontNumber} onChange={event => {
        const value = Number(event.target.value);
        if (!Number.isFinite(value) || value <= 0) return;
        const next = `${value}${fontUnit}`;
        patch(isText ? { fontSize: next, textConfig: { ...data.textConfig, fontSize: next } } : { fontSize: next });
      }} />
      <span>{fontUnit === 'cqw' || fontUnit === 'vw' || fontUnit === 'cqmin' ? '%' : fontUnit}</span>
    </label>
  );
  const mainInput = (label: string, value: string | undefined, onChange: (value: string) => void, inputType = 'text') => (
    <label className="hub-quick-field">
      <span className="hub-quick-sr-only">{label}</span>
      <input type={inputType} aria-label={label} placeholder={label} value={value || ''} onChange={event => onChange(event.target.value)} />
    </label>
  );

  let contextualControls: React.ReactNode;
  switch (type) {
    case WidgetType.IMAGE:
    case WidgetType.GIF: {
      const brightness = data.imageConfig?.brightness ?? 100;
      const contrast = data.imageConfig?.contrast ?? 100;
      contextualControls = <>
        <button type="button" className="hub-quick-action" onClick={() => onMedia('image')}><QuickWidgetArt type={type} />Trocar imagem</button>
        {type === WidgetType.IMAGE && <select aria-label="Encaixe da imagem" value={data.imageConfig?.objectFit || 'cover'} onChange={event => patch({ imageConfig: { ...data.imageConfig, objectFit: event.target.value as 'cover' | 'contain' | 'fill' } })}>
          <option value="cover">Preencher</option><option value="contain">Imagem inteira</option><option value="fill">Esticar</option>
        </select>}
        {panelButton('image-filters', 'Filtros', Sparkles)}
        <label className="hub-quick-select-icon" title="Moldura da foto">
          <Frame size={15} aria-hidden="true" />
          <select aria-label="Moldura da foto" value={data.imageConfig?.frame || 'none'} onChange={event => patchImage({ frame: event.target.value as ImageFrame })}>
            {FRAME_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <QuickPopover label="Ajustes da foto" trigger={<button type="button" className="hub-quick-labeled"><SlidersHorizontal size={16} />Ajustar</button>}>
          <QuickSlider label="Brilho" value={brightness} min={0} max={200} format={pct} onChange={value => patchImage({ brightness: value })} />
          <QuickSlider label="Contraste" value={contrast} min={0} max={200} format={pct} onChange={value => patchImage({ contrast: value })} />
          <button type="button" className="hub-pop-reset" disabled={brightness === 100 && contrast === 100} onClick={() => patchImage({ brightness: 100, contrast: 100 })}>Voltar ao original</button>
        </QuickPopover>
      </>;
      break;
    }
    case WidgetType.VIDEO:
      contextualControls = <>
        <button type="button" className="hub-quick-action" onClick={() => onMedia('video')}><QuickWidgetArt type={type} />Trocar vídeo</button>
        <button type="button" aria-pressed={!(data.videoConfig?.mute ?? true)} onClick={() => patch({ videoConfig: { ...data.videoConfig, mute: !(data.videoConfig?.mute ?? true) } })}>
          {(data.videoConfig?.mute ?? true) ? <VolumeX size={16} /> : <Volume2 size={16} />}{(data.videoConfig?.mute ?? true) ? 'Sem som' : 'Com som'}
        </button>
      </>;
      break;
    case WidgetType.TEXT: {
      const textConfig = data.textConfig || {};
      const fontFamily = textConfig.fontFamily || 'Inter';
      const fonts = QUICK_FONTS.includes(fontFamily) ? QUICK_FONTS : [fontFamily, ...QUICK_FONTS];
      const lineHeight = textConfig.lineHeight ?? (textConfig.textStyle ? TEXT_STYLE_PRESETS[textConfig.textStyle].lineHeight : 1.15);
      const letterSpacing = textConfig.letterSpacing ?? 0;
      const vertical = data.contentAlignment === 'start' || data.contentAlignment === 'end' ? data.contentAlignment : 'center';
      contextualControls = <>
        <button type="button" className="hub-quick-action" aria-expanded={editingContent} aria-controls="quick-content-editor" onClick={() => setEditingContent(value => !value)}><QuickWidgetArt type={type} />Editar texto</button>
        <select aria-label="Estilo do texto" value={textConfig.textStyle || ''} onChange={event => {
          const key = event.target.value as keyof typeof TEXT_STYLE_PRESETS;
          const preset = TEXT_STYLE_PRESETS[key];
          if (!preset) return;
          patch({ fontSize: preset.fontSize, textConfig: { ...textConfig, textStyle: key, fontSize: preset.fontSize, fontWeight: preset.fontWeight, lineHeight: preset.lineHeight } });
        }}>
          {!textConfig.textStyle && <option value="" disabled>Estilo</option>}
          {(Object.keys(TEXT_STYLE_PRESETS) as (keyof typeof TEXT_STYLE_PRESETS)[]).map(key => <option key={key} value={key}>{TEXT_STYLE_PRESETS[key].label}</option>)}
        </select>
        <select aria-label="Fonte do texto" value={fontFamily} style={{ fontFamily }} onChange={event => patchText({ fontFamily: event.target.value })}>
          {fonts.map(font => <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>)}
        </select>
        {sizeControl}
        <div className="hub-quick-align" role="group" aria-label="Formatação">
          <button type="button" className="hub-quick-icon" aria-label="Negrito" title="Negrito" aria-pressed={isBold} onClick={() => patchText({ fontWeight: isBold ? 'normal' : 'bold' })}><Bold size={16} /></button>
          <button type="button" className="hub-quick-icon" aria-label="Itálico" title="Itálico" aria-pressed={textConfig.fontStyle === 'italic'} onClick={() => patchText({ fontStyle: textConfig.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={16} /></button>
          <button type="button" className="hub-quick-icon" aria-label="Sublinhado" title="Sublinhado" aria-pressed={textConfig.textDecoration === 'underline'} onClick={() => patchText({ textDecoration: textConfig.textDecoration === 'underline' ? 'none' : 'underline' })}><Underline size={16} /></button>
        </div>
        <QuickColor label="Cor do texto" value={data.color} icon={<span className="hub-quick-swatch__letter" aria-hidden="true">A</span>} onChange={color => patch({ color })} />
        <div className="hub-quick-align" role="group" aria-label="Alinhamento do texto">
          {([{ value: 'left', label: 'Alinhar à esquerda', Icon: AlignLeft }, { value: 'center', label: 'Centralizar texto', Icon: AlignCenter }, { value: 'right', label: 'Alinhar à direita', Icon: AlignRight }] as const).map(({ value, label, Icon }) => <button type="button" key={value} className="hub-quick-icon" aria-label={label} title={label} aria-pressed={(textConfig.textAlign || 'center') === value} onClick={() => patchText({ textAlign: value })}><Icon size={16} /></button>)}
        </div>
        {!data.fillContainer && <div className="hub-quick-align" role="group" aria-label="Posição vertical do texto">
          {([{ value: 'start', label: 'Texto no topo', Icon: AlignVerticalJustifyStart }, { value: 'center', label: 'Texto no meio', Icon: AlignVerticalJustifyCenter }, { value: 'end', label: 'Texto embaixo', Icon: AlignVerticalJustifyEnd }] as const).map(({ value, label, Icon }) => <button type="button" key={value} className="hub-quick-icon" aria-label={label} title={label} aria-pressed={vertical === value} onClick={() => patch({ contentAlignment: value })}><Icon size={16} /></button>)}
        </div>}
        <QuickPopover label="Espaçamento" trigger={<button type="button" className="hub-quick-icon" aria-label="Espaçamento" title="Espaçamento"><ArrowUpDown size={16} /></button>}>
          <QuickSlider label="Entre linhas" value={lineHeight} min={0.8} max={2.5} step={0.05} format={decimal} onChange={value => patchText({ lineHeight: Math.round(value * 100) / 100 })} />
          <QuickSlider label="Entre letras" value={letterSpacing} min={-0.1} max={0.5} step={0.01} format={decimal} onChange={value => patchText({ letterSpacing: Math.round(value * 100) / 100 })} />
          <button type="button" className="hub-pop-reset" disabled={textConfig.lineHeight === undefined && textConfig.letterSpacing === undefined} onClick={() => patchText({ lineHeight: undefined, letterSpacing: undefined })}>Voltar ao padrão</button>
        </QuickPopover>
        {panelButton('text-effects', 'Efeitos', Sparkles)}
      </>;
      break;
    }
    case WidgetType.ICON: {
      const icon = data.iconConfig;
      contextualControls = <>
        {panelButton('icons', 'Trocar ícone', Replace)}
        <QuickColor label="Cor do ícone" value={icon?.color} onChange={color => patchIcon({ color })} />
        <button type="button" className="hub-quick-labeled" aria-pressed={icon?.variant === 'filled'} onClick={() => patchIcon({ variant: icon?.variant === 'filled' ? 'stroke' : 'filled' })}>Preenchido</button>
        <QuickPopover label="Espessura do traço" trigger={<button type="button" className="hub-quick-labeled">Espessura</button>}>
          <QuickSlider label="Traço" value={icon?.strokeWidth ?? 2} min={0.5} max={4} step={0.25} format={decimal} onChange={strokeWidth => patchIcon({ strokeWidth })} />
        </QuickPopover>
        {panelButton('effects', 'Efeitos', Sparkles)}
      </>;
      break;
    }
    case WidgetType.SHAPE: {
      const shape = data.shapeConfig;
      const hasStroke = !!shape?.stroke && shape.stroke !== 'none';
      contextualControls = <>
        <QuickColor label="Cor de preenchimento" value={shape?.fill} fallback="#02c2cd" onChange={fill => patchShape({ fill })} />
        <QuickColor label="Cor do contorno" value={shape?.stroke} allowNone icon={<span className="hub-quick-swatch__ring" aria-hidden="true" />} onChange={stroke => patchShape(stroke === 'none' ? { stroke: 'none', strokeWidth: 0 } : { stroke, strokeWidth: shape?.strokeWidth || 4 })} />
        <QuickPopover label="Espessura do contorno" trigger={<button type="button" className="hub-quick-labeled">Espessura</button>}>
          <QuickSlider label="Contorno" value={shape?.strokeWidth ?? 0} min={0} max={24} format={value => `${value} px`} onChange={strokeWidth => patchShape({ strokeWidth, stroke: hasStroke ? shape?.stroke : '#ffffff' })} />
        </QuickPopover>
        {panelButton('effects', 'Efeitos', Sparkles)}
      </>;
      break;
    }
    case WidgetType.MOTION:
      contextualControls = panelButton('motion', 'Editar motion', Clapperboard, onMore);
      break;
    case WidgetType.NOTES:
      contextualControls = <>
        <button type="button" className="hub-quick-action" aria-expanded={editingContent} aria-controls="quick-content-editor" onClick={() => setEditingContent(value => !value)}><QuickWidgetArt type={type} />Editar nota</button>
        <select aria-label="Estilo da nota" value={data.notesConfig?.paperTheme || 'glass'} onChange={event => patch({ notesConfig: { ...data.notesConfig, paperTheme: event.target.value as NonNullable<WidgetData['notesConfig']>['paperTheme'] } })}>
          <option value="glass">Vidro</option><option value="yellow-sticky">Papel amarelo</option><option value="purple-haze">Roxo</option><option value="neon-glow">Neon</option>
        </select>
      </>;
      break;
    case WidgetType.WEATHER:
    case WidgetType.FULL_INFO:
      contextualControls = mainInput('Cidade', data.city, city => patch({ city })); break;
    case WidgetType.CLOCK:
      contextualControls = <><select aria-label="Estilo do relógio" value={data.model || 'standard'} onChange={event => patch({ model: event.target.value })}>
        <option value="standard">Hora e segundos</option><option value="minimal">Hora e minutos</option><option value="date-time">Data e hora</option><option value="analog">Ponteiros</option><option value="neon">Neon</option><option value="vertical">Vertical</option>
      </select>{sizeControl}</>; break;
    case WidgetType.COUNTDOWN:
      contextualControls = mainInput('Data e hora do evento', data.countdownConfig?.targetDate?.slice(0, 16), targetDate => patch({ countdownConfig: { ...data.countdownConfig, targetDate } }), 'datetime-local'); break;
    case WidgetType.TODO:
      contextualControls = mainInput('Título da lista', data.todoConfig?.title, title => patch({ todoConfig: { items: [], ...data.todoConfig, title } })); break;
    case WidgetType.CHORES:
      contextualControls = mainInput('Título dos deveres', data.choresConfig?.title, title => patch({ choresConfig: { items: [], ...data.choresConfig, title } })); break;
    case WidgetType.MEAL_PLAN:
      contextualControls = mainInput('Título do cardápio', data.mealPlanConfig?.title, title => patch({ mealPlanConfig: { days: {}, ...data.mealPlanConfig, title } })); break;
    case WidgetType.RSS:
      contextualControls = <select aria-label="Formato das notícias" value={data.rssConfig?.layout || 'full-image'} onChange={event => patch({ rssConfig: { ...data.rssConfig, layout: event.target.value as NonNullable<WidgetData['rssConfig']>['layout'] } })}><option value="full-image">Imagem em destaque</option><option value="split">Imagem e texto</option><option value="ticker">Faixa de notícias</option></select>; break;
    case WidgetType.CALENDAR:
      contextualControls = mainInput('Título da agenda', data.calendarConfig?.customTitle, customTitle => patch({ calendarConfig: { ...data.calendarConfig, customTitle, showTitle: true } })); break;
    case WidgetType.IFRAME:
      contextualControls = mainInput('Endereço do site', data.url, url => patch({ url }), 'url'); break;
    case WidgetType.BROWSER_SNAPSHOT:
      contextualControls = mainInput('Endereço do site', data.browserSnapshotConfig?.url, url => patch({ browserSnapshotConfig: { ...data.browserSnapshotConfig, url } }), 'url'); break;
    case WidgetType.GOOGLE_DOCS:
      contextualControls = mainInput('Link do documento', data.googleDocsConfig?.url, url => patch({ googleDocsConfig: { docType: 'document', ...data.googleDocsConfig, url } }), 'url'); break;
    case WidgetType.OFFICE_DOCS:
      contextualControls = mainInput('Link do documento', data.officeDocsConfig?.url, url => patch({ officeDocsConfig: { docType: 'word', ...data.officeDocsConfig, url } }), 'url'); break;
    case WidgetType.POWER_BI:
      contextualControls = mainInput('Link do painel', data.powerBiConfig?.embedUrl, embedUrl => patch({ powerBiConfig: { ...data.powerBiConfig, embedUrl } }), 'url'); break;
    case WidgetType.AIRTABLE:
      contextualControls = mainInput('Link da tabela', data.airtableConfig?.shareUrl, shareUrl => patch({ airtableConfig: { ...data.airtableConfig, shareUrl } }), 'url'); break;
    case WidgetType.PDF_DOCUMENT:
      contextualControls = mainInput('Link do PDF', data.pdfDocumentConfig?.pdfUrl, pdfUrl => patch({ pdfDocumentConfig: { ...data.pdfDocumentConfig, pdfUrl } }), 'url'); break;
    case WidgetType.MARKET_WATCH:
      contextualControls = <select aria-label="Formato das cotações" value={data.marketWatchConfig?.layout || 'grid'} onChange={event => patch({ marketWatchConfig: { symbols: [], ...data.marketWatchConfig, layout: event.target.value as NonNullable<WidgetData['marketWatchConfig']>['layout'] } })}><option value="grid">Cards</option><option value="list">Lista</option><option value="ticker">Faixa contínua</option></select>; break;
    case WidgetType.EMBED_HTML:
      contextualControls = <button type="button" onClick={onMore}><Pencil size={15} />Editar HTML</button>; break;
  }

  return <div className="hub-quick-tools" onPointerDown={event => event.stopPropagation()}>
    <div className="hub-quick-tools__row" role="toolbar" aria-label={`Ferramentas de ${widgetPresentation[type][0]}`}>
      {!contentEditable && type !== WidgetType.IMAGE && type !== WidgetType.GIF && type !== WidgetType.VIDEO && <span className="hub-quick-kind"><QuickWidgetArt type={type} /><span>{widgetPresentation[type][0]}</span></span>}
      {contextualControls}
      <span className="hub-quick-divider" aria-hidden="true" />
      <QuickPopover label="Transparência" align="end" trigger={<button type="button" className="hub-quick-icon" aria-label="Transparência" title="Transparência"><Blend size={16} /></button>}>
        <QuickSlider label="Opacidade" value={Math.round((data.opacity ?? 1) * 100)} min={0} max={100} format={pct} onChange={value => patch({ opacity: value / 100 })} />
      </QuickPopover>
      {onLayer && <QuickPopover label="Camadas" align="end" trigger={<button type="button" className="hub-quick-icon" aria-label="Camadas" title="Camadas"><Layers size={16} /></button>}>
        <div className="hub-pop-list">
          {LAYER_ACTIONS.map(({ direction, label, Icon }) => <button type="button" key={direction} onClick={() => onLayer(direction)}><Icon size={16} />{label}</button>)}
        </div>
      </QuickPopover>}
      <button type="button" className="hub-quick-icon" title={data.locked ? 'Destravar elemento' : 'Travar elemento'} aria-label={data.locked ? 'Destravar elemento' : 'Travar elemento'} aria-pressed={!!data.locked} onClick={() => patch({ locked: !data.locked })}>{data.locked ? <Lock size={16} /> : <LockOpen size={16} />}</button>
      <button type="button" className="hub-quick-icon" title="Duplicar elemento" aria-label="Duplicar elemento" onClick={onDuplicate}><Copy size={16} /></button>
      <button type="button" className="hub-quick-icon hub-quick-remove" title="Excluir elemento" aria-label="Excluir elemento" onClick={onRemove}><Trash2 size={16} /></button>
      <button type="button" className="hub-quick-more" title="Todas as opções" aria-label="Todas as opções" aria-expanded={moreOpen} aria-controls="widget-advanced-options" onClick={onMore}><MoreHorizontal size={20} /><span>Mais</span></button>
    </div>
    {contentEditable && editingContent && <div id="quick-content-editor" className="hub-quick-content" onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape') setEditingContent(false); }}>
      <div><label htmlFor="quick-content-value">{isText ? 'Texto na TV' : 'Conteúdo da nota'}</label><button type="button" aria-label="Fechar edição de texto" onClick={() => setEditingContent(false)}><X size={16} /></button></div>
      <textarea id="quick-content-value" autoFocus rows={3} value={data.content || ''} onChange={event => patch({ content: event.target.value })} />
      <span>As alterações aparecem na prévia. Salve para atualizar a TV.</span>
    </div>}
  </div>;
};
