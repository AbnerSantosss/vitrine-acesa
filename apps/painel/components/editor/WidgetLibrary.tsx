import type { EditorLeftPanel, LayoutItem as LibraryLayoutItem, WidgetData as LibraryWidgetData } from '../../types';
import type { SceneTemplate } from './presets/sceneTemplates';
import type { AiPresetResult } from '../../services/ai';
import React, { useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Layers, Trash2, ImageIcon, Film, Type, Sparkles, Globe, Clock, CloudSun,
  LayoutDashboard, Rss, CalendarDays, StickyNote, ListTodo, Timer, ClipboardList,
  Utensils, TrendingUp, Aperture, FileText, BookOpen, BarChart3, Database, Code2,
  Upload, MonitorPlay, Move, Info, Lock, LayoutTemplate, LayoutGrid, Shapes, Smile, Clapperboard, Wand2, SlidersHorizontal, X,
} from 'lucide-react';
import { Display, Page, WidgetType, type LayoutItem } from '../../types';
import { WidgetCatalog } from './WidgetCatalog';
import { DOC_FEATURE_KEY, isWidgetLocked, widgetFeatureKey } from '../../services/billing';
import { TemplatesPanel } from './panels/TemplatesPanel';
import { TextPanel } from './panels/TextPanel';
import { TextEffectsPanel } from './panels/TextEffectsPanel';
import { IconsPanel } from './panels/IconsPanel';
import { ShapesPanel } from './panels/ShapesPanel';
import { MotionPanel } from './panels/MotionPanel';
import { EffectsPanel } from './panels/EffectsPanel';
import { ImageFiltersPanel } from './panels/ImageFiltersPanel';
import { AiPanel } from './panels/AiPanel';
import { PanelHeader, SearchBox, STORAGE_RECENTS, norm, useStoredList } from './panels/panelKit';
import './panels/panels.css';

interface WidgetLibraryProps {
  panel?: EditorLeftPanel;
  onPanelChange?: (panel: EditorLeftPanel) => void;
  layersSlot?: React.ReactNode;
  currentWidget?: LibraryLayoutItem | null;
  updateWidgetData?: (id: string, data: Partial<LibraryWidgetData>) => void;
  onApplyTemplate?: (template: SceneTemplate) => void;
  /** Painel de IA: insere imagem gerada e aplica cena gerada. */
  onInsertImage?: (url: string) => void;
  onApplyAiPreset?: (result: AiPresetResult) => void;
  display: Display;
  activePage: Page;
  activePageIdx: number;
  setDisplay: React.Dispatch<React.SetStateAction<Display | null>>;
  selectedWidget: string | null;
  setSelectedWidget: React.Dispatch<React.SetStateAction<string | null>>;
  addWidget: (type: WidgetType, data?: Partial<LayoutItem['data']>) => void;
  setIsClearingScene: React.Dispatch<React.SetStateAction<boolean>>;
  setMediaLibraryConfig: React.Dispatch<React.SetStateAction<any>>;
  setShowBgAnimModal: React.Dispatch<React.SetStateAction<boolean>>;
  showLeftSidebar: boolean;
  setShowLeftSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Features do plano da assinatura atual. `undefined` enquanto carrega — e
   * nesse caso nada é bloqueado, porque o gate real é do servidor e esconder
   * widget por dado ausente tiraria recurso de quem tem direito.
   */
  planFeatures?: string[];
  /** Nome do plano que libera os widgets bloqueados, para o texto do cadeado. */
  requiredPlanName?: string;
}

const widgetArt: Record<string, number> = {"Imagem":0,"Vídeo":1,"Texto":2,"GIF":3,"Web":4,"Relógio":5,"Clima":6,"Completo":7,"RSS":8,"Agenda":9,"Notas":10,"Tarefas":11,"Contador":12,"Deveres":13,"Meal Plan":14,"Bolsa":15,"Snapshot":16,"G Docs":17,"Office Docs":18,"Power BI":19,"Airtable":20,"PDF":21,"HTML":22};

const WidgetTool = ({ icon, label, description, onClick, tooltipAlign = 'center', locked = false, lockedHint }: any) => {
  const alignClass =
    tooltipAlign === 'left' ? 'left-0 items-start' :
    tooltipAlign === 'right' ? 'right-0 items-end' :
    'left-1/2 -translate-x-1/2 items-center';

  const arrowClass =
    tooltipAlign === 'left' ? 'left-8' :
    tooltipAlign === 'right' ? 'right-8' :
    '';

  return (
    <button
      onClick={onClick}
      disabled={locked}
      aria-disabled={locked}
      title={locked ? lockedHint : undefined}
      className={`hub-widget-tool relative flex flex-col items-center justify-center p-1 bg-papel-3 border rounded-lg active:scale-95 transition-all group w-full py-1.5 ${
        locked
          ? 'border-borda opacity-45 cursor-not-allowed'
          : 'border-borda hover:bg-marca-fundo hover:border-marca cursor-pointer'
      }`}
    >
      <div className={`absolute top-1 right-1 transition-opacity ${locked ? 'opacity-70 text-warn' : 'opacity-20 group-hover:opacity-100 text-tinta-3 group-hover:text-marca'}`}>
        {locked ? <Lock size={8} /> : <Info size={8} />}
      </div>

      <div className={`absolute bottom-full mb-2 hidden group-hover:flex flex-col pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-200 ${alignClass}`}>
        <div className="bg-papel-2 border border-borda text-tinta text-[9px] font-bold py-1.5 px-3 rounded-lg shadow-flutuante w-48 text-center leading-relaxed">
          {locked ? lockedHint : description}
        </div>
        <div className={`w-2 h-2 bg-papel-2 border-r border-b border-borda rotate-45 -mt-1 ${arrowClass}`}></div>
      </div>

      <div className={`hub-widget-icon mb-0.5 transition-colors drop-shadow-sm flex items-center justify-center h-8 w-8 ${locked ? 'text-tinta-3 grayscale' : 'text-tinta-2 group-hover:text-marca'}`}>
        {widgetArt[label] !== undefined ? <span aria-hidden="true" className="hub-widget-art" style={{ backgroundPosition: ((widgetArt[label] % 5) * 25) + "% " + ([3.9, 27.83, 50.39, 73.44, 96.68][Math.floor(widgetArt[label] / 5)]) + "%" }} /> : icon}
      </div>
      <span className={`text-[8px] font-bold uppercase tracking-wider transition-colors text-center truncate w-full px-0.5 ${locked ? 'text-tinta-3' : 'text-tinta-3 group-hover:text-tinta'}`}>
        {label}
      </span>
    </button>
  );
};

const isYouTubeUrl = (url: string) => {
  if (!url) return false;
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
  return regExp.test(url);
};

/** Um widget da grade "Elementos". `align` só posiciona a dica ao passar o mouse. */
interface ToolDef {
  type: WidgetType;
  label: string;
  description: string;
  icon: React.ReactNode;
  group: 'Básicos' | 'Utilitários' | 'Interativos' | 'Integrações';
  keywords?: string;
}

const TOOLS: ToolDef[] = [
  { type: WidgetType.IMAGE, label: 'Imagem', description: 'Mostra imagens PNG, JPG ou SVG ajustadas ao espaço do bloco.', icon: <ImageIcon size={20} className="text-marca" />, group: 'Básicos', keywords: 'foto imagem png jpg' },
  { type: WidgetType.VIDEO, label: 'Vídeo', description: 'Toca vídeos enviados, em repetição, ou links do YouTube.', icon: <Film size={20} className="text-danger" />, group: 'Básicos', keywords: 'mp4 youtube' },
  { type: WidgetType.TEXT, label: 'Texto', description: 'Títulos e textos com fonte, cor, tamanho e efeitos.', icon: <Type size={20} className="text-tinta" />, group: 'Básicos', keywords: 'titulo escrever' },
  { type: WidgetType.GIF, label: 'GIF', description: 'Mostra animações em GIF.', icon: <Sparkles size={20} className="text-marca" />, group: 'Básicos' },
  { type: WidgetType.IFRAME, label: 'Web', description: 'Mostra uma página de outro site dentro da tela.', icon: <Globe size={20} className="text-marca" />, group: 'Básicos', keywords: 'site pagina iframe' },
  { type: WidgetType.CLOCK, label: 'Relógio', description: 'Relógio digital com o horário da cidade escolhida.', icon: <Clock size={20} className="text-marca" />, group: 'Utilitários', keywords: 'hora' },
  { type: WidgetType.WEATHER, label: 'Clima', description: 'Previsão do tempo e temperatura atual da cidade escolhida.', icon: <CloudSun size={20} className="text-warn" />, group: 'Utilitários', keywords: 'tempo temperatura' },
  { type: WidgetType.FULL_INFO, label: 'Completo', description: 'Relógio e clima juntos, com imagem de fundo.', icon: <LayoutDashboard size={20} className="text-marca" />, group: 'Utilitários' },
  { type: WidgetType.RSS, label: 'RSS', description: 'Notícias de portais como G1 e CNN, por RSS.', icon: <Rss size={20} className="text-warn" />, group: 'Utilitários', keywords: 'noticias' },
  { type: WidgetType.CALENDAR, label: 'Agenda', description: 'Mostra os eventos de uma agenda do Google.', icon: <CalendarDays size={20} className="text-danger" />, group: 'Utilitários', keywords: 'calendario eventos' },
  { type: WidgetType.NOTES, label: 'Notas', description: 'Recados em formato de nota adesiva, com vários temas de cor.', icon: <StickyNote size={20} className="text-warn" />, group: 'Interativos', keywords: 'recado' },
  { type: WidgetType.TODO, label: 'Tarefas', description: 'Lista de tarefas com itens marcados e o total concluído.', icon: <ListTodo size={20} className="text-ok" />, group: 'Interativos', keywords: 'lista' },
  { type: WidgetType.COUNTDOWN, label: 'Contador', description: 'Contagem regressiva para um evento, meta ou data.', icon: <Timer size={20} className="text-danger" />, group: 'Interativos', keywords: 'contagem regressiva' },
  { type: WidgetType.CHORES, label: 'Deveres', description: 'Quadro semanal de tarefas com o responsável por cada uma.', icon: <ClipboardList size={20} className="text-marca" />, group: 'Interativos' },
  { type: WidgetType.MEAL_PLAN, label: 'Meal Plan', description: 'Cardápio da semana, passando dia a dia.', icon: <Utensils size={20} className="text-warn" />, group: 'Interativos', keywords: 'cardapio refeicao' },
  { type: WidgetType.MARKET_WATCH, label: 'Bolsa', description: 'Cotações de ações e criptomoedas.', icon: <TrendingUp size={20} className="text-ok" />, group: 'Integrações', keywords: 'acoes cripto' },
  { type: WidgetType.BROWSER_SNAPSHOT, label: 'Snapshot', description: 'Mostra uma foto da página, atualizada de tempos em tempos.', icon: <Aperture size={20} className="text-marca" />, group: 'Integrações' },
  { type: WidgetType.GOOGLE_DOCS, label: 'G Docs', description: 'Incorpora documentos, planilhas ou slides do Google Workspace.', icon: <FileText size={20} className="text-marca" />, group: 'Integrações', keywords: 'google documento planilha' },
  { type: WidgetType.OFFICE_DOCS, label: 'Office Docs', description: 'Exibe planilhas Excel, documentos Word ou slides PowerPoint do Office 365.', icon: <BookOpen size={20} className="text-marca" />, group: 'Integrações', keywords: 'excel word powerpoint' },
  { type: WidgetType.POWER_BI, label: 'Power BI', description: 'Mostra painéis e relatórios do Microsoft Power BI.', icon: <BarChart3 size={20} className="text-warn" />, group: 'Integrações', keywords: 'dashboard relatorio' },
  { type: WidgetType.AIRTABLE, label: 'Airtable', description: 'Mostra visualizações, tabelas ou bases do Airtable.', icon: <Database size={20} className="text-danger" />, group: 'Integrações' },
  { type: WidgetType.PDF_DOCUMENT, label: 'PDF', description: 'Mostra um PDF, uma página por vez.', icon: <FileText size={20} className="text-danger" />, group: 'Integrações', keywords: 'documento' },
  { type: WidgetType.EMBED_HTML, label: 'HTML', description: 'Coloque seu próprio código HTML, CSS ou JS.', icon: <Code2 size={20} className="text-marca" />, group: 'Integrações', keywords: 'codigo embed' },
];

const GROUP_STYLE: Record<ToolDef['group'], { text: string; dot: string }> = {
  'Básicos': { text: 'text-ok', dot: 'bg-ok' },
  'Utilitários': { text: 'text-marca', dot: 'bg-marca' },
  'Interativos': { text: 'text-warn', dot: 'bg-warn' },
  'Integrações': { text: 'text-danger', dot: 'bg-danger' },
};

/** Trilho vertical: cada item abre um painel. O painel contextual (efeitos, filtros) não aparece aqui. */
const RAIL: { id: 'templates' | 'widgets' | 'text' | 'icons' | 'shapes' | 'motion' | 'uploads' | 'ai' | 'layers'; label: string; icon: React.ReactNode }[] = [
  { id: 'templates', label: 'Modelos', icon: <LayoutTemplate size={20} /> },
  { id: 'widgets', label: 'Elementos', icon: <LayoutGrid size={20} /> },
  { id: 'text', label: 'Texto', icon: <Type size={20} /> },
  { id: 'icons', label: 'Ícones', icon: <Smile size={20} /> },
  { id: 'shapes', label: 'Formas', icon: <Shapes size={20} /> },
  { id: 'motion', label: 'Motion', icon: <Clapperboard size={20} /> },
  { id: 'uploads', label: 'Uploads', icon: <Upload size={20} /> },
  { id: 'ai', label: 'IA', icon: <Wand2 size={20} /> },
  { id: 'layers', label: 'Camadas', icon: <Layers size={20} /> },
];

/** Qual item do trilho fica marcado em cada painel (inclui os contextuais). */
const RAIL_OF: Record<EditorLeftPanel, string> = {
  widgets: 'widgets', templates: 'templates', text: 'text', 'text-effects': 'text', effects: 'widgets', 'image-filters': 'uploads',
  icons: 'icons', shapes: 'shapes', motion: 'motion', ai: 'ai', 'ai-edit': 'ai', layers: 'layers',
};

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  panel,
  onPanelChange,
  layersSlot,
  currentWidget,
  updateWidgetData,
  onApplyTemplate,
  onInsertImage,
  onApplyAiPreset,
  display,
  activePage,
  activePageIdx,
  setDisplay,
  selectedWidget,
  setSelectedWidget,
  addWidget,
  setIsClearingScene,
  setMediaLibraryConfig,
  setShowBgAnimModal,
  showLeftSidebar,
  setShowLeftSidebar,
  planFeatures,
  requiredPlanName = 'Rede',
}) => {
  const reduceMotion = useReducedMotion();
  const [category, setCategory] = useState<WidgetType | null>(null);
  const [internalPanel, setInternalPanel] = useState<EditorLeftPanel>('widgets');
  const [toolQuery, setToolQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recents = useStoredList(STORAGE_RECENTS + '.widgets', 4);
  const current: EditorLeftPanel = panel ?? internalPanel;
  const orientation: 'horizontal' | 'vertical' = display.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const locked = (type: WidgetType): boolean => isWidgetLocked(type, planFeatures);

  const go = (next: EditorLeftPanel) => {
    setInternalPanel(next);
    onPanelChange?.(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const closeDrawer = () => setShowLeftSidebar(false);

  // Toda alteração da cena cria objetos novos (display e página), senão desfazer e autosave não enxergam a mudança.
  const patchPage = (patch: Partial<Page>) =>
    setDisplay(prev => prev ? { ...prev, pages: prev.pages.map((p, i) => (i === activePageIdx ? { ...p, ...patch } : p)) } : prev);

  const openCategory = (type: WidgetType) => {
    if (locked(type)) return;
    if (type === WidgetType.TEXT) { go('text'); return; }
    recents.push(`widget:${type}`);
    setCategory(type);
    go('widgets');
  };

  const onRail = (id: (typeof RAIL)[number]['id']) => {
    if (id === 'uploads') { setCategory(WidgetType.IMAGE); go('widgets'); return; }
    setCategory(null);
    go(id);
  };

  // O aviso precisa nomear o plano CERTO: documento destrava no Loja (1 tela),
  // painel de gestão só no Rede (piso de 5). Um texto único mandaria para o
  // plano de 5 telas quem resolveria o problema com o de 1.
  const lockedHint = (type: WidgetType): string =>
    widgetFeatureKey(type) === DOC_FEATURE_KEY
      ? 'Disponível a partir do plano Loja. Seu plano atual não inclui documentos (PDF, Google Docs e Office).'
      : `Disponível no plano ${requiredPlanName}. Seu plano atual não inclui os painéis de gestão.`;

  const widget = currentWidget ?? (selectedWidget ? activePage.layout.find(w => w.i === selectedWidget) ?? null : null);
  const railActive = current === 'widgets' && category === WidgetType.IMAGE ? 'uploads' : RAIL_OF[current];

  const visibleTools = useMemo(() => {
    const q = norm(toolQuery.trim());
    return q ? TOOLS.filter(t => norm(`${t.label} ${t.description} ${t.keywords || ''}`).includes(q)) : TOOLS;
  }, [toolQuery]);
  const recentTools = useMemo(
    () => recents.items.map(id => TOOLS.find(t => `widget:${t.type}` === id)).filter((t): t is ToolDef => !!t),
    [recents.items],
  );

  const renderTool = (t: ToolDef, index: number) => (
    <WidgetTool
      key={t.type}
      icon={t.icon}
      label={t.label}
      description={t.description}
      onClick={() => openCategory(t.type)}
      tooltipAlign={index % 3 === 0 ? 'left' : index % 3 === 2 ? 'right' : 'center'}
      locked={locked(t.type)}
      lockedHint={locked(t.type) ? lockedHint(t.type) : undefined}
    />
  );

  const widgetsPanel = (
    <div ref={scrollRef} className="hub-left__scroll">
      {category && !locked(category) ? (
        <WidgetCatalog
          type={category}
          onBack={() => { setCategory(null); scrollRef.current?.scrollTo({ top: 0 }); }}
          onClose={closeDrawer}
          addWidget={(type, data) => { if (!locked(type)) addWidget(type, data); }}
          setMediaLibraryConfig={setMediaLibraryConfig}
        />
      ) : <>
      {/* Seção 1: Elementos */}
      <div className="p-3.5 border-b border-borda">
         <div className="flex justify-between items-center mb-3">
           <h3 className="text-[10px] font-black text-marca uppercase tracking-widest flex items-center gap-1.5">
             <Layers size={11} /> Elementos
           </h3>
           <button aria-label="Fechar painel" onClick={closeDrawer} className="md:hidden text-tinta-3 hover:text-tinta w-11 h-11 flex items-center justify-center rounded-lg hover:bg-papel-3 transition-colors">
             <X size={18} />
           </button>
         </div>

         <div className="mb-3"><SearchBox value={toolQuery} onChange={setToolQuery} placeholder="Buscar elemento: relógio, vídeo, PDF" /></div>

         {widget && (
           <div className="hub-left__selected mb-3 p-2.5 rounded-lg">
             <p className="text-[10px] font-black text-marca uppercase tracking-wider mb-1.5">Elemento selecionado</p>
             <div className="flex flex-wrap gap-1.5">
               {widget.type === WidgetType.TEXT && (
                 <button type="button" onClick={() => go('text-effects')} className="min-h-[44px] md:min-h-[32px] px-3 rounded-lg bg-papel border border-borda hover:border-marca text-xs md:text-[10px] font-bold text-tinta-2 flex items-center gap-1.5"><Type size={13} /> Efeitos do texto</button>
               )}
               {(widget.type === WidgetType.IMAGE || widget.type === WidgetType.GIF) && (
                 <button type="button" onClick={() => go('image-filters')} className="min-h-[44px] md:min-h-[32px] px-3 rounded-lg bg-papel border border-borda hover:border-marca text-xs md:text-[10px] font-bold text-tinta-2 flex items-center gap-1.5"><SlidersHorizontal size={13} /> Filtros da imagem</button>
               )}
               <button type="button" onClick={() => go('effects')} className="min-h-[44px] md:min-h-[32px] px-3 rounded-lg bg-papel border border-borda hover:border-marca text-xs md:text-[10px] font-bold text-tinta-2 flex items-center gap-1.5"><Sparkles size={13} /> Sombra, contorno e bloco</button>
             </div>
           </div>
         )}

         {!toolQuery && recentTools.length > 0 && (
           <div className="mb-2.5">
             <h4 className="text-[9px] font-black text-tinta-3 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={9} />Usados há pouco</h4>
             <div className="grid grid-cols-3 gap-1.5">{recentTools.map((t, i) => renderTool(t, i))}</div>
           </div>
         )}

         {(['Básicos', 'Utilitários', 'Interativos', 'Integrações'] as const).map(group => {
           const tools = visibleTools.filter(t => t.group === group);
           if (!tools.length) return null;
           const style = GROUP_STYLE[group];
           return (
             <div key={group} className="mb-2.5">
               <h4 className={`text-[9px] font-black ${style.text} uppercase tracking-widest mb-1 flex items-center gap-1.5`}><span className={`w-1 h-1 rounded-full ${style.dot} inline-block`}></span>{group}</h4>
               <div className="grid grid-cols-3 gap-1.5">{tools.map((t, i) => renderTool(t, i))}</div>
             </div>
           );
         })}
         {visibleTools.length === 0 && <p className="text-sm md:text-xs text-tinta-3">Nenhum elemento com essa palavra.</p>}

         <div className="mt-3 pt-3 border-t border-borda">
            <button
              onClick={() => setIsClearingScene(true)}
              className="w-full flex items-center justify-center gap-2 py-2 min-h-[44px] md:min-h-0 bg-danger-fundo hover:bg-danger-fundo text-danger rounded-lg text-[9px] font-bold transition-colors border border-danger/30 uppercase tracking-wider"
            >
              <Trash2 size={11} /> Limpar Todos os Widgets
            </button>
         </div>
      </div>

      {/* Seção 2: Fundo da Cena */}
      <div className="p-3.5 border-b border-borda">
         <div className="flex items-center gap-2 mb-4">
           <MonitorPlay size={12} className="text-marca" />
           <h3 className="text-[10px] font-black text-marca uppercase tracking-widest">
             Fundo da Cena
           </h3>
         </div>

         <div className="space-y-4">
            <div className="group">
              <label className="text-[9px] font-bold text-tinta-3 uppercase block mb-1.5">Vídeo de Fundo (YouTube ou MP4)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://youtube.com... ou https://.../video.mp4"
                  value={activePage.backgroundVideoUrl || ''}
                  onChange={(e) => patchPage({ backgroundVideoUrl: e.target.value, backgroundImage: '' })}
                  className="w-full bg-papel-2 border border-borda-3 rounded-lg p-2 pl-7 text-base md:text-[10px] text-tinta focus:border-marca focus:ring-1 focus:ring-marca outline-none transition-all"
                />
                <Film size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tinta-3" />
              </div>

              <div className="relative mt-2.5 mb-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-borda"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-papel px-2 text-tinta-3 font-bold uppercase text-[8px]">ou</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setMediaLibraryConfig({
                    isOpen: true,
                    allowedTypes: 'video',
                    onSelect: (url: string) => patchPage({ backgroundVideoUrl: url, backgroundImage: '' }),
                  });
                }}
                className="flex items-center justify-center gap-1.5 w-full min-h-[44px] md:min-h-0 bg-papel-3 hover:bg-borda text-tinta-2 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all border border-borda-2 hover:border-borda-3 shadow-card"
              >
                <Upload size={12} />
                Selecionar Vídeo
              </button>

              {activePage.backgroundVideoUrl && (
                <div className="flex flex-col gap-1.5 mt-2 ml-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="bg-video-mute"
                      checked={activePage.backgroundVideoMuted !== false}
                      onChange={(e) => patchPage({ backgroundVideoMuted: e.target.checked })}
                      className="w-3 h-3 rounded border-borda-2 bg-papel text-marca focus:ring-offset-0 focus:ring-1 focus:ring-marca cursor-pointer"
                    />
                    <label htmlFor="bg-video-mute" className="text-[9px] font-bold text-tinta-3 uppercase cursor-pointer select-none hover:text-marca-hover transition-colors">
                      Vídeo Mudo (Sem Áudio)
                    </label>
                  </div>

                  {isYouTubeUrl(activePage.backgroundVideoUrl) && (
                    <div className="flex items-center justify-between bg-papel-2 p-1.5 rounded-lg border border-borda mt-0.5">
                      <label className="text-[9px] font-bold text-tinta-3 uppercase">Qualidade YouTube</label>
                      <select
                        value={activePage.backgroundVideoQuality || 'highres'}
                        onChange={(e) => patchPage({ backgroundVideoQuality: e.target.value })}
                        className="bg-papel border border-borda-3 text-tinta-2 text-[9px] rounded px-1.5 py-0.5 outline-none focus:border-marca"
                      >
                        <option value="highres">Máxima (Auto)</option>
                        <option value="hd1080">1080p</option>
                        <option value="hd720">720p</option>
                        <option value="large">480p</option>
                        <option value="medium">360p</option>
                        <option value="small">240p</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-papel px-2 text-[8px] text-tinta-3 font-bold">OU</span>
               </div>
               <div className="border-t border-borda w-full"></div>
            </div>

            <div className="group">
              <label className="text-[9px] font-bold text-tinta-3 uppercase block mb-1.5">Imagem de Fundo</label>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={activePage.backgroundImage || ''}
                  onChange={(e) => patchPage({ backgroundImage: e.target.value, backgroundVideoUrl: '' })}
                  className="w-full bg-papel-2 border border-borda-3 rounded-lg p-2 pl-7 text-base md:text-[10px] text-tinta focus:border-marca focus:ring-1 focus:ring-marca outline-none transition-all"
                />
                <ImageIcon size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tinta-3" />
              </div>

              <button
                onClick={() => {
                  setMediaLibraryConfig({
                    isOpen: true,
                    allowedTypes: 'image',
                    onSelect: (url: string) => patchPage({ backgroundImage: url, backgroundVideoUrl: '' }),
                  });
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 min-h-[44px] md:min-h-0 bg-papel border border-borda hover:bg-papel-3 rounded-lg text-[9px] font-bold text-tinta-3 hover:text-tinta transition-all"
              >
                <Upload size={11} />
                SELECIONAR IMAGEM
              </button>
            </div>

            <div className="relative">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-papel px-2 text-[8px] text-tinta-3 font-bold">OU</span>
               </div>
               <div className="border-t border-borda w-full"></div>
            </div>

            <div className="group">
              <label className="text-[9px] font-bold text-tinta-3 uppercase block mb-1.5">Fundo Animado</label>
              <button
                onClick={() => {
                  setSelectedWidget(null);
                  setShowBgAnimModal(true);
                }}
                className="w-full flex items-center justify-between gap-1.5 py-2 px-2.5 min-h-[44px] md:min-h-0 bg-papel-2 border border-borda-2 hover:border-marca rounded-lg text-[10px] text-tinta-2 hover:text-tinta transition-all"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <MonitorPlay size={13} className="text-marca shrink-0" />
                  {activePage.backgroundAnimation ?
                    ['Automático (Clima)', 'Fluxo Gradiente', 'Céu e Nuvens', 'Chuva Digital', 'Neve Caindo', 'Chamas', 'Grid Tech', 'Alerta Vermelho', 'Pulso Azul', 'Pulso Verde', 'Aurora Boreal']
                    [['auto-weather', 'gradient-flow', 'clouds', 'rain', 'snow', 'fire', 'tech-grid', 'pulse-red', 'pulse-blue', 'pulse-green', 'aurora'].indexOf(activePage.backgroundAnimation)]
                    : 'Escolher Animação'}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activePage.backgroundAnimation ? 'bg-marca' : 'bg-borda'}`}></div>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-borda">
              <h3 className="text-[10px] font-black text-warn uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Move size={11} /> Transições
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-tinta-3 uppercase block mb-1">Tipo de Transição</label>
                  <select
                    value={activePage.transitionType || 'none'}
                    onChange={(e) => patchPage({ transitionType: e.target.value as Page['transitionType'] })}
                    className="w-full bg-papel-2 border border-borda-3 rounded-lg p-2 text-base md:text-[10px] text-tinta focus:border-warn focus:ring-1 focus:ring-warn outline-none transition-all cursor-pointer"
                  >
                    <option value="none">Nenhuma</option>
                    <option value="fade">Fade</option>
                    <option value="slide-left">Slide Esquerda</option>
                    <option value="slide-right">Slide Direita</option>
                    <option value="slide-up">Slide Cima</option>
                    <option value="slide-down">Slide Baixo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-tinta-3 uppercase block mb-1">Duração (ms)</label>
                  <input
                    type="number"
                    value={activePage.transitionDuration || 500}
                    onChange={(e) => patchPage({ transitionDuration: parseInt(e.target.value) })}
                    className="w-full bg-papel-2 border border-borda-3 rounded-lg p-2 text-base md:text-[10px] text-tinta focus:border-warn focus:ring-1 focus:ring-warn outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[9px] font-bold text-tinta-3 uppercase block mb-1">Ajuste da Imagem</label>
              <select
                className="w-full bg-papel-2 border border-borda-3 rounded-lg p-2 text-base md:text-[10px] text-tinta outline-none focus:border-marca cursor-pointer"
                value={activePage.backgroundFit || 'cover'}
                onChange={(e) => patchPage({ backgroundFit: e.target.value as Page['backgroundFit'] })}
              >
                <option value="cover">Preencher (Corta)</option>
                <option value="fill">Esticar</option>
                <option value="contain">Ajustar (Bordas)</option>
              </select>
            </div>
         </div>

         <div>
           <label className="text-[9px] font-bold text-tinta-3 uppercase block mb-1">Duração (Segundos)</label>
           <div className="flex items-center gap-2 bg-papel-2 border border-borda-2 rounded-lg p-1">
             <Clock size={13} className="ml-1.5 text-tinta-3" />
             <input
               type="number"
               value={activePage.duration}
               onChange={(e) => patchPage({ duration: parseInt(e.target.value) || 5 })}
               className="w-full bg-transparent border-none p-1 text-base md:text-xs font-bold text-tinta focus:ring-0 outline-none"
             />
           </div>
         </div>
      </div>

      {activePage.broadcast_id && (
         <div className="m-3.5 p-2 bg-marca-fundo border border-borda rounded-xl flex items-start gap-2">
           <CalendarDays className="text-marca shrink-0 mt-0.5" size={14} />
           <div>
             <p className="text-[10px] font-bold text-marca mb-0.5">Cena Programada</p>
             <p className="text-[9px] text-marca leading-relaxed">
               Esta cena veio de Agendar publicação. O que você mudar aqui vale só para esta tela.
             </p>
           </div>
         </div>
      )}
      </>}
    </div>
  );

  const noop = () => {};
  const insertImage = onInsertImage ?? ((url: string) => addWidget(WidgetType.IMAGE, { url, fillContainer: true, fitContainerMode: 'cover', imageConfig: { objectFit: 'cover', scale: 1 } }));

  let body: React.ReactNode;
  switch (current) {
    case 'templates':
      body = <TemplatesPanel orientation={orientation} onApplyTemplate={onApplyTemplate ?? noop} onClose={closeDrawer} />;
      break;
    case 'text':
      body = <TextPanel addWidget={addWidget} onClose={closeDrawer} />;
      break;
    case 'text-effects':
      body = <TextEffectsPanel currentWidget={widget} updateWidgetData={updateWidgetData} onBack={() => go('text')} onClose={closeDrawer} />;
      break;
    case 'effects':
      body = <EffectsPanel currentWidget={widget} updateWidgetData={updateWidgetData} onBack={() => go('widgets')} onClose={closeDrawer} />;
      break;
    case 'image-filters':
      body = <ImageFiltersPanel currentWidget={widget} updateWidgetData={updateWidgetData} onPanelChange={go} onBack={() => go('widgets')} onClose={closeDrawer} />;
      break;
    case 'icons':
      body = <IconsPanel addWidget={addWidget} currentWidget={widget} updateWidgetData={updateWidgetData} onClose={closeDrawer} />;
      break;
    case 'shapes':
      body = <ShapesPanel addWidget={addWidget} currentWidget={widget} updateWidgetData={updateWidgetData} onClose={closeDrawer} />;
      break;
    case 'motion':
      body = <MotionPanel addWidget={addWidget} onClose={closeDrawer} />;
      break;
    case 'ai':
    case 'ai-edit':
      body = (
        <div className="hub-panel">
          <PanelHeader title={current === 'ai' ? 'Criar com IA' : 'Editar com IA'} onBack={current === 'ai-edit' ? () => go('image-filters') : undefined} onClose={closeDrawer} />
          <div className="hub-panel__body">
            <AiPanel
              mode={current === 'ai' ? 'create' : 'edit'}
              orientation={orientation}
              currentWidget={widget}
              onInsertImage={insertImage}
              onApplyPreset={onApplyAiPreset ?? noop}
              updateWidgetData={updateWidgetData}
            />
          </div>
        </div>
      );
      break;
    case 'layers':
      body = (
        <div className="hub-panel">
          <PanelHeader title="Camadas" subtitle="Ordem dos elementos, de cima para baixo." onClose={closeDrawer} />
          <div className="hub-panel__body">
            {layersSlot ?? <p className="text-sm md:text-xs text-tinta-3">Não há camadas para mostrar.</p>}
          </div>
        </div>
      );
      break;
    default:
      body = widgetsPanel;
  }

  return (
    <aside className={`hub-widget-library hub-left shrink-0 absolute md:relative left-0 top-0 h-full bg-papel border-r border-borda z-[60] shadow-flutuante transition-transform duration-300 ease-in-out ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <nav className="hub-left__rail" aria-label="Ferramentas do editor">
        {RAIL.map(item => {
          const active = railActive === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="hub-left__rail-btn"
              aria-pressed={active}
              aria-label={item.label}
              onClick={() => onRail(item.id)}
            >
              <span className="hub-left__rail-ico" aria-hidden="true">
                {active && (
                  <motion.span
                    layoutId="rail-ativo"
                    className="hub-left__rail-pill"
                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="hub-left__rail-svg">{item.icon}</span>
              </span>
              <span className="hub-left__rail-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="hub-left__panel">{body}</div>
    </aside>
  );
};
