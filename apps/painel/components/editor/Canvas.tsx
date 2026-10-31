import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import GridLayout from 'react-grid-layout';
import { 
  Film, ImageIcon, Gift, CalendarDays, Loader2, Globe
} from 'lucide-react';
import { 
  LiveClock, WeatherWidget, RssFeed, FullInfoWidget, NotesWidget, 
  TodoWidget, CountdownWidget, ChoresWidget, MealPlanWidget, 
  MarketWatchWidget, BrowserSnapshotWidget, GoogleDocsWidget, OfficeDocsWidget, 
  PowerBIWidget, EmbedHtmlWidget, AirtableWidget, PdfDocumentWidget
} from '../widgets';
import { getAlignmentClasses } from '../Player';
import { Display, Page, WidgetType, LayoutItem } from '../../types';

import { getCanvasGeometry, fitCanvasScale, boundCanvasItem, getWallSeams, crossesWallSeam, isWall } from './canvasGeometry';
import './CanvasStage.css';
import { getTextStyle, getImageFilter, getImageFrameStyle, getWidgetTransformStyle } from './widgetStyles';
import { clampZoom } from './ZoomControl';
import { renderDesignWidget } from './designWidgets';

interface CanvasProps {
  /** null = Ajustado. Número = escala real (1 = 100%). */
  zoom?: number | null;
  onFitScaleChange?: (scale: number) => void;
  showWallGuides?: boolean;
  /** Opcional: liga Ctrl/Cmd + roda do mouse para mudar o zoom. */
  onZoomChange?: (zoom: number | null) => void;
  display: Display;
  activePage: Page;
  activePageIdx: number;
  setDisplay: React.Dispatch<React.SetStateAction<Display | null>>;
  selectedWidget: string | null;
  setSelectedWidget: React.Dispatch<React.SetStateAction<string | null>>;
  containerWidth: number;
  rowHeight: number;
  containerRef: React.RefObject<HTMLDivElement>;
  handleLayoutChange: (layout: any[]) => void;
  removeWidget: (wId: string) => void;
  quickToolbar?: React.ReactNode;
}

const isYouTubeUrl = (url: string) => {
  if (!url) return false;
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
  return regExp.test(url);
};

const getEmbedUrl = (url: string, config?: { autoplay?: boolean, mute?: boolean, loop?: boolean, controls?: boolean, youtubeQuality?: string }) => {
  if (!url) return '';
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[1].length === 11) {
    const videoId = match[1];
    const autoplay = config?.autoplay !== false ? 1 : 0;
    const mute = config?.mute !== false ? 1 : 0;
    const loop = config?.loop !== false ? 1 : 0;
    const controls = config?.controls === true ? 1 : 0;
    const quality = config?.youtubeQuality || 'highres';
    
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay}&mute=${mute}&loop=${loop}&playlist=${videoId}&controls=${controls}&disablekb=1&fs=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&showinfo=0&iv_load_policy=3&vq=${quality}`;
  }
  return url;
};

const handleYouTubeIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>, quality: string = 'highres') => {
  const iframe = e.currentTarget;
  iframe.contentWindow?.postMessage(JSON.stringify({
    event: 'command',
    func: 'setPlaybackQuality',
    args: [quality]
  }), '*');
  
  if (quality === 'highres' || quality === 'hd1080') {
    iframe.contentWindow?.postMessage(JSON.stringify({
      event: 'command',
      func: 'setPlaybackQualityRange',
      args: ['hd1080', 'highres']
    }), '*');
  } else {
    iframe.contentWindow?.postMessage(JSON.stringify({
      event: 'command',
      func: 'setPlaybackQualityRange',
      args: [quality, quality]
    }), '*');
  }
  
  iframe.contentWindow?.postMessage(JSON.stringify({
    event: 'command',
    func: 'playVideo',
    args: []
  }), '*');
};

const getBackgroundAnimationClass = (anim?: string) => {
  switch (anim) {
    case 'auto-weather': return 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-dashed border-cyan-500/30';
    case 'gradient-flow': return 'bg-anim-gradient-flow';
    case 'clouds': return 'bg-anim-clouds';
    case 'rain': return 'bg-anim-rain';
    case 'snow': return 'bg-anim-snow';
    case 'fire': return 'bg-anim-fire';
    case 'tech-grid': return 'bg-anim-tech-grid';
    case 'pulse-red': return 'bg-anim-pulse-red';
    case 'pulse-blue': return 'bg-anim-pulse-blue';
    case 'pulse-green': return 'bg-anim-pulse-green';
    case 'aurora': return 'bg-anim-aurora';
    default: return '';
  }
};

/**
 * Conteúdo que não pode ser cortado pela moldura entre duas TVs do videowall:
 * texto, QR code e telefone/contato. Os tipos de QR e contato ainda não existem
 * no enum; o teste por nome já cobre quando forem criados.
 */
const isSeamSensitive = (w: LayoutItem) => w.type === WidgetType.TEXT || /QR|PHONE|CONTACT|WHATS/i.test(String(w.type));

const renderWidgetPreview = (w: LayoutItem) => {
  switch (w.type) {
    case WidgetType.ICON:
    case WidgetType.SHAPE:
    case WidgetType.MOTION:
      return renderDesignWidget(w, 'editor');
    case WidgetType.TEXT:
      return (
                    <div 
                      className="w-full h-full flex"
                      style={{ 
                        alignItems: (w.data.fillContainer || w.data.contentAlignment === 'stretch') ? 'stretch' : w.data.contentAlignment === 'start' ? 'flex-start' : w.data.contentAlignment === 'end' ? 'flex-end' : 'center',
                        justifyContent: (w.data.fillContainer || w.data.contentAlignment === 'stretch') ? 'stretch' : w.data.textConfig?.textAlign === 'left' ? 'flex-start' : w.data.textConfig?.textAlign === 'right' ? 'flex-end' : w.data.textConfig?.textAlign === 'center' ? 'center' : w.data.contentAlignment === 'start' ? 'flex-start' : w.data.contentAlignment === 'end' ? 'flex-end' : 'center',
                        textAlign: w.data.textConfig?.textAlign || 'center',
                        padding: w.data.padding !== undefined ? w.data.padding : '2rem',
                      }}
                    >
                      <p 
                        className="leading-tight drop-shadow-2xl"
                        style={{
                          ...getTextStyle(w.data),
                          animation: w.data.textConfig?.animation === 'fade' ? 'fade-in 1.5s ease-out' :
                                     w.data.textConfig?.animation === 'slide' ? 'slide-up 1s ease-out' :
                                     w.data.textConfig?.animation === 'pulse' ? 'pulse 3s infinite ease-in-out' :
                                     w.data.textConfig?.animation === 'bounce' ? 'bounce 2s infinite' :
                                     w.data.textConfig?.animation === 'typewriter' ? 'typewriter 2s steps(40, end)' : 'none',
                          whiteSpace: w.data.textConfig?.animation === 'typewriter' ? 'nowrap' : 'pre-line',
                          overflow: w.data.textConfig?.animation === 'typewriter' ? 'hidden' : 'visible',
                          borderRight: w.data.textConfig?.animation === 'typewriter' ? '2px solid rgba(255,255,255,0.75)' : 'none',
                          maxWidth: '100%'
                        }}
                      >
                        {w.data.content}
                      </p>
                    </div>
      );
    case WidgetType.IMAGE:
      return w.data.url ? (
        <div className={`w-full h-full flex ${getAlignmentClasses(w.data.fillContainer ? 'stretch' : w.data.contentAlignment)} overflow-hidden`}>
          <img 
            src={w.data.url} 
            className="pointer-events-none select-none w-full h-full" 
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: (w.data.fillContainer || w.data.fitContainerMode === 'stretch') ? 'fill' : (w.data.fitContainerMode || 'cover'), filter: getImageFilter(w.data), ...getImageFrameStyle(w.data),
            }} 
            alt="Preview" 
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <ImageIcon className="text-slate-700 mb-2" size={32} />
          <span className="text-[10px] text-slate-600 font-bold uppercase">Imagem</span>
        </div>
      );
    case WidgetType.GIF:
      return w.data.url ? (
        <div className={`w-full h-full relative bg-black/20 flex ${getAlignmentClasses(w.data.fillContainer ? 'stretch' : w.data.contentAlignment)}`}>
           <img 
             src={w.data.url} 
             className="pointer-events-none select-none w-full h-full"
             style={{
               width: '100%',
               height: '100%',
               objectFit: (w.data.fillContainer || w.data.fitContainerMode === 'stretch') ? 'fill' : (w.data.fitContainerMode || 'cover'), filter: getImageFilter(w.data), ...getImageFrameStyle(w.data),
             }}
             alt="GIF Preview"
           />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <Gift className="text-slate-700 mb-2" size={32} />
          <span className="text-[10px] text-slate-600 font-bold uppercase">GIF</span>
        </div>
      );
    case WidgetType.CLOCK:
      return <div className="w-full h-full flex flex-col items-center justify-center text-white drop-shadow-xl"><LiveClock city={w.data.city} model={w.data.model} fontSize={w.data.fontSize?.replace('vw', '')} /></div>;
    case WidgetType.WEATHER:
      return <div className="w-full h-full overflow-hidden"><WeatherWidget city={w.data.city || 'São Paulo'} model={w.data.model} backgroundAnimation={w.data.backgroundAnimation} windowsView={(w.data as LayoutItem['data'] & { windowsView?: string }).windowsView} /></div>;
    case WidgetType.FULL_INFO:
      return <div className="w-full h-full overflow-hidden"><FullInfoWidget city={w.data.city || ''} backgroundImage={w.data.backgroundImage} backgroundAnimation={w.data.backgroundAnimation} model={w.data.model} textSize={w.data.textSize} numberSize={w.data.numberSize} transparentBackground={w.data.transparentBackground} backgroundColor={w.data.backgroundColor} /></div>;
    case WidgetType.VIDEO:
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 pointer-events-none relative overflow-hidden">
            {w.data.videoUrl ? (
              isYouTubeUrl(w.data.videoUrl) ? (
                <iframe
                  src={getEmbedUrl(w.data.videoUrl, w.data.videoConfig)}
                  className="w-full h-full pointer-events-none"
                  style={{
                    border: 'none'
                  }}
                  allow="autoplay; encrypted-media"
                  title="YouTube Video Preview"
                />
              ) : (
                <video 
                  src={w.data.videoUrl} 
                  className="w-full h-full" 
                  style={{
                    objectFit: (w.data.fillContainer || w.data.fitContainerMode === 'stretch') ? 'fill' : (w.data.fitContainerMode || 'cover')
                  }}
                  autoPlay={w.data.videoConfig?.autoplay !== false}
                  muted={w.data.videoConfig?.mute !== false}
                  loop={w.data.videoConfig?.loop !== false}
                  controls={w.data.videoConfig?.controls === true}
                />
              )
            ) : (
              <>
                <Film className="text-slate-700 mb-2" size={32} />
                <span className="text-[10px] uppercase text-slate-600 font-bold">Vídeo Player</span>
              </>
            )}
            <div className="absolute inset-0 z-10 bg-transparent"></div>
         </div>
      );
    case WidgetType.IFRAME:
      return w.data.url ? (
                    <div className="w-full h-full relative bg-white overflow-hidden">
                      <iframe 
                        src={w.data.url} 
                        className="border-none" 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: w.data.iframeConfig?.viewportWidth ? `${w.data.iframeConfig.viewportWidth}px` : '100%',
                          height: w.data.iframeConfig?.viewportHeight ? `${w.data.iframeConfig.viewportHeight}px` : '100%',
                          transform: `scale(${w.data.iframeConfig?.scale || 1}) translate(${w.data.iframeConfig?.offsetX || 0}px, ${w.data.iframeConfig?.offsetY || 0}px)`,
                          transformOrigin: 'top left',
                          pointerEvents: w.data.iframeConfig?.interactive ? 'auto' : 'none'
                        }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
                        referrerPolicy="no-referrer"
                        title="Web Widget"
                      />
                    </div>
      ) : <div className="w-full h-full flex items-center justify-center"><Globe size={40} /></div>;
    case WidgetType.RSS:
      return (
        <div className="w-full h-full overflow-hidden pointer-events-none">
          <RssFeed url={w.data.rssUrl || w.data.rssFeeds?.[0]?.url || w.data.url || ''} config={w.data.rssConfig} widgetData={w.data} />
        </div>
      );
    case WidgetType.NOTES:
      return <div className="w-full h-full overflow-hidden"><NotesWidget data={w.data} /></div>;
    case WidgetType.TODO:
      return <div className="w-full h-full overflow-hidden"><TodoWidget data={w.data} /></div>;
    case WidgetType.COUNTDOWN:
      return <div className="w-full h-full overflow-hidden"><CountdownWidget data={w.data} /></div>;
    case WidgetType.CHORES:
      return <div className="w-full h-full overflow-hidden"><ChoresWidget data={w.data} /></div>;
    case WidgetType.MEAL_PLAN:
      return <div className="w-full h-full overflow-hidden"><MealPlanWidget data={w.data} /></div>;
    case WidgetType.MARKET_WATCH:
      return <div className="w-full h-full overflow-hidden"><MarketWatchWidget data={w.data} /></div>;
    case WidgetType.BROWSER_SNAPSHOT:
      return <div className="w-full h-full overflow-hidden"><BrowserSnapshotWidget data={w.data} /></div>;
    case WidgetType.GOOGLE_DOCS:
      return <div className="w-full h-full overflow-hidden"><GoogleDocsWidget data={w.data} /></div>;
    case WidgetType.OFFICE_DOCS:
      return <div className="w-full h-full overflow-hidden"><OfficeDocsWidget data={w.data} /></div>;
    case WidgetType.POWER_BI:
      return <div className="w-full h-full overflow-hidden"><PowerBIWidget data={w.data} /></div>;
    case WidgetType.EMBED_HTML:
      return <div className="w-full h-full overflow-hidden"><EmbedHtmlWidget data={w.data} /></div>;
    case WidgetType.AIRTABLE:
      return <div className="w-full h-full overflow-hidden"><AirtableWidget data={w.data} /></div>;
    case WidgetType.PDF_DOCUMENT:
      return <div className="w-full h-full overflow-hidden"><PdfDocumentWidget data={w.data} /></div>;
    case WidgetType.CALENDAR:
      return w.data.calendarId ? (
                    <div 
                      className={`w-full h-full relative overflow-hidden p-3 rounded-xl flex flex-col ${w.data.calendarConfig?.theme === 'neon' ? 'font-mono' : ''}`}
                      style={{ 
                        backgroundColor: w.data.calendarConfig?.transparent ? 'transparent' : (w.data.calendarConfig?.backgroundColor || (w.data.calendarConfig?.theme === 'dark' || w.data.calendarConfig?.theme === 'neon' ? '#0f172a' : '#ffffff')),
                        backdropFilter: w.data.calendarConfig?.transparent ? 'none' : (w.data.calendarConfig?.theme === 'glass' ? 'blur(20px) saturate(180%)' : 'blur(12px)'),
                        border: w.data.calendarConfig?.transparent ? 'none' : (
                          w.data.calendarConfig?.theme === 'neon' ? '1px solid #06b6d4' : 
                          w.data.calendarConfig?.theme === 'glass' ? '1px solid rgba(255,255,255,0.2)' : 
                          w.data.calendarConfig?.theme === 'minimal' ? 'none' :
                          '1px solid rgba(255,255,255,0.1)'
                        ),
                        boxShadow: w.data.calendarConfig?.theme === 'neon' ? '0 0 20px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.1)' : 
                                   w.data.calendarConfig?.theme === 'card' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 
                                   w.data.calendarConfig?.theme === 'glass' ? '0 8px 32px 0 rgba(31, 38, 135, 0.37)' : 'none'
                      }}
                    >
                      {(w.data.calendarConfig?.showTitle ?? !!w.data.calendarConfig?.customTitle) && w.data.calendarConfig?.customTitle && (
                        <div 
                          className="mb-2 font-bold text-center z-20 shrink-0 flex items-center justify-center w-full"
                          style={{
                            color: w.data.calendarConfig.titleColor || (
                              w.data.calendarConfig.theme === 'dark' || 
                              w.data.calendarConfig.theme === 'neon' || 
                              w.data.calendarConfig.theme === 'glass' ? '#ffffff' : '#1e293b'
                            ),
                            fontSize: w.data.calendarConfig.titleSize || '1.5rem',
                            textShadow: w.data.calendarConfig.theme === 'neon' ? '0 0 10px rgba(6, 182, 212, 0.8)' : 
                                        w.data.calendarConfig.theme === 'glass' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
                            letterSpacing: w.data.calendarConfig.theme === 'neon' ? '0.1em' : 'normal',
                            textTransform: w.data.calendarConfig.theme === 'neon' ? 'uppercase' : 'none'
                          }}
                        >
                          {w.data.calendarConfig.customTitle}
                        </div>
                      )}
                      
                      <div className="flex-1 w-full h-full relative rounded-lg overflow-hidden z-10">
                        <iframe 
                          src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(w.data.calendarId)}&showTitle=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0&bgcolor=${encodeURIComponent(
                            w.data.calendarConfig?.transparent ? '#ffffff' : (w.data.calendarConfig?.backgroundColor || '#ffffff')
                          )}`} 
                          className="w-full h-full border-none absolute inset-0" 
                          style={{
                            filter: (w.data.calendarConfig?.theme === 'dark' || w.data.calendarConfig?.theme === 'neon') ? 'invert(1) hue-rotate(180deg) contrast(0.9) saturate(0.8)' : 'none',
                          }}
                          scrolling="no"
                          title="Google Calendar"
                        />
                       </div>
                     </div>
      ) : <div className="w-full h-full flex items-center justify-center"><CalendarDays size={40} /></div>;
    default:
      return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-600 uppercase font-bold">{w.type}</div>;
  }
};

export const Canvas: React.FC<CanvasProps> = ({
  display,
  activePage,
  activePageIdx,
  setDisplay,
  selectedWidget,
  setSelectedWidget,
  containerRef,
  handleLayoutChange,
  quickToolbar,
  zoom = null,
  onFitScaleChange,
  showWallGuides = false,
  onZoomChange,
}) => {
  const geometry = getCanvasGeometry(display.orientation, display.wall);
  const wall = isWall(display.wall);
  const seams = wall ? getWallSeams(geometry) : { x: [], y: [] };
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0);
  const zoomed = typeof zoom === 'number' && Number.isFinite(zoom) && zoom > 0;
  // Ajustado: a escala que cabe na área. Com zoom: escala real (1 = 100%).
  const scale = zoomed ? clampZoom(zoom as number) : fitScale;

  // Observe the available workspace, never widget bounds or the selected item.
  // Only the visual scale changes; all authoring coordinates remain TV pixels.
  // A medida usa a caixa externa da área, então a barra de rolagem do zoom
  // não altera a escala de ajuste.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const updateScale = () => {
      const rect = viewport.getBoundingClientRect();
      setFitScale(fitCanvasScale(rect.width, rect.height, geometry));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [geometry.width, geometry.height]);

  const fitCallbackRef = useRef(onFitScaleChange);
  fitCallbackRef.current = onFitScaleChange;
  useEffect(() => {
    if (fitScale > 0) fitCallbackRef.current?.(fitScale);
  }, [fitScale]);

  // Ao mudar o zoom, mantém no lugar o ponto da cena que estava no centro da
  // área (ou sob o mouse, no Ctrl + roda), como no Canva.
  const anchorRef = useRef<{ x: number; y: number } | null>(null);
  const viewRef = useRef({ scale: 0, left: 0, top: 0, scrollLeft: 0, scrollTop: 0 });
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    if (!viewport || !frame) return;
    const left = frame.offsetLeft + frame.clientLeft;
    const top = frame.offsetTop + frame.clientTop;
    const previous = viewRef.current;
    if (!zoomed) {
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    } else if (previous.scale > 0 && previous.scale !== scale) {
      const anchor = anchorRef.current ?? { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 };
      const sceneX = (previous.scrollLeft + anchor.x - previous.left) / previous.scale;
      const sceneY = (previous.scrollTop + anchor.y - previous.top) / previous.scale;
      viewport.scrollLeft = left + sceneX * scale - anchor.x;
      viewport.scrollTop = top + sceneY * scale - anchor.y;
    }
    anchorRef.current = null;
    viewRef.current = { scale, left, top, scrollLeft: viewport.scrollLeft, scrollTop: viewport.scrollTop };
  }, [scale, zoomed]);

  // Ctrl/Cmd + roda (e o gesto de pinça do touchpad, que chega como Ctrl + roda).
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const zoomChangeRef = useRef(onZoomChange);
  zoomChangeRef.current = onZoomChange;
  const wheelEnabled = !!onZoomChange;
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !wheelEnabled) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const change = zoomChangeRef.current;
      if (!change || scaleRef.current <= 0) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      anchorRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const next = clampZoom(Math.round(scaleRef.current * Math.exp(-event.deltaY * 0.002) * 100) / 100);
      if (next !== scaleRef.current) change(next);
      else anchorRef.current = null;
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [wheelEnabled]);

  const emptyScene = activePage.layout.length === 0 && !activePage.backgroundImage && !activePage.backgroundVideoUrl && (!activePage.backgroundAnimation || activePage.backgroundAnimation === 'none');
  const exampleImage = `${import.meta.env.BASE_URL}exemplos/${display.orientation === 'vertical' ? 'arte-moda' : 'arte-cafe'}.jpg`;
  const useExample = () => setDisplay(previous => previous ? {
    ...previous,
    pages: previous.pages.map((page, index) => index === activePageIdx ? { ...page, backgroundImage: exampleImage } : page),
  } : previous);

  // RGL also emits layout changes while mounting/measuring. Commit only the
  // item the person actually moved or resized, preserving all other scene data.
  const finishManipulation = (_layout: any[], _oldItem: any, item: any) => {
    if (!item) return;
    const original = activePage.layout.find(widget => widget.i === item.i);
    if (!original || original.data.fullScreenMode || original.data.locked) return;
    const bounded = boundCanvasItem(item, geometry);
    if (['x', 'y', 'w', 'h'].some(key => bounded[key] !== original[key])) {
      handleLayoutChange([bounded]);
    }
  };

  return (
    <main className="hub-canvas hub-canvas-stage flex-1" aria-label="Área de edição da TV">
      <div className="hub-canvas-stage__backdrop" aria-hidden="true" />
      <div className="hub-canvas-stage__tools">{quickToolbar}</div>
      <div
        ref={viewportRef}
        className={`hub-canvas-stage__viewport ${zoomed ? 'is-zoomed' : ''}`}
        onScroll={event => {
          viewRef.current.scrollLeft = event.currentTarget.scrollLeft;
          viewRef.current.scrollTop = event.currentTarget.scrollTop;
        }}
        onClick={event => {
          if (event.target === event.currentTarget) setSelectedWidget(null);
        }}
      >
        <div className="hub-canvas-stage__scroller" onClick={event => {
          if (event.target === event.currentTarget) setSelectedWidget(null);
        }}>
        <div
          ref={frameRef}
          className="hub-canvas-frame hub-tv-frame"
          style={{ width: geometry.width * scale, height: geometry.height * scale, visibility: scale > 0 ? 'visible' : 'hidden' }}
        >
          <div className="hub-tv-screen">
            <div
              ref={containerRef}
              className="hub-canvas-native bg-black"
              data-canvas-width={geometry.width}
              data-canvas-height={geometry.height}
              data-canvas-scale={scale}
              style={{
                width: geometry.width,
                height: geometry.height,
                transform: `scale(${scale || 1})`,
                containerType: 'size',
                '--canvas-outline-width': `${2 / (scale || 1)}px`,
                '--canvas-handle-size': `${18 / (scale || 1)}px`,
                '--canvas-inv-scale': 1 / (scale || 1),
              } as React.CSSProperties}
              onClick={() => setSelectedWidget(null)}
            >
              {activePage.backgroundVideoUrl && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black">
                  {isYouTubeUrl(activePage.backgroundVideoUrl) ? (
                    <iframe
                      src={getEmbedUrl(activePage.backgroundVideoUrl, { autoplay: true, mute: activePage.backgroundVideoMuted !== false, loop: true, controls: false, youtubeQuality: activePage.backgroundVideoQuality })}
                      className="absolute border-none pointer-events-none"
                      style={{
                        width: Math.max(geometry.width, geometry.height * 16 / 9),
                        height: Math.max(geometry.height, geometry.width * 9 / 16),
                        top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.002)',
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      onLoad={event => handleYouTubeIframeLoad(event, activePage.backgroundVideoQuality)}
                      title="Vídeo de fundo da cena"
                    />
                  ) : (
                    <video src={activePage.backgroundVideoUrl} className="w-full h-full object-cover pointer-events-none" autoPlay muted={activePage.backgroundVideoMuted !== false} loop playsInline />
                  )}
                </div>
              )}
              {activePage.backgroundImage && !activePage.backgroundVideoUrl && (
                <div className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat pointer-events-none" style={{ backgroundImage: `url(${activePage.backgroundImage})` }} />
              )}
              {activePage.backgroundAnimation && !activePage.backgroundImage && !activePage.backgroundVideoUrl && (
                <div className={`absolute inset-0 z-0 ${getBackgroundAnimationClass(activePage.backgroundAnimation)}`} />
              )}
              <GridLayout
                className="hub-canvas-grid"
                style={{ height: geometry.height }}
                layout={activePage.layout.map(widget => widget.data.fullScreenMode
                  ? { i: widget.i, x: 0, y: 0, w: geometry.cols, h: geometry.rows, isDraggable: false, isResizable: false }
                  : widget.data.locked
                    ? { i: widget.i, x: widget.x, y: widget.y, w: widget.w, h: widget.h, isDraggable: false, isResizable: false }
                    : { i: widget.i, x: widget.x, y: widget.y, w: widget.w, h: widget.h })}
                cols={geometry.cols}
                maxRows={geometry.rows}
                rowHeight={geometry.cellSize}
                width={geometry.width}
                margin={[0, 0]}
                containerPadding={[0, 0]}
                autoSize={false}
                isBounded={true}
                isResizable={true}
                isDraggable={true}
                compactType={null}
                preventCollision={false}
                allowOverlap={true}
                draggableCancel="button, input, textarea, select"
                resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
                onDragStart={(_layout, _oldItem, item) => setSelectedWidget(item.i)}
                onResizeStart={(_layout, _oldItem, item) => setSelectedWidget(item.i)}
                onDragStop={finishManipulation}
                onResizeStop={finishManipulation}
                transformScale={scale || 1}
              >
                {activePage.layout.map(widget => {
                  const widgetZIndex = widget.data.fullScreenMode ? 99999 : (widget.data.zIndex ?? 10);
                  const onSeam = wall && !widget.data.fullScreenMode && isSeamSensitive(widget) && crossesWallSeam(widget, geometry);
                  return (
                    <div
                      key={widget.i}
                      data-widget-id={widget.i}
                      onClick={event => { event.stopPropagation(); setSelectedWidget(widget.i); }}
                      className={`hub-canvas-widget group ${selectedWidget === widget.i ? 'is-selected' : ''} ${widget.data.locked ? 'is-locked' : ''} ${onSeam ? 'is-on-seam' : ''} ${widget.data.backgroundAnimation ? getBackgroundAnimationClass(widget.data.backgroundAnimation) : ''}`}
                      style={{ zIndex: widgetZIndex }}
                    >
                      <div className={`w-full h-full relative overflow-hidden flex ${getAlignmentClasses(widget.data.fillContainer ? 'stretch' : widget.data.contentAlignment)}`} style={{ padding: widget.data.padding || undefined, margin: widget.data.margin || undefined, ...getWidgetTransformStyle(widget.data) }}>
                        {widget.data.fullScreenMode && widget.data.backgroundImage && (
                          <div className="absolute inset-0 z-0 bg-center bg-cover bg-no-repeat pointer-events-none" style={{ backgroundImage: `url(${widget.data.backgroundImage})` }} />
                        )}
                        <Suspense fallback={<div className="flex items-center justify-center w-full h-full bg-black/20"><Loader2 className="animate-spin text-white" size={32} /></div>}>
                          {renderWidgetPreview(widget)}
                        </Suspense>
                        <div className="hub-canvas-widget__drag-surface" aria-hidden="true" />
                      </div>
                      {onSeam && <span className="hub-canvas-seam-badge" role="note">Fica na divisão entre TVs</span>}
                    </div>
                  );
                })}
              </GridLayout>
              {wall && showWallGuides && (
                <div className="hub-canvas-wall-guides" aria-hidden="true">
                  {seams.x.map(col => <span key={`x${col}`} className="hub-canvas-wall-guides__v" style={{ left: col * geometry.cellSize }} />)}
                  {seams.y.map(row => <span key={`y${row}`} className="hub-canvas-wall-guides__h" style={{ top: row * geometry.cellSize }} />)}
                </div>
              )}
            </div>
            {emptyScene && (
              <div className="hub-canvas-example">
                <img src={exampleImage} alt="Sugestão de arte para começar sua tela." />
                <div className="hub-canvas-example__caption">
                  <span>Exemplo visual · sua cena ainda está vazia</span>
                  <button type="button" onClick={useExample}>Usar imagem de exemplo</button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </main>
  );
};
