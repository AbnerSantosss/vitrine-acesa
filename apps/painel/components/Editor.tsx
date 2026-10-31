import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, MonitorPlay, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useModalA11y } from '../hooks/useModalA11y';
import { isEditableTarget, useEditorHistory } from '../hooks/useEditorHistory';
import { getDisplays, getDevices, saveDisplay } from '../services/storage';
import { getBillingSnapshot } from '../services/billing';
import { createAutosaveQueue, readDraft, clearDraft } from '../services/autosaveQueue';
import type { AutosaveQueue } from '../services/autosaveQueue';
import type { AiPresetResult } from '../services/ai';
import { Display, Page, WidgetType, LayoutItem, Device, WidgetData } from '../types';
import type { EditorLeftPanel, EditorSaveState } from '../types';

import { WidgetLibrary } from './editor/WidgetLibrary';
import { PropertiesPanel } from './editor/PropertiesPanel';
import { Canvas } from './editor/Canvas';
import { QuickToolbar } from './editor/QuickToolbar';
import { Toolbar } from './editor/Toolbar';
import { ZoomControl } from './editor/ZoomControl';
import { SceneTabs, createId } from './editor/SceneTabs';
import { LayersModal, reorderLayers } from './editor/LayersModal';
import { PublishConfirmModal } from './editor/PublishConfirmModal';
import { boundCanvasItem, getCanvasGeometry, isWall } from './editor/canvasGeometry';
import type { SceneTemplate } from './editor/presets/sceneTemplates';
import { MediaLibrary } from './MediaLibrary';
import './editor/EditorLayout.css';

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

/** Troca de conteúdo da cena que espera a confirmação da pessoa. */
interface PendingReplace {
  title: string;
  layout: LayoutItem[];
  page?: SceneTemplate['page'];
}

/** Elemento copiado com Ctrl+C; `pastes` desloca cada colagem seguinte para não empilhar no mesmo ponto. */
interface ClipboardItem {
  item: LayoutItem;
  pastes: number;
}

/** Ordem de pintura: o maior zIndex fica na frente. */
const topZ = (layout: LayoutItem[]) => Math.max(10, ...layout.map(w => w.data.zIndex ?? 10)) + 1;

/** Tamanho inicial (em células de 40 px) de cada tipo de elemento. */
function defaultSize(type: WidgetType, vertical: boolean): { w: number; h: number } {
  switch (type) {
    case WidgetType.VIDEO:
    case WidgetType.IFRAME:
    case WidgetType.CALENDAR:
    case WidgetType.GIF:
    case WidgetType.NOTES:
      return { w: 12, h: 8 };
    case WidgetType.RSS:
    case WidgetType.COUNTDOWN:
      return { w: 12, h: 6 };
    case WidgetType.TODO:
      return { w: 12, h: 10 };
    case WidgetType.CHORES:
      return { w: 16, h: 10 };
    case WidgetType.MEAL_PLAN:
    case WidgetType.BROWSER_SNAPSHOT:
    case WidgetType.POWER_BI:
    case WidgetType.AIRTABLE:
      return { w: 18, h: 12 };
    case WidgetType.MARKET_WATCH:
      return { w: 16, h: 8 };
    case WidgetType.GOOGLE_DOCS:
    case WidgetType.OFFICE_DOCS:
    case WidgetType.EMBED_HTML:
    case WidgetType.PDF_DOCUMENT:
      return { w: 16, h: 12 };
    case WidgetType.ICON:
      return { w: 5, h: 5 };
    case WidgetType.SHAPE:
      return vertical ? { w: 14, h: 9 } : { w: 12, h: 8 };
    case WidgetType.MOTION:
      return vertical ? { w: 22, h: 24 } : { w: 24, h: 14 };
    default:
      return { w: 8, h: 6 };
  }
}

/** `updatedAt` pode chegar em segundos; o rascunho local usa milissegundos. */
const toMillis = (value: unknown): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n < 1e12 ? n * 1000 : n;
};

const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [display, setDisplay] = useState<Display | null>(null);
  const [linkedDevices, setLinkedDevices] = useState<Device[]>([]);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<EditorSaveState>({ state: 'idle' });
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);
  const [isClearingScene, setIsClearingScene] = useState(false);
  const [pendingReplace, setPendingReplace] = useState<PendingReplace | null>(null);
  const [activeMealDay, setActiveMealDay] = useState<string>('Segunda');

  // Features do plano, só para marcar no editor os widgets que o plano não
  // libera. `undefined` = ainda não carregou; nada é bloqueado nesse estado,
  // porque quem decide de verdade é o servidor no salvamento.
  const [planFeatures, setPlanFeatures] = useState<string[] | undefined>(undefined);

  const [showBgAnimModal, setShowBgAnimModal] = useState(false);
  const [leftPanel, setLeftPanel] = useState<EditorLeftPanel>('widgets');
  const [mediaLibraryConfig, setMediaLibraryConfig] = useState<{ isOpen: boolean, onSelect: (url: string) => void, allowedTypes: 'image' | 'video' | 'all' } | null>(null);

  // Zoom abaixo da cena: null = a cena cabe inteira na área.
  const [zoom, setZoom] = useState<number | null>(null);
  const [fitScale, setFitScale] = useState(0);
  const [showWallGuides, setShowWallGuides] = useState(true);

  // The library is a drawer on mobile; detailed properties open on demand.
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const linkedRef = useRef<Device[]>([]);
  const queueRef = useRef<AutosaveQueue | null>(null);
  const baselineRef = useRef<Display | null>(null);
  const draftToastRef = useRef<string | number | null>(null);
  const clipboardRef = useRef<ClipboardItem | null>(null);
  const shortcutRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  linkedRef.current = linkedDevices;

  const bgAnimModalRef = useModalA11y(showBgAnimModal, () => setShowBgAnimModal(false));
  const clearSceneModalRef = useModalA11y(isClearingScene, () => setIsClearingScene(false));
  const sceneDeleteModalRef = useModalA11y(pageToDelete !== null, () => setPageToDelete(null));
  const replaceModalRef = useModalA11y(pendingReplace !== null, () => setPendingReplace(null));

  const dialogOpen = showBgAnimModal || isClearingScene || pageToDelete !== null || showPublishConfirm || pendingReplace !== null || !!mediaLibraryConfig?.isOpen;

  // Desfazer e refazer (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y); desligados com um diálogo aberto.
  const history = useEditorHistory(display, setDisplay, { shortcutsEnabled: !dialogOpen });

  useEffect(() => {
    let cancelled = false;

    // Rascunho guardado neste aparelho mais novo que o servidor: oferece recuperar.
    const offerDraft = (found: Display) => {
      const draft = readDraft(found.id);
      if (!draft) return;
      const newer = draft.savedAt > toMillis(found.updatedAt);
      if (!newer || JSON.stringify(draft.display.pages) === JSON.stringify(found.pages)) {
        clearDraft(found.id);
        return;
      }
      draftToastRef.current = toast('Há alterações salvas só neste aparelho', {
        description: 'Encontramos uma versão mais recente desta tela, guardada aqui quando a internet falhou ou a página foi fechada.',
        duration: Infinity,
        action: {
          label: 'Recuperar',
          onClick: () => {
            draftToastRef.current = null;
            setDisplay(previous => previous ? {
              ...previous,
              name: draft.display.name || previous.name,
              pages: draft.display.pages,
              coverImage: draft.display.coverImage,
              orientation: draft.display.orientation || previous.orientation,
            } : previous);
          },
        },
        cancel: {
          label: 'Descartar',
          onClick: () => { draftToastRef.current = null; clearDraft(found.id); },
        },
      });
    };

    const fetchData = async () => {
      const displays = await getDisplays();
      if (cancelled) return;
      const found = displays.find(d => d.id === id);
      if (found) {
        // Normaliza z-indexes de displays legados onde todos os widgets têm o mesmo zIndex
        const normalized = { ...found };
        normalized.pages = normalized.pages.map(page => {
          if (!page.layout || page.layout.length <= 1) return page;
          const zValues = page.layout.map(w => w.data.zIndex ?? 10);
          const allSame = zValues.every(z => z === zValues[0]);
          if (allSame) {
            return {
              ...page,
              layout: page.layout.map((w, idx) => ({
                ...w,
                data: { ...w.data, zIndex: 10 + idx }
              }))
            };
          }
          return page;
        });
        // O que veio do servidor (já normalizado) é a linha de base: só edições novas entram na fila.
        baselineRef.current = normalized;
        setDisplay(normalized);
        offerDraft(found);
      } else {
        navigate('/');
      }

      const devices = await getDevices();
      if (cancelled) return;
      setLinkedDevices(devices.filter(d => d.status === 'linked' && d.display_id === id && d.online));
    };
    fetchData();
    return () => { cancelled = true; };
  }, [id, navigate]);

  // Falha de billing não pode derrubar o editor: sem features carregadas, os
  // widgets ficam todos liberados e o servidor recusa no salvamento se for o caso.
  useEffect(() => {
    getBillingSnapshot()
      .then(snapshot => {
        if (snapshot) setPlanFeatures(snapshot.subscription.plan.features);
      })
      .catch(() => setPlanFeatures(undefined));
  }, []);

  // Fila do salvamento automático (rascunho local em 1,5 s, envio em 10 s, refaz sozinha sem internet).
  useEffect(() => {
    if (!id) return;
    const queue = createAutosaveQueue({
      displayId: id,
      send: saveDisplay,
      onState: setSaveState,
      onRejected: error => {
        const e = error as { response?: { status?: number; data?: { error?: string } } };
        const message = e?.response?.data?.error;
        toast.error(message || 'O servidor não aceitou o salvamento automático. Suas alterações continuam guardadas neste aparelho.', { duration: 8000 });
      },
      // Com TV ligada, enviar sozinho publicaria uma cena pela metade ao vivo: só o Salvar manual publica.
      allowSend: () => linkedRef.current.length === 0,
    });
    queueRef.current = queue;
    return () => {
      queue.dispose(true);
      if (queueRef.current === queue) queueRef.current = null;
      if (draftToastRef.current !== null) { toast.dismiss(draftToastRef.current); draftToastRef.current = null; }
    };
  }, [id]);

  // Cada edição entra na fila; o que veio do servidor ou acabou de ser salvo não.
  useEffect(() => {
    if (!display || display.id !== id) return;
    if (display === baselineRef.current) return;
    if (draftToastRef.current !== null) { toast.dismiss(draftToastRef.current); draftToastRef.current = null; }
    queueRef.current?.schedule(display);
  }, [display, id]);

  // Fechar a aba com alteração ainda não enviada: o navegador pergunta antes.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (queueRef.current?.hasUnsent()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Atalhos do canvas (a lógica fica no render, que enxerga o estado atual).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => shortcutRef.current?.(event);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!display) return (
    <div className="h-tela w-screen flex flex-col items-center justify-center bg-papel-2 text-tinta-3 gap-4">
      <Loader2 className="animate-spin text-marca" size={32} />
      <p className="text-xs uppercase tracking-widest font-bold">Carregando estúdio...</p>
    </div>
  );

  // A cena aberta nunca aponta para fora da lista (ex.: depois de desfazer uma exclusão).
  const pageIdx = Math.min(Math.max(0, activePageIdx), display.pages.length - 1);
  const activePage = display.pages[pageIdx];
  // Mesma grade do Player: 40 px por célula, por TV (48x27 ou 27x48), somada no videowall.
  const geometry = getCanvasGeometry(display.orientation, display.wall);
  const gridCols = geometry.cols;
  const gridRows = geometry.rows;
  const vertical = display.orientation === 'vertical';
  const wallMode = isWall(display.wall);

  const currentWidget = activePage.layout.find(w => w.i === selectedWidget);

  /** Altera só a cena aberta, sempre criando objetos novos (o desfazer depende disso). */
  const updateActivePage = (fn: (page: Page) => Page) => {
    const pageId = activePage.id;
    setDisplay(previous => previous ? { ...previous, pages: previous.pages.map(page => page.id === pageId ? fn(page) : page) } : previous);
  };

  const performSave = async () => {
    const snapshot = display;
    setIsSaving(true);
    try {
      await saveDisplay(snapshot);
      baselineRef.current = snapshot;
      queueRef.current?.markSaved(snapshot);
      toast.success('Salvo', { duration: 2000 });
    } catch (e: any) {
      // Bloqueio de plano (403 feature / 402 vídeo) traz uma mensagem escrita
      // para o cliente ler, dizendo qual plano libera. Trocá-la por "verifique
      // sua conexão" mandaria a pessoa depurar a internet por causa de uma
      // decisão comercial.
      const status = e?.response?.status;
      const serverMessage = e?.response?.data?.error;

      if ((status === 402 || status === 403) && serverMessage) {
        toast.error(serverMessage, { duration: 8000 });
      } else {
        // Sem rede, a alteração fica guardada neste aparelho e a fila envia quando a internet voltar.
        queueRef.current?.schedule(snapshot);
        toast.error('Não foi possível salvar agora. Suas alterações ficam guardadas neste aparelho e serão enviadas quando a conexão voltar.');
      }
    } finally {
      setIsSaving(false);
      setShowPublishConfirm(false);
    }
  };

  const handleSave = async () => {
    if (linkedDevices.length > 0) {
      setShowPublishConfirm(true);
      return;
    }
    await performSave();
  };

  const handleLayoutChange = (layout: any[]) => {
    const pageId = activePage.id;
    setDisplay(previous => {
      if (!previous) return previous;
      let changed = false;
      const pages = previous.pages.map(page => {
        if (page.id !== pageId) return page;
        const nextLayout = page.layout.map(widget => {
          const item = layout.find(candidate => candidate.i === widget.i);
          if (!item || (item.x === widget.x && item.y === widget.y && item.w === widget.w && item.h === widget.h)) return widget;
          changed = true;
          return { ...widget, x: item.x, y: item.y, w: item.w, h: item.h };
        });
        return changed ? { ...page, layout: nextLayout } : page;
      });
      return changed ? { ...previous, pages } : previous;
    });
  };

  /** Coloca o elemento na frente de tudo (o zIndex é calculado sobre a cena mais atual). */
  const appendWidget = (widget: LayoutItem, zIndex?: number) => {
    updateActivePage(page => ({
      ...page,
      layout: [...page.layout, { ...widget, data: { ...widget.data, zIndex: zIndex ?? topZ(page.layout) } }],
    }));
  };

  const insertWidget = (type: WidgetType, presetData: Partial<LayoutItem['data']> = {}, sizeOverride?: { w: number; h: number }) => {
    const isFullInfo = type === WidgetType.FULL_INFO;
    // O painel completo ocupa uma TV; só numa tela única vira tela cheia de verdade.
    const base = isFullInfo ? { w: geometry.tileCols, h: geometry.tileRows } : (sizeOverride ?? defaultSize(type, vertical));
    const defaultWidth = Math.min(base.w, geometry.tileCols);
    const defaultHeight = Math.min(base.h, geometry.tileRows);

    const newWidget: LayoutItem = {
      i: createId(),
      // Centralizado na primeira TV, não no meio do videowall (que pode cair na divisão entre telas).
      x: isFullInfo ? 0 : Math.floor((geometry.tileCols - defaultWidth) / 2),
      y: isFullInfo ? 0 : Math.floor((geometry.tileRows - defaultHeight) / 2),
      w: defaultWidth,
      h: defaultHeight,
      type,
      data: {
        content: type === WidgetType.TEXT ? 'NOVO TEXTO' : (type === WidgetType.NOTES ? 'Bloco de notas\n\n• Use esta nota para deixar recados ou avisos na tela.\n• Aceita quebra de linha e emojis.' : ''),
        url: type === WidgetType.IMAGE ? 'https://picsum.photos/400/300' : (type === WidgetType.IFRAME ? 'https://www.wikipedia.org' : (type === WidgetType.GIF ? 'https://media.giphy.com/media/3o7TKSjRrfIPjei72E/giphy.gif' : '')),
        videoUrl: type === WidgetType.VIDEO ? 'https://www.youtube.com/watch?v=YhYaHfpz6lo' : '',
        rssUrl: type === WidgetType.RSS ? 'https://g1.globo.com/rss/g1/tecnologia/' : '',
        calendarId: type === WidgetType.CALENDAR ? 'pt.brazilian#holiday@group.v.calendar.google.com' : '',
        city: (type === WidgetType.WEATHER || type === WidgetType.CLOCK || type === WidgetType.FULL_INFO) ? 'Campina Grande' : '',
        model: type === WidgetType.WEATHER ? 'simple' : (type === WidgetType.CLOCK ? 'standard' : undefined),
        color: '#ffffff',
        fontSize: '2vw',
        fillContainer: true,
        contentAlignment: type === WidgetType.FULL_INFO ? 'center' : 'stretch',
        fitContainerMode: type === WidgetType.FULL_INFO ? 'contain' : 'stretch',
        textSize: type === WidgetType.FULL_INFO ? 50 : undefined,
        numberSize: type === WidgetType.FULL_INFO ? 50 : undefined,
        notesConfig: type === WidgetType.NOTES ? {
          fontFamily: 'Inter',
          fontSize: '1.2rem',
          textColor: '#ffffff',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          paperTheme: 'glass'
        } : undefined,
        todoConfig: type === WidgetType.TODO ? {
          title: '📋 Tarefas Diárias',
          items: [
            { id: '1', text: 'Reunião de Alinhamento (09:00)', done: false },
            { id: '2', text: 'Revisar metas da equipe', done: true },
            { id: '3', text: 'Organizar recepção', done: false }
          ]
        } : undefined,
        countdownConfig: type === WidgetType.COUNTDOWN ? {
          title: 'Lançamento do novo site',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          expiredMessage: 'O lançamento chegou!',
          theme: 'bold-gradient'
        } : undefined,
        choresConfig: type === WidgetType.CHORES ? {
          title: 'Quadro de Deveres',
          items: [
            { id: '1', chore: 'Regar as plantas', assignee: 'Carlos', day: 'Segunda', done: false },
            { id: '2', chore: 'Organizar estoque', assignee: 'Mariana', day: 'Terça', done: true },
            { id: '3', chore: 'Trocar café da recepção', assignee: 'Vítor', day: 'Quarta', done: false }
          ]
        } : undefined,
        mealPlanConfig: type === WidgetType.MEAL_PLAN ? {
          title: 'Cardápio da Semana',
          days: {
            'Segunda': { breakfast: 'Tapioca + Café', lunch: 'Arroz, Feijão, Frango', dinner: 'Sopa de Legumes', snacks: 'Fruta' },
            'Terça': { breakfast: 'Pão Integral + Suco', lunch: 'Purê de Batata, Carne', dinner: 'Salada Completa', snacks: 'Iogurte' },
            'Quarta': { breakfast: 'Cuscuz com Ovo', lunch: 'Macarrão com Almôndegas', dinner: 'Sanduíche Natural', snacks: 'Castanhas' },
            'Quinta': { breakfast: 'Tapioca + Café', lunch: 'Arroz Integral, Peixe', dinner: 'Omelete com Queijo', snacks: 'Fruta' },
            'Sexta': { breakfast: 'Panqueca de Aveia', lunch: 'Feijoada Leve, Couve', dinner: 'Wrap Integral', snacks: 'Iogurte' }
          }
        } : undefined,
        marketWatchConfig: type === WidgetType.MARKET_WATCH ? {
          title: '📊 Mercado Financeiro',
          symbols: ['IBOV', 'PETR4.SA', 'VALE3.SA', 'BTC-USD'],
          layout: 'list'
        } : undefined,
        browserSnapshotConfig: type === WidgetType.BROWSER_SNAPSHOT ? {
          url: 'https://g1.globo.com',
          updateIntervalMinutes: 15
        } : undefined,
        googleDocsConfig: type === WidgetType.GOOGLE_DOCS ? {
          url: '',
          docType: 'document'
        } : undefined,
        officeDocsConfig: type === WidgetType.OFFICE_DOCS ? {
          url: '',
          docType: 'word'
        } : undefined,
        powerBiConfig: type === WidgetType.POWER_BI ? {
          embedUrl: ''
        } : undefined,
        embedWebsiteConfig: type === WidgetType.IFRAME ? {
          url: 'https://www.wikipedia.org',
          interactive: false
        } : undefined,
        embedHtmlConfig: type === WidgetType.EMBED_HTML ? {
          html: '<div style="padding: 20px; text-align: center; background: linear-gradient(135deg, #1e1b4b, #311042); color: #fff; border-radius: 12px; font-family: sans-serif; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: center;">\n  <h2 style="margin-top:0; color: #22d3ee; margin-bottom: 8px;">HTML personalizado</h2>\n  <p style="margin-bottom: 12px;">Edite este bloco com seu código HTML ou JS no painel lateral.</p>\n</div>'
        } : undefined,
        airtableConfig: type === WidgetType.AIRTABLE ? {
          shareUrl: ''
        } : undefined,
        pdfDocumentConfig: type === WidgetType.PDF_DOCUMENT ? {
          pdfUrl: ''
        } : undefined,
        fullScreenMode: isFullInfo && !wallMode ? true : undefined,
        ...presetData,
        zIndex: isFullInfo ? 0 : 10,
      }
    };

    appendWidget(newWidget, isFullInfo ? 0 : undefined);
    setSelectedWidget(newWidget.i);
    setShowLeftSidebar(false);
    setShowRightSidebar(false);
  };

  const addWidget = (type: WidgetType, presetData: Partial<LayoutItem['data']> = {}) => insertWidget(type, presetData);

  const removeWidget = (wId: string) => {
    updateActivePage(page => ({ ...page, layout: page.layout.filter(widget => widget.i !== wId) }));
    setSelectedWidget(current => current === wId ? null : current);
  };

  const confirmRemovePage = () => {
    if (pageToDelete === null) return;

    const updatedPages = display.pages
      .filter((_, i) => i !== pageToDelete)
      .map((page, i) => page.order === i + 1 ? page : { ...page, order: i + 1 });

    let newIdx = pageIdx;
    if (pageToDelete < pageIdx) {
        newIdx = pageIdx - 1;
    } else if (pageToDelete === pageIdx) {
        newIdx = Math.max(0, pageToDelete - 1);
    }
    newIdx = Math.min(newIdx, updatedPages.length - 1);

    setDisplay(previous => previous ? { ...previous, pages: updatedPages } : previous);
    setActivePageIdx(newIdx);
    setSelectedWidget(null);
    setPageToDelete(null);
  };

  const removePage = (idx: number) => {
    if (display.pages.length <= 1) {
      toast.error('É necessário ter pelo menos uma cena.');
      return;
    }
    setPageToDelete(idx);
  };

  /** Troca de cena: envia o que está pendente e limpa a seleção. */
  const selectPage = (idx: number) => {
    void queueRef.current?.flushNow();
    setActivePageIdx(idx);
    setSelectedWidget(null);
  };

  const clearAllWidgets = () => {
    updateActivePage(page => ({ ...page, layout: [] }));
    setSelectedWidget(null);
    setIsClearingScene(false);
  };

  const updateWidgetData = (wId: string, dataUpdates: Partial<LayoutItem['data']>) => {
    updateActivePage(page => ({
      ...page,
      layout: page.layout.map(widget => widget.i === wId ? { ...widget, data: { ...widget.data, ...dataUpdates } } : widget),
    }));
  };

  const duplicateWidget = () => {
    const source = currentWidget;
    if (!source) return;
    const placed = boundCanvasItem({ i: '', x: source.x + 1, y: source.y + 1, w: source.w, h: source.h }, geometry);
    const duplicate: LayoutItem = {
      ...source,
      i: createId(),
      x: placed.x,
      y: placed.y,
      data: structuredClone(source.data),
    };
    appendWidget(duplicate);
    setSelectedWidget(duplicate.i);
  };

  const copyWidget = () => {
    if (!currentWidget) return;
    clipboardRef.current = { item: structuredClone(currentWidget), pastes: 0 };
    toast.success('Elemento copiado', { duration: 1500 });
  };

  const pasteWidget = () => {
    const clip = clipboardRef.current;
    if (!clip) return;
    clip.pastes += 1;
    const placed = boundCanvasItem({ i: '', x: clip.item.x + clip.pastes, y: clip.item.y + clip.pastes, w: clip.item.w, h: clip.item.h }, geometry);
    const copy: LayoutItem = { ...structuredClone(clip.item), i: createId(), x: placed.x, y: placed.y, w: placed.w, h: placed.h };
    appendWidget(copy);
    setSelectedWidget(copy.i);
  };

  /** Seta move 1 célula (40 px na tela da TV); com Shift, 5 células. */
  const nudgeWidget = (dx: number, dy: number, step: number) => {
    const target = currentWidget;
    if (!target || target.data.locked || target.data.fullScreenMode) return;
    updateActivePage(page => ({
      ...page,
      layout: page.layout.map(widget => {
        if (widget.i !== target.i) return widget;
        const moved = boundCanvasItem({ i: widget.i, x: widget.x + dx * step, y: widget.y + dy * step, w: widget.w, h: widget.h }, geometry);
        return moved.x === widget.x && moved.y === widget.y ? widget : { ...widget, x: moved.x, y: moved.y };
      }),
    }));
  };

  const setFullScreen = () => {
    if (!selectedWidget) return;
    const source = currentWidget;
    if (!source) return;

    const fullScreenWidget: LayoutItem = {
      ...source,
      x: 0,
      y: 0,
      w: gridCols,
      h: gridRows,
      data: {
        ...source.data,
        fillContainer: true,
        fullScreenMode: true,
        contentAlignment: 'stretch' as const,
        fitContainerMode: 'stretch' as const,
        padding: '0px',
        margin: '0px',
      }
    };

    updateActivePage(page => ({ ...page, layout: [fullScreenWidget] }));
  };

  /** Camadas pelo menu contextual: sobe, desce, topo, fundo. */
  const moveLayer = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    const target = selectedWidget;
    if (!target) return;
    updateActivePage(page => ({ ...page, layout: reorderLayers(page.layout, target, direction) }));
  };

  // ---- Modelos e cenas da IA: substituem o conteúdo da cena aberta ----

  const replaceScene = (replacement: PendingReplace) => {
    const { layout, page: pagePatch } = replacement;
    updateActivePage(page => ({
      ...page,
      layout: layout.map((item, idx) => {
        const bounded = boundCanvasItem({ i: '', x: item.x, y: item.y, w: item.w, h: item.h }, geometry);
        return {
          ...item,
          i: createId(),
          x: bounded.x,
          y: bounded.y,
          w: bounded.w,
          h: bounded.h,
          data: { ...item.data, zIndex: item.data.zIndex ?? 10 + idx },
        };
      }),
      ...(pagePatch ? {
        backgroundImage: pagePatch.backgroundImage ?? '',
        backgroundVideoUrl: pagePatch.backgroundVideoUrl ?? '',
        backgroundAnimation: (pagePatch.backgroundAnimation ?? '') as Page['backgroundAnimation'],
      } : {}),
    }));
    setSelectedWidget(null);
  };

  const requestReplace = (replacement: PendingReplace) => {
    if (activePage.layout.length > 0) setPendingReplace(replacement);
    else replaceScene(replacement);
  };

  const applyTemplate = (template: SceneTemplate) => {
    const screen = display.orientation || 'horizontal';
    if (template.orientation !== screen) {
      toast.error(`Este modelo é para tela na ${template.orientation === 'vertical' ? 'vertical' : 'horizontal'}. A tela deste projeto está na ${screen === 'vertical' ? 'vertical' : 'horizontal'}.`);
      return;
    }
    requestReplace({
      title: template.title,
      layout: template.layout.map(item => ({ ...item, i: '' })) as LayoutItem[],
      page: template.page,
    });
  };

  const applyAiPreset = (result: AiPresetResult) => {
    requestReplace({ title: 'cena criada pela IA', layout: result.layout, page: result.page });
  };

  const insertImageFromUrl = (url: string) => {
    insertWidget(WidgetType.IMAGE, { url, fitContainerMode: 'cover' }, vertical ? { w: 20, h: 20 } : { w: 24, h: 14 });
  };

  // ---- Painel da esquerda ----

  const openPanel = (panel: EditorLeftPanel) => {
    setLeftPanel(panel);
    setShowLeftSidebar(true);
    setShowRightSidebar(false);
  };

  const toggleLayers = () => {
    const desktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    if (leftPanel === 'layers' && (desktop || showLeftSidebar)) {
      setLeftPanel('widgets');
      if (!desktop) setShowLeftSidebar(false);
    } else {
      openPanel('layers');
    }
  };

  // Compatibilidade com a Toolbar antiga, que alterna um booleano.
  const setShowLayersModal: React.Dispatch<React.SetStateAction<boolean>> = value => {
    const next = typeof value === 'function' ? value(leftPanel === 'layers') : value;
    setLeftPanel(next ? 'layers' : 'widgets');
  };

  // ---- Barra superior ----

  const renameDisplay = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDisplay(previous => previous && previous.name !== trimmed ? { ...previous, name: trimmed } : previous);
  };

  const openPreview = async () => {
    // A janela abre já (antes de qualquer espera) para o navegador não bloqueá-la.
    const url = `${import.meta.env.BASE_URL}#/player/${display.slug || display.id}`;
    const popup = window.open('', '_blank');
    if (!popup) {
      toast.error('O navegador bloqueou a janela de pré-visualização. Libere pop-ups para este site.');
      return;
    }
    await queueRef.current?.flushNow();
    popup.location.href = url;
  };

  const goHome = () => {
    void queueRef.current?.flushNow();
    navigate('/');
  };

  // ---- Atalhos: copiar, colar, duplicar, apagar, mover, soltar a seleção ----

  shortcutRef.current = (event: KeyboardEvent) => {
    if (dialogOpen || event.defaultPrevented) return;
    if (isEditableTarget(event.target)) return;
    const el = event.target as HTMLElement | null;
    // Menus, listas e controles deslizantes usam essas teclas para si.
    if (el?.closest?.('[role="menu"],[role="listbox"],[role="dialog"],[role="slider"],[role="tablist"],[role="radiogroup"],[role="combobox"]')) return;

    const mod = event.ctrlKey || event.metaKey;
    if (mod) {
      if (event.altKey || event.shiftKey) return;
      const key = event.key.toLowerCase();
      if (key === 'c' && currentWidget) {
        if (window.getSelection()?.toString()) return;
        event.preventDefault();
        copyWidget();
      } else if (key === 'v' && clipboardRef.current) {
        event.preventDefault();
        pasteWidget();
      } else if (key === 'd' && currentWidget) {
        event.preventDefault();
        duplicateWidget();
      }
      return;
    }
    if (event.altKey) return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!currentWidget) return;
      event.preventDefault();
      if (currentWidget.data.locked) {
        toast.error('Este elemento está travado. Destrave nas camadas para apagar.', { duration: 2500 });
        return;
      }
      removeWidget(currentWidget.i);
      return;
    }
    const step = event.shiftKey ? 5 : 1;
    switch (event.key) {
      case 'ArrowLeft': if (currentWidget) { event.preventDefault(); nudgeWidget(-1, 0, step); } break;
      case 'ArrowRight': if (currentWidget) { event.preventDefault(); nudgeWidget(1, 0, step); } break;
      case 'ArrowUp': if (currentWidget) { event.preventDefault(); nudgeWidget(0, -1, step); } break;
      case 'ArrowDown': if (currentWidget) { event.preventDefault(); nudgeWidget(0, 1, step); } break;
      case 'Escape': if (selectedWidget) setSelectedWidget(null); break;
      default: break;
    }
  };

  const layersContent = leftPanel === 'layers' ? (
    <LayersModal
      display={display}
      setDisplay={setDisplay}
      activePageIdx={pageIdx}
      activePage={activePage}
      selectedWidget={selectedWidget}
      setSelectedWidget={setSelectedWidget}
      removeWidget={removeWidget}
      onEditProperties={() => { setShowRightSidebar(true); setShowLeftSidebar(false); }}
      onClose={() => setLeftPanel('widgets')}
    />
  ) : null;

  return (
    // Editor é app de tela cheia: altura exata da tela visível (100dvh), sem
    // rolar o documento; só os painéis internos rolam.
    <div className="h-tela flex flex-col bg-papel-3 overflow-hidden relative text-tinta font-sans">

      {/* Background Animation Selection Modal */}
      {showBgAnimModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-tinta/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div ref={bgAnimModalRef} role="dialog" aria-modal="true" className="bg-papel border border-borda-2 p-6 rounded-xl shadow-modal max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-tinta flex items-center gap-2">
                <MonitorPlay className="text-marca" /> Escolher Fundo Animado
              </h3>
              <button onClick={() => setShowBgAnimModal(false)} className="text-tinta-3 hover:text-tinta transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { id: '', label: 'Nenhum', desc: 'Remover animação' },
                { id: 'auto-weather', label: 'Automático (Clima)', desc: 'Muda com o tempo' },
                { id: 'gradient-flow', label: 'Fluxo Gradiente', desc: 'Cores mudando devagar' },
                { id: 'clouds', label: 'Céu e Nuvens', desc: 'Nuvens passando' },
                { id: 'rain', label: 'Chuva Digital', desc: 'Fundo escuro com chuva' },
                { id: 'snow', label: 'Neve Caindo', desc: 'Neve caindo devagar' },
                { id: 'fire', label: 'Chamas', desc: 'Fogo em movimento' },
                { id: 'tech-grid', label: 'Grid Tech', desc: 'Grade com linhas de luz' },
                { id: 'pulse-red', label: 'Alerta Vermelho', desc: 'Para avisos urgentes' },
                { id: 'pulse-blue', label: 'Pulso Azul', desc: 'Brilho azul pulsando' },
                { id: 'pulse-green', label: 'Pulso Verde', desc: 'Brilho verde pulsando' },
                { id: 'aurora', label: 'Aurora Boreal', desc: 'Faixas de luz no céu' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (selectedWidget) {
                      updateWidgetData(selectedWidget, { backgroundAnimation: option.id as WidgetData['backgroundAnimation'] });
                    } else {
                      updateActivePage(page => ({
                        ...page,
                        backgroundAnimation: option.id as Page['backgroundAnimation'],
                        backgroundImage: '',
                        backgroundVideoUrl: '',
                      }));
                    }
                    setShowBgAnimModal(false);
                  }}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all h-32 flex flex-col items-center justify-center p-4 ${
                    ((selectedWidget ? currentWidget?.data.backgroundAnimation : activePage.backgroundAnimation) || '') === option.id 
                    ? 'border-marca ring-2 ring-marca/30' 
                    : 'border-borda hover:border-borda-3 hover:scale-[1.02]'
                  }`}
                >
                  <div className={`absolute inset-0 z-0 opacity-30 group-hover:opacity-50 transition-opacity ${getBackgroundAnimationClass(option.id)}`}></div>
                  
                  <div className="relative z-10 text-center">
                    <span className="block font-bold text-tinta text-sm mb-1">{option.label}</span>
                    <span className="block text-[10px] text-tinta-2">{option.desc}</span>
                  </div>
                  
                  {((selectedWidget ? currentWidget?.data.backgroundAnimation : activePage.backgroundAnimation) || '') === option.id && (
                    <div className="absolute top-2 right-2 z-20 bg-marca text-white rounded-full p-1 shadow-card">
                      <CheckCircle2 size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isClearingScene && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-tinta/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div ref={clearSceneModalRef} role="dialog" aria-modal="true" className="bg-papel border border-borda-2 p-6 rounded-xl shadow-modal max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-tinta mb-2">Limpar Todos os Widgets?</h3>
            <p className="text-tinta-3 text-sm mb-6">Todos os widgets desta cena serão removidos permanentemente. Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsClearingScene(false)}
                className="px-4 py-2 rounded-lg text-tinta-2 hover:bg-papel-3 hover:text-tinta transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={clearAllWidgets}
                className="px-4 py-2 rounded-lg bg-danger hover:bg-danger/90 text-white transition-colors text-sm font-bold shadow-card"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirm Modal */}
      <PublishConfirmModal
        open={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={performSave}
        displayName={display.name}
        screenCount={linkedDevices.length}
        loading={isSaving}
      />

      {/* Scene Delete Modal */}
      {pageToDelete !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-tinta/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div ref={sceneDeleteModalRef} role="dialog" aria-modal="true" className="bg-papel border border-borda-2 p-6 rounded-xl shadow-modal max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-tinta mb-2">Excluir Cena {pageToDelete + 1}?</h3>
            <p className="text-tinta-3 text-sm mb-6">Esta ação não pode ser desfeita. Todos os widgets desta cena serão perdidos.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPageToDelete(null)}
                className="px-4 py-2 rounded-lg text-tinta-2 hover:bg-papel-3 hover:text-tinta transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmRemovePage}
                className="px-4 py-2 rounded-lg bg-danger hover:bg-danger/90 text-white transition-colors text-sm font-bold shadow-card"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Replace Scene Confirmation Modal */}
      {pendingReplace && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-tinta/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div ref={replaceModalRef} role="dialog" aria-modal="true" aria-labelledby="replace-scene-title" className="bg-papel border border-borda-2 p-6 rounded-xl shadow-modal max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
            <h3 id="replace-scene-title" className="text-lg font-bold text-tinta mb-2">Substituir o conteúdo da cena?</h3>
            <p className="text-tinta-3 text-sm mb-6">
              Os {activePage.layout.length} elementos desta cena serão substituídos. Novo conteúdo: {pendingReplace.title}. Se mudar de ideia, use Desfazer (Ctrl+Z).
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingReplace(null)}
                className="px-4 py-2 min-h-11 rounded-lg text-tinta-2 hover:bg-papel-3 hover:text-tinta transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => { replaceScene(pendingReplace); setPendingReplace(null); }}
                className="px-4 py-2 min-h-11 rounded-lg bg-marca hover:bg-marca/90 text-white transition-colors text-sm font-bold shadow-card"
              >
                Substituir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <Toolbar
        display={display}
        activePage={activePage}
        isSaving={isSaving}
        handleSave={handleSave}
        saveState={saveState}
        onPreview={openPreview}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onRename={renameDisplay}
        onOpenLayers={toggleLayers}
        showLeftSidebar={showLeftSidebar}
        setShowLeftSidebar={setShowLeftSidebar}
        setShowRightSidebar={setShowRightSidebar}
        setShowLayersModal={setShowLayersModal}
        showLayersModal={leftPanel === 'layers'}
        onGoHome={goHome}
      />

      <div className="hub-editor-workspace flex-1 flex overflow-hidden relative min-h-0">
        {/* Backdrop overlay for mobile sidebars */}
        {showLeftSidebar && (
          <div
            className="fixed inset-0 bg-tinta/50 z-50 md:hidden animate-in fade-in duration-200"
            onClick={() => { setShowLeftSidebar(false); setShowRightSidebar(false); }}
          />
        )}

        {/* Sidebar Left: Widget Library (e Camadas, no mesmo painel) */}
        <WidgetLibrary
          panel={leftPanel}
          onPanelChange={setLeftPanel}
          layersSlot={layersContent}
          currentWidget={currentWidget ?? null}
          updateWidgetData={updateWidgetData}
          onApplyTemplate={applyTemplate}
          onInsertImage={insertImageFromUrl}
          onApplyAiPreset={applyAiPreset}
          display={display}
          activePage={activePage}
          activePageIdx={pageIdx}
          setDisplay={setDisplay}
          selectedWidget={selectedWidget}
          setSelectedWidget={setSelectedWidget}
          addWidget={addWidget}
          setIsClearingScene={setIsClearingScene}
          setMediaLibraryConfig={setMediaLibraryConfig}
          setShowBgAnimModal={setShowBgAnimModal}
          showLeftSidebar={showLeftSidebar}
          setShowLeftSidebar={setShowLeftSidebar}
          planFeatures={planFeatures}
        />

        {/* Center column: canvas, then zoom and scenes below it */}
        <div className="hub-editor-center">
          <Canvas
            zoom={zoom}
            onZoomChange={setZoom}
            onFitScaleChange={setFitScale}
            showWallGuides={showWallGuides && wallMode}
            display={display}
            activePage={activePage}
            activePageIdx={pageIdx}
            setDisplay={setDisplay}
            selectedWidget={selectedWidget}
            setSelectedWidget={setSelectedWidget}
            containerWidth={geometry.width}
            rowHeight={40}
            containerRef={containerRef}
            handleLayoutChange={handleLayoutChange}
            removeWidget={removeWidget}
            quickToolbar={<QuickToolbar
              currentWidget={currentWidget}
              updateWidgetData={updateWidgetData}
              moreOpen={showRightSidebar}
              onMore={() => { setShowLeftSidebar(false); setShowRightSidebar(current => !current); }}
              onOpenPanel={openPanel}
              onLayer={moveLayer}
              onMedia={kind => {
                if (!currentWidget) return;
                const widgetId = currentWidget.i;
                setMediaLibraryConfig({ isOpen: true, allowedTypes: kind, onSelect: url => {
                  updateWidgetData(widgetId, kind === 'video' ? { videoUrl: url } : { url });
                  setMediaLibraryConfig(null);
                } });
              }}
              onRemove={() => selectedWidget && removeWidget(selectedWidget)}
              onDuplicate={duplicateWidget}
            />}
          />
          <div className="hub-scene-dock">
            <div className="hub-scene-dock__zoom">
              <ZoomControl
                zoom={zoom}
                fitScale={fitScale}
                onChange={setZoom}
                wall={display.wall}
                showGuides={showWallGuides}
                onToggleGuides={() => setShowWallGuides(current => !current)}
              />
            </div>
            <SceneTabs
              display={display}
              setDisplay={setDisplay}
              activePageIdx={pageIdx}
              onSelectPage={selectPage}
              removePage={removePage}
              showSeams={wallMode}
            />
          </div>
        </div>

        {/* Sidebar Right: Properties Panel */}
        {showRightSidebar && currentWidget && <PropertiesPanel
          selectedWidget={selectedWidget}
          currentWidget={currentWidget}
          updateWidgetData={updateWidgetData}
          removeWidget={removeWidget}
          showRightSidebar={showRightSidebar}
          setShowRightSidebar={setShowRightSidebar}
          setShowBgAnimModal={setShowBgAnimModal}
          setMediaLibraryConfig={setMediaLibraryConfig}
          setFullScreen={setFullScreen}
          activeMealDay={activeMealDay}
          setActiveMealDay={setActiveMealDay}
        />}
      </div>

      {mediaLibraryConfig?.isOpen && (
        <MediaLibrary
          onClose={() => setMediaLibraryConfig(null)}
          onSelect={mediaLibraryConfig.onSelect}
          allowedTypes={mediaLibraryConfig.allowedTypes}
        />
      )}
    </div>
  );
};

export default Editor;
