
export enum WidgetType {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  IFRAME = 'IFRAME',
  WEATHER = 'WEATHER',
  CLOCK = 'CLOCK',
  VIDEO = 'VIDEO',
  RSS = 'RSS',
  CALENDAR = 'CALENDAR',
  GIF = 'GIF',
  FULL_INFO = 'FULL_INFO',
  NOTES = 'NOTES',
  TODO = 'TODO',
  COUNTDOWN = 'COUNTDOWN',
  CHORES = 'CHORES',
  MEAL_PLAN = 'MEAL_PLAN',
  MARKET_WATCH = 'MARKET_WATCH',
  BROWSER_SNAPSHOT = 'BROWSER_SNAPSHOT',
  GOOGLE_DOCS = 'GOOGLE_DOCS',
  OFFICE_DOCS = 'OFFICE_DOCS',
  POWER_BI = 'POWER_BI',
  EMBED_HTML = 'EMBED_HTML',
  AIRTABLE = 'AIRTABLE',
  PDF_DOCUMENT = 'PDF_DOCUMENT',
  /** Ícone vetorial editável (cor, traço, efeitos). Reestruturação 30/10. */
  ICON = 'ICON',
  /** Forma vetorial editável (retângulo, círculo, selo...). */
  SHAPE = 'SHAPE',
  /** Motion design em HTML/CSS/JS com campos editáveis, isolado em iframe. */
  MOTION = 'MOTION'
}

/** Estado do salvamento automático mostrado na barra do editor. */
export interface EditorSaveState {
  state: 'idle' | 'pending' | 'saving' | 'saved' | 'offline' | 'error';
  /** Último rascunho guardado com sucesso (no servidor ou, offline, no aparelho). */
  lastSavedAt?: number;
  /** true quando o último rascunho ficou só no aparelho (sem internet). */
  localOnly?: boolean;
}

/** Efeitos visuais comuns a texto, ícone, forma e imagem. */
export interface WidgetEffects {
  shadow?: { color?: string; blur?: number; x?: number; y?: number };
  outline?: { color?: string; width?: number };
  /** Bloco sólido deslocado atrás do elemento (efeito "carimbo"). */
  block?: { color?: string; offset?: number };
  /** Coloca o elemento dentro de um bloco de fundo. */
  container?: { shape: 'none' | 'square' | 'rect' | 'circle' | 'pill'; color?: string; padding?: number };
}

export interface RssFeedConfig {
  url: string;
  category?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderWidth?: string;
  borderRadius?: string;
  borderColor?: string;
}

export interface WidgetData {
  url?: string;
  videoUrl?: string;
  rssUrl?: string; // URL do Feed RSS (mantido para compatibilidade)
  rssFeeds?: RssFeedConfig[]; // Novo campo para múltiplos feeds
  calendarId?: string; // ID do Google Calendar
  content?: string;
  color?: string;
  fontSize?: string;
  city?: string;
  width?: string; // Image width in px
  height?: string; // Image height in px
  model?: string; // 'simple', 'detailed', 'minimal', etc.
  videoConfig?: {
    autoplay?: boolean;
    mute?: boolean;
    loop?: boolean;
    controls?: boolean;
    youtubeQuality?: string;
  };
  calendarConfig?: {
    transparent?: boolean;
    backgroundColor?: string;
    theme?: 'light' | 'dark' | 'glass' | 'minimal' | 'neon' | 'card';
    customTitle?: string;
    showTitle?: boolean;
    titleColor?: string;
    titleSize?: string;
  };
  imageConfig?: {
    objectFit?: 'cover' | 'contain' | 'fill';
    scale?: number;
    /** Filtro pronto (preto e branco, sépia, vintage...). */
    filter?: 'none' | 'pb' | 'sepia' | 'vintage' | 'quente' | 'frio' | 'vivido' | 'suave' | 'drama' | 'noite';
    /** Ajustes finos em porcentagem (100 = original). */
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
    /** Moldura/recorte da foto. */
    frame?: 'none' | 'rounded' | 'circle' | 'arch' | 'blob' | 'polaroid';
  };
  iconConfig?: {
    /** Nome do ícone no catálogo de IconWidget. */
    name: string;
    color?: string;
    strokeWidth?: number;
    /** Estilo do ícone: traço (flat) ou preenchido. */
    variant?: 'stroke' | 'filled';
  };
  shapeConfig?: {
    kind: 'rect' | 'rounded' | 'circle' | 'pill' | 'triangle' | 'star' | 'burst' | 'line' | 'arrow';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  motionConfig?: {
    /** Id do preset em presets/motionPresets.ts. */
    presetId: string;
    /** Valores dos campos editáveis do preset (texto, preço, link de imagem...). */
    fields?: Record<string, string>;
    /** Cores editáveis do preset. */
    colors?: Record<string, string>;
    /** Velocidade 0,5 a 2 (1 = normal). */
    speed?: number;
  };
  effects?: WidgetEffects;
  /** Opacidade do elemento, 0 a 1. */
  opacity?: number;
  /** Rotação em graus. */
  rotation?: number;
  /** Elemento travado: não move nem redimensiona no editor. */
  locked?: boolean;
  iframeConfig?: {
    interactive?: boolean;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    viewportWidth?: number;
    viewportHeight?: number;
  };
  rssConfig?: {
    layout?: 'full-image' | 'split' | 'ticker';
    feedMode?: 'default' | 'require-image' | 'text-only'; // Novo modo de feed
    showImage?: boolean; // Mantido para retrocompatibilidade
    fontSize?: string;
    showFullContent?: boolean;
    enableMarquee?: boolean;
    marqueeSpeed?: number;
    fontFamily?: string;
    textColor?: string;
    titleColor?: string;
    titleSize?: string;
    descriptionSize?: string;
  };
  scale?: number; // General scale factor for the widget content
  backgroundImage?: string; // Background image for the widget
  weatherConfig?: {
    baseFontSize?: string; // e.g., '1cqw' or '16px' - controls the scale of the whole widget
    showCityImage?: boolean;
  };
  textConfig?: {
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string; // 'normal', 'bold', '100'-'900'
    fontStyle?: string; // 'normal', 'italic'
    textAlign?: 'left' | 'center' | 'right';
    animation?: 'none' | 'fade' | 'slide' | 'typewriter' | 'pulse' | 'bounce';
    textDecoration?: 'none' | 'underline';
    /** Multiplicador da altura de linha (1 a 2,5). */
    lineHeight?: number;
    /** Espaço entre letras em em (-0,1 a 0,5). */
    letterSpacing?: number;
    /** Hierarquia escolhida ao adicionar (Título 1, 2, 3 ou texto comum). */
    textStyle?: 'h1' | 'h2' | 'h3' | 'body';
    /** Efeito pronto: o texto pode mudar e o efeito continua. */
    effect?: 'none' | '3d' | 'neon' | 'contorno' | 'sombra-longa' | 'gradiente' | 'retro' | 'destaque' | 'carimbo';
    effectColor?: string;
    effectColor2?: string;
  };
  backgroundAnimation?: 'none' | 'auto-weather' | 'gradient-flow' | 'clouds' | 'rain' | 'snow' | 'fire' | 'tech-grid' | 'pulse-red' | 'pulse-blue' | 'pulse-green' | 'aurora';
  transparentBackground?: boolean;
  backgroundColor?: string;
  textSize?: number;
  numberSize?: number;
  zIndex?: number; // Added to handle layering/overlapping
  notesConfig?: {
    fontFamily?: string;
    fontSize?: string;
    textColor?: string;
    backgroundColor?: string;
    paperTheme?: 'glass' | 'yellow-sticky' | 'purple-haze' | 'neon-glow';
  };
  todoConfig?: {
    title?: string;
    items: { id: string; text: string; done: boolean }[];
  };
  countdownConfig?: {
    title?: string;
    targetDate: string;
    expiredMessage?: string;
    theme?: 'neon' | 'glass' | 'minimal' | 'bold-gradient';
  };
  choresConfig?: {
    title?: string;
    items: { id: string; chore: string; assignee: string; day?: string; done?: boolean }[];
  };
  mealPlanConfig?: {
    title?: string;
    days: {
      [day: string]: {
        breakfast?: string;
        lunch?: string;
        dinner?: string;
        snacks?: string;
      }
    };
  };
  marketWatchConfig?: {
    title?: string;
    symbols: string[];
    layout?: 'grid' | 'list' | 'ticker';
  };
  browserSnapshotConfig?: {
    url: string;
    updateIntervalMinutes?: number;
  };
  googleDocsConfig?: {
    url: string;
    docType: 'document' | 'spreadsheet' | 'presentation' | 'form';
  };
  officeDocsConfig?: {
    url: string;
    docType: 'word' | 'excel' | 'powerpoint';
  };
  powerBiConfig?: {
    embedUrl: string;
  };
  embedWebsiteConfig?: {
    url: string;
    interactive?: boolean;
  };
  embedHtmlConfig?: {
    html: string;
  };
  airtableConfig?: {
    shareUrl: string;
  };
  pdfDocumentConfig?: {
    pdfUrl: string;
  };
  fillContainer?: boolean;
  autoSize?: boolean;
  contentAlignment?: 'start' | 'center' | 'end' | 'stretch';
  padding?: string;
  margin?: string;
  fullScreenMode?: boolean;
  fitContainerMode?: 'none' | 'cover' | 'contain' | 'stretch';
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: WidgetType;
  data: WidgetData;
}

export interface Page {
  id: string;
  order: number;
  duration: number; // in seconds
  layout: LayoutItem[];
  backgroundImage?: string;
  backgroundVideoUrl?: string; // New property for full-screen video background
  backgroundVideoMuted?: boolean;
  backgroundVideoQuality?: string; // e.g., 'highres', 'hd1080', 'hd720', 'large', 'medium', 'small'
  backgroundAnimation?: 'none' | 'auto-weather' | 'gradient-flow' | 'clouds' | 'rain' | 'snow' | 'fire' | 'tech-grid' | 'pulse-red' | 'pulse-blue' | 'pulse-green' | 'aurora';
  backgroundFit?: 'cover' | 'contain' | 'fill';
  transitionType?: 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down';
  transitionDuration?: number; // in ms
  broadcast_id?: string;
  start_time?: string;
  end_time?: string;
  is_permanent?: boolean;
}

export interface Device {
  id: string;
  pairing_code: string;
  display_id: string | null;
  status: 'pending' | 'linked';
  last_seen: number;
  online: boolean;
  name?: string;
  organizationId?: string | null;
}

export interface Display {
  id: string;
  name: string;
  /** Slug legível e ADIVINHÁVEL. Continua válido, mas não use em link novo. */
  slug: string;
  /**
   * Endereço público não adivinhável do player. Preferir este ao `slug` ao
   * montar a URL da TV: com o slug, quem chuta "loja-centro" abre a tela do
   * cliente. Pode vir nulo em tela criada antes de 2026-08-29.
   */
  publicToken?: string | null;
  pages: Page[];
  updatedAt: number;
  coverImage?: string;
  /** Orientação de CADA TV. Num videowall, todas as TVs seguem esta orientação. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Videowall ("Várias TVs", só Enterprise): várias TVs formam uma tela só.
   * Ausente ou 1×1 = tela comum. Guardado no wrapper de pages, sem coluna nova.
   */
  wall?: DisplayWall | null;
  organizationId?: string | null;
}

export interface DisplayWall {
  /** TVs lado a lado. */
  cols: number;
  /** TVs uma acima da outra. */
  rows: number;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

// ==============================================================================
// BILLING / SaaS
// ==============================================================================

export type PlanInterval = 'month' | 'year';

/** Plano comercial devolvido por `GET /api/plans` (rota pública). */
export interface Plan {
  id: string;
  name: string;
  slug?: string;
  /** Preço em centavos (0 = gratuito/trial). */
  priceCents: number;
  currency?: string;
  interval?: PlanInterval;
  /** Limites do plano — `null` significa ilimitado. */
  maxDisplays?: number | null;
  maxDevices?: number | null;
  maxUsers?: number | null;
  maxOrganizations?: number | null;
  features?: string[];
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

/** Consumo atual da organização, para comparar com os limites do plano. */
export interface SubscriptionUsage {
  displays: number;
  devices: number;
  users: number;
  organizations?: number;
}

export interface Subscription {
  id: string;
  organizationId: string;
  status: SubscriptionStatus;
  /** Plano associado. Pode vir ausente se o backend só mandar `planId`. */
  plan?: Plan | null;
  planId?: string;
  planName?: string;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  createdAt?: string;
  canceledAt?: string | null;
}

/** Resposta de `GET /api/billing/subscription`. */
export interface SubscriptionState {
  subscription: Subscription;
  usage: SubscriptionUsage;
  /** Dias restantes de trial. `null`/ausente quando não está em trial. */
  trialDaysRemaining?: number | null;
}

/** Corpo enviado para `POST /api/signup`. */
export interface SignupPayload {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

/** Resposta de `POST /api/signup` — mesmo formato do login. */
export interface SignupResponse {
  token: string;
  user: User;
}

export interface OrganizationReport {
  organizationId: string;
  displaysCount: number;
  devicesOnline: number;
  devicesOffline: number;
  broadcastsCount: number;
  period: { startDate: string | null; endDate: string | null };
}

export interface User {
  id: string;
  username: string;
  name?: string;
  email?: string; // Novo campo para login robusto
  role: 'master' | 'admin' | 'user';
  lastLogin?: string | null; // null = nunca acessou
  /** Organização (tenant) à qual o usuário pertence. `master` opera acima dos tenants. */
  organizationId?: string | null;
  /**
   * A senha atual ainda é a provisória que o servidor gerou e mandou em texto
   * claro por e-mail (convite ou compra no checkout). Enquanto for `true`, o
   * painel bloqueia a navegação e exige a troca — ver `ProtectedRoute` em
   * `App.tsx`. Vem tanto de `POST /auth/login` quanto de `GET /auth/me`, então
   * uma sessão já aberta também cai na exigência ao recarregar.
   *
   * Opcional porque respostas antigas/legadas do backend podem não trazer o
   * campo; `undefined` é tratado como "não precisa trocar".
   */
  mustChangePassword?: boolean;
  // Senha removida da interface frontend por segurança
}

export interface Broadcast {
  id: string;
  name: string;
  page: Page;
  start_time: string; // ISO string
  end_time: string; // ISO string
  is_permanent?: boolean;
  display_ids: string[]; // Targeted displays
  active: boolean;
  created_at: number;
  created_by?: string;
  orientation?: 'horizontal' | 'vertical';
  organizationId?: string | null;
}

/** Painéis que abrem na coluna esquerda do editor (estilo Canva). */
export type EditorLeftPanel = 'widgets' | 'templates' | 'text' | 'text-effects' | 'effects' | 'image-filters' | 'icons' | 'shapes' | 'motion' | 'ai' | 'ai-edit' | 'layers';
