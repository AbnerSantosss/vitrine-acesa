import { WidgetType } from '../../types';

/**
 * Nome de cada tipo de elemento em português, usado na etiqueta de seleção do canvas
 * e no título do painel "Configurações do ...". `de` é a preposição já contraída com o
 * artigo ("do", "da", "dos", "das"), para o título não sair no gênero errado.
 */
interface NomeDoElemento {
  /** Como aparece sozinho, com inicial maiúscula ("Relógio"). */
  nome: string;
  /** Preposição com artigo ("do", "da", "das"). */
  de: 'do' | 'da' | 'dos' | 'das';
  /** Nome em minúsculas para entrar em frase ("relógio"). */
  frase: string;
}

const NOMES: Record<WidgetType, NomeDoElemento> = {
  [WidgetType.IMAGE]: { nome: 'Imagem', de: 'da', frase: 'imagem' },
  [WidgetType.VIDEO]: { nome: 'Vídeo', de: 'do', frase: 'vídeo' },
  [WidgetType.TEXT]: { nome: 'Texto', de: 'do', frase: 'texto' },
  [WidgetType.GIF]: { nome: 'GIF', de: 'do', frase: 'GIF' },
  [WidgetType.IFRAME]: { nome: 'Site', de: 'do', frase: 'site' },
  [WidgetType.CLOCK]: { nome: 'Relógio', de: 'do', frase: 'relógio' },
  [WidgetType.WEATHER]: { nome: 'Clima', de: 'do', frase: 'clima' },
  [WidgetType.FULL_INFO]: { nome: 'Painel completo', de: 'do', frase: 'painel completo' },
  [WidgetType.RSS]: { nome: 'Notícias', de: 'das', frase: 'notícias' },
  [WidgetType.CALENDAR]: { nome: 'Agenda', de: 'da', frase: 'agenda' },
  [WidgetType.NOTES]: { nome: 'Notas', de: 'das', frase: 'notas' },
  [WidgetType.TODO]: { nome: 'Tarefas', de: 'das', frase: 'tarefas' },
  [WidgetType.COUNTDOWN]: { nome: 'Contador', de: 'do', frase: 'contador' },
  [WidgetType.CHORES]: { nome: 'Deveres', de: 'dos', frase: 'deveres' },
  [WidgetType.MEAL_PLAN]: { nome: 'Cardápio', de: 'do', frase: 'cardápio' },
  [WidgetType.MARKET_WATCH]: { nome: 'Cotações', de: 'das', frase: 'cotações' },
  [WidgetType.BROWSER_SNAPSHOT]: { nome: 'Captura de site', de: 'da', frase: 'captura de site' },
  [WidgetType.GOOGLE_DOCS]: { nome: 'Google Docs', de: 'do', frase: 'Google Docs' },
  [WidgetType.OFFICE_DOCS]: { nome: 'Office', de: 'do', frase: 'Office' },
  [WidgetType.POWER_BI]: { nome: 'Power BI', de: 'do', frase: 'Power BI' },
  [WidgetType.AIRTABLE]: { nome: 'Airtable', de: 'do', frase: 'Airtable' },
  [WidgetType.PDF_DOCUMENT]: { nome: 'PDF', de: 'do', frase: 'PDF' },
  [WidgetType.EMBED_HTML]: { nome: 'HTML', de: 'do', frase: 'HTML' },
  [WidgetType.ICON]: { nome: 'Ícone', de: 'do', frase: 'ícone' },
  [WidgetType.SHAPE]: { nome: 'Forma', de: 'da', frase: 'forma' },
  [WidgetType.MOTION]: { nome: 'Motion', de: 'do', frase: 'motion' },
};

/** "Relógio", "Imagem"... Vazio quando o tipo não tem rótulo. */
export const nomeDoElemento = (type: WidgetType | undefined): string => (type && NOMES[type]?.nome) || '';

/** "Configurações do relógio", "Configurações da imagem". Sem rótulo, cai em "Configurações do elemento". */
export const tituloDasConfiguracoes = (type: WidgetType | undefined): string => {
  const item = type ? NOMES[type] : undefined;
  return item ? `Configurações ${item.de} ${item.frase}` : 'Configurações do elemento';
};
