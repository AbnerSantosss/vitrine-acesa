import React, { Suspense } from 'react';
import type { Display, DisplayWall, LayoutItem, Page } from '../../types';
import { WidgetType } from '../../types';
import { getAlignmentClasses } from '../Player';
import { LiveClock, NotesWidget, TodoWidget, CountdownWidget, ChoresWidget, MealPlanWidget } from '../widgets';
import { getCanvasGeometry, getWallSeams } from './canvasGeometry';
import { getTextStyle, getImageFilter, getImageFrameStyle, getWidgetTransformStyle } from './widgetStyles';
import { renderDesignWidget } from './designWidgets';
import './EditorLayout.css';

/** Nome em português de cada tipo de elemento (miniaturas e painel de camadas). */
export const WIDGET_LABELS: Record<WidgetType, string> = {
  [WidgetType.IMAGE]: 'Imagem', [WidgetType.TEXT]: 'Texto', [WidgetType.IFRAME]: 'Site', [WidgetType.WEATHER]: 'Clima',
  [WidgetType.CLOCK]: 'Relógio', [WidgetType.VIDEO]: 'Vídeo', [WidgetType.RSS]: 'Notícias', [WidgetType.CALENDAR]: 'Agenda',
  [WidgetType.GIF]: 'GIF', [WidgetType.FULL_INFO]: 'Painel completo', [WidgetType.NOTES]: 'Notas', [WidgetType.TODO]: 'Tarefas',
  [WidgetType.COUNTDOWN]: 'Contador', [WidgetType.CHORES]: 'Deveres', [WidgetType.MEAL_PLAN]: 'Cardápio',
  [WidgetType.MARKET_WATCH]: 'Cotações', [WidgetType.BROWSER_SNAPSHOT]: 'Captura de site', [WidgetType.GOOGLE_DOCS]: 'Google Docs',
  [WidgetType.OFFICE_DOCS]: 'Office', [WidgetType.POWER_BI]: 'Power BI', [WidgetType.EMBED_HTML]: 'HTML',
  [WidgetType.AIRTABLE]: 'Airtable', [WidgetType.PDF_DOCUMENT]: 'PDF', [WidgetType.ICON]: 'Ícone',
  [WidgetType.SHAPE]: 'Forma', [WidgetType.MOTION]: 'Motion',
};

/** Contrato da miniatura real de uma cena. */
export interface ScenePreviewProps {
  page: Page;
  orientation?: Display['orientation'];
  wall?: DisplayWall | null;
  /** Largura final em px; a altura sai da proporção da tela. */
  width: number;
  /** Desenha as divisões do videowall por cima. */
  showSeams?: boolean;
  /** false = congela animações e não monta iframes (miniaturas leves). */
  animate?: boolean;
  className?: string;
}

const BACKGROUND_ANIMATION_CLASS: Record<string, string> = {
  'auto-weather': 'bg-gradient-to-br from-slate-800 to-slate-900',
  'gradient-flow': 'bg-anim-gradient-flow',
  clouds: 'bg-anim-clouds',
  rain: 'bg-anim-rain',
  snow: 'bg-anim-snow',
  fire: 'bg-anim-fire',
  'tech-grid': 'bg-anim-tech-grid',
  'pulse-red': 'bg-anim-pulse-red',
  'pulse-blue': 'bg-anim-pulse-blue',
  'pulse-green': 'bg-anim-pulse-green',
  aurora: 'bg-anim-aurora',
};

const YOUTUBE_ID = /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]{11})/;

/** Bloco de cor com o nome do elemento, no lugar do que precisaria de iframe ou de rede. */
const PlaceholderBlock: React.FC<{ item: LayoutItem; cell: number; hint?: string }> = ({ item, cell, hint }) => (
  <div
    style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#e2e8f0', textAlign: 'center',
      fontSize: Math.max(28, Math.min(item.w, item.h) * cell * 0.2), fontWeight: 700, lineHeight: 1.15,
      border: `${cell * 0.3}px solid #334155`, boxSizing: 'border-box', padding: cell * 0.5, overflow: 'hidden',
    }}
  >
    <span>{WIDGET_LABELS[item.type] ?? 'Elemento'}</span>
    {hint && <span style={{ fontSize: '0.55em', fontWeight: 500, opacity: 0.7, marginTop: '0.2em' }}>{hint}</span>}
  </div>
);

function renderThumbWidget(w: LayoutItem, animate: boolean, cell: number): React.ReactNode {
  switch (w.type) {
    case WidgetType.ICON:
    case WidgetType.SHAPE:
      return renderDesignWidget(w, 'editor');
    case WidgetType.MOTION:
      return animate ? renderDesignWidget(w, 'player') : <PlaceholderBlock item={w} cell={cell} />;
    case WidgetType.TEXT: {
      const stretch = w.data.fillContainer || w.data.contentAlignment === 'stretch';
      const align = w.data.textConfig?.textAlign || 'center';
      return (
        <div
          className="w-full h-full flex"
          style={{
            alignItems: stretch ? 'stretch' : w.data.contentAlignment === 'start' ? 'flex-start' : w.data.contentAlignment === 'end' ? 'flex-end' : 'center',
            justifyContent: stretch ? 'stretch' : w.data.contentAlignment === 'start' ? 'flex-start' : w.data.contentAlignment === 'end' ? 'flex-end' : align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
            textAlign: align,
            padding: w.data.padding !== undefined ? w.data.padding : '2rem',
          }}
        >
          <p className="leading-tight" style={{ ...getTextStyle(w.data), whiteSpace: 'pre-line', maxWidth: '100%' }}>{w.data.content}</p>
        </div>
      );
    }
    case WidgetType.IMAGE:
    case WidgetType.GIF:
      return w.data.url ? (
        <div className={`w-full h-full flex ${getAlignmentClasses(w.data.fillContainer ? 'stretch' : w.data.contentAlignment)} overflow-hidden`}>
          <img
            src={w.data.url}
            alt=""
            draggable={false}
            loading="lazy"
            referrerPolicy="no-referrer"
            style={{
              width: '100%', height: '100%',
              objectFit: (w.data.fillContainer || w.data.fitContainerMode === 'stretch') ? 'fill' : (w.data.fitContainerMode || 'cover'),
              filter: getImageFilter(w.data), ...getImageFrameStyle(w.data),
            }}
          />
        </div>
      ) : <PlaceholderBlock item={w} cell={cell} />;
    case WidgetType.VIDEO: {
      const url = w.data.videoUrl;
      if (!url) return <PlaceholderBlock item={w} cell={cell} />;
      const youtube = url.match(YOUTUBE_ID);
      // Capa do YouTube em vez de iframe: parece com a cena e não pesa.
      if (youtube) return <img src={`https://img.youtube.com/vi/${youtube[1]}/hqdefault.jpg`} alt="" draggable={false} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
      return animate
        ? <video src={url} muted loop autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <video src={`${url}#t=0.1`} muted preload="metadata" playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    }
    case WidgetType.CLOCK:
      return animate
        ? <div className="w-full h-full flex flex-col items-center justify-center text-white"><LiveClock city={w.data.city} model={w.data.model} fontSize={w.data.fontSize?.replace('vw', '')} /></div>
        : <PlaceholderBlock item={w} cell={cell} />;
    case WidgetType.NOTES:
      return animate ? <div className="w-full h-full overflow-hidden"><NotesWidget data={w.data} /></div> : <PlaceholderBlock item={w} cell={cell} />;
    case WidgetType.TODO:
      return animate ? <div className="w-full h-full overflow-hidden"><TodoWidget data={w.data} /></div> : <PlaceholderBlock item={w} cell={cell} />;
    case WidgetType.COUNTDOWN:
      return animate ? <div className="w-full h-full overflow-hidden"><CountdownWidget data={w.data} /></div> : <PlaceholderBlock item={w} cell={cell} />;
    case WidgetType.CHORES:
      return animate ? <div className="w-full h-full overflow-hidden"><ChoresWidget data={w.data} /></div> : <PlaceholderBlock item={w} cell={cell} />;
    case WidgetType.MEAL_PLAN:
      return animate ? <div className="w-full h-full overflow-hidden"><MealPlanWidget data={w.data} /></div> : <PlaceholderBlock item={w} cell={cell} />;
    default:
      // Clima, notícias, sites, documentos e painéis dependem de rede ou de iframe.
      return <PlaceholderBlock item={w} cell={cell} />;
  }
}

/** Desenha a cena de verdade, em escala reduzida sobre a grade de 40 px da TV. */
const ScenePreviewBase: React.FC<ScenePreviewProps> = ({ page, orientation, wall, width, showSeams = false, animate = false, className }) => {
  const geometry = getCanvasGeometry(orientation, wall);
  const scale = width / geometry.width;
  const height = geometry.height * scale;
  const cell = geometry.cellSize;
  const seams = showSeams ? getWallSeams(geometry) : null;

  return (
    <div
      className={`hub-scene-preview ${animate ? '' : 'hub-preview-frozen'} ${className ?? ''}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      <div
        className="hub-scene-preview__native"
        style={{ width: geometry.width, height: geometry.height, transform: `scale(${scale})`, containerType: 'size' }}
      >
        {page.backgroundVideoUrl && !page.backgroundImage && (
          <div className="absolute inset-0 bg-black" />
        )}
        {page.backgroundImage && !page.backgroundVideoUrl && (
          <div className="absolute inset-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url(${page.backgroundImage})` }} />
        )}
        {page.backgroundAnimation && page.backgroundAnimation !== 'none' && !page.backgroundImage && !page.backgroundVideoUrl && (
          <div className={`absolute inset-0 ${BACKGROUND_ANIMATION_CLASS[page.backgroundAnimation] ?? ''}`} />
        )}
        <Suspense fallback={null}>
          {page.layout.map(w => {
            const full = !!w.data.fullScreenMode;
            return (
              <div
                key={w.i}
                className={`absolute overflow-hidden flex ${getAlignmentClasses(w.data.fillContainer ? 'stretch' : w.data.contentAlignment)}`}
                style={{
                  left: full ? 0 : w.x * cell,
                  top: full ? 0 : w.y * cell,
                  width: full ? geometry.width : w.w * cell,
                  height: full ? geometry.height : w.h * cell,
                  zIndex: full ? 99999 : (w.data.zIndex ?? 10),
                  padding: w.data.padding || undefined,
                  margin: w.data.margin || undefined,
                  ...getWidgetTransformStyle(w.data),
                }}
              >
                {full && w.data.backgroundImage && (
                  <div className="absolute inset-0 bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url(${w.data.backgroundImage})` }} />
                )}
                {renderThumbWidget(w, animate, cell)}
              </div>
            );
          })}
        </Suspense>
      </div>
      {seams && (
        <>
          {seams.x.map(c => <span key={`x${c}`} className="hub-scene-preview__seam hub-scene-preview__seam--v" style={{ left: c * cell * scale }} />)}
          {seams.y.map(r => <span key={`y${r}`} className="hub-scene-preview__seam hub-scene-preview__seam--h" style={{ top: r * cell * scale }} />)}
        </>
      )}
    </div>
  );
};

export const ScenePreview = React.memo(ScenePreviewBase);
