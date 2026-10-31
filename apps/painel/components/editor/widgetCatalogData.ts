import { WidgetType, type WidgetData } from '../../types';
import { MOTION_PRESETS, getMotionDefaults } from './presets/motionPresets';

export interface WidgetPreset {
  id: string;
  title: string;
  description: string;
  sample: string;
  tone?: 'blue' | 'teal' | 'warm' | 'purple' | 'dark';
  image?: string;
  data: () => Partial<WidgetData>;
}

export interface WidgetCategory {
  title: string;
  icon: string;
  description: string;
  media?: 'image' | 'video';
  linkLabel?: string;
  linkPlaceholder?: string;
  linkHelp?: string;
  requiresLink?: boolean;
  blank: Partial<WidgetData>;
  presets: WidgetPreset[];
}

export const catalogAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const imageData = (file: string): Partial<WidgetData> => ({ url: catalogAsset(`exemplos/${file}`), fillContainer: false, fitContainerMode: 'contain', imageConfig: { objectFit: 'contain', scale: 1 } });
const textData = (content: string, color: string, fontSize = '48px'): Partial<WidgetData> => ({ content, color, transparentBackground: true, textConfig: { fontFamily: 'Arial', fontSize, fontWeight: '700', textAlign: 'center', animation: 'none' } });
const nextDate = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 16);
const tasks = (title: string, lines: string[]): Partial<WidgetData> => ({ todoConfig: { title, items: lines.map((text, i) => ({ id: `task-${i + 1}`, text, done: false })) } });
const htmlCard = (eyebrow: string, title: string, detail: string, background: string) => ({ embedHtmlConfig: { html: `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:${background};color:#fff;font-family:Arial,sans-serif}main{padding:8vw;width:100%}small{font-size:3vw;letter-spacing:.16em}h1{font-size:10vw;line-height:1.04;margin:.3em 0}p{font-size:4vw;line-height:1.5}</style><main><small>${eyebrow}</small><h1>${title}</h1><p>${detail}</p></main></html>` } });

const stretch = { fillContainer: true, contentAlignment: 'stretch' as const, transparentBackground: true };
const iconData = (name: string, color: string, extra: Partial<WidgetData> = {}, variant: 'stroke' | 'filled' = 'stroke'): Partial<WidgetData> => ({ ...stretch, iconConfig: { name, color, strokeWidth: 2, variant }, ...extra });
const shapeData = (kind: NonNullable<WidgetData['shapeConfig']>['kind'], fill: string, extra: Partial<WidgetData> = {}, stroke?: string, strokeWidth?: number): Partial<WidgetData> => ({ ...stretch, shapeConfig: { kind, fill, stroke, strokeWidth }, ...extra });
const tones = ['blue', 'teal', 'warm', 'purple', 'dark'] as const;
const motionCatalogPresets: WidgetPreset[] = MOTION_PRESETS.map((p, index) => ({
  id: p.id,
  title: p.title,
  description: p.description || 'Animação com textos e cores editáveis',
  sample: p.title,
  tone: tones[index % tones.length],
  data: () => ({ ...stretch, motionConfig: { presetId: p.id, ...getMotionDefaults(p.id), speed: 1 } }),
}));
/** Foto de banco de imagens (Unsplash) em dois tamanhos: miniatura e cena. */
const photo = (id: string, title: string, segment: string, sample: string): WidgetPreset => {
  const base = `https://images.unsplash.com/photo-${id}`;
  return {
    id: `foto-${id}`, title, description: `${segment} • foto, troque o enquadramento ou aplique filtros`, sample,
    image: `${base}?w=480&q=70`,
    data: () => ({ url: `${base}?w=1600&q=80`, fillContainer: true, fitContainerMode: 'cover', imageConfig: { objectFit: 'cover', scale: 1 } }),
  };
};

// These are actual editable widget values. Preview labels below are illustrative,
// while clocks, weather, feeds and integrations use their existing live renderers.
export const widgetCatalog: Record<WidgetType, WidgetCategory> = {
  [WidgetType.ICON]: { title: 'Ícones', icon: 'image', description: 'Ícones simples com cor e efeitos editáveis.', blank: { iconConfig: { name: 'star', color: '#ffffff', strokeWidth: 2 }, transparentBackground: true }, presets: [
      { id: 'icone-loja-bloco', title: 'Loja em círculo', description: 'Ícone dentro de um círculo colorido', sample: 'Loja', tone: 'teal', data: () => iconData('loja', '#ffffff', { effects: { container: { shape: 'circle', color: '#02c2cd', padding: 18 } } }) },
      { id: 'icone-zap-bloco', title: 'WhatsApp em bloco', description: 'Ícone em quadrado verde', sample: 'WhatsApp', tone: 'teal', data: () => iconData('whatsapp', '#ffffff', { effects: { container: { shape: 'square', color: '#16a34a', padding: 16 } } }) },
      { id: 'icone-desconto', title: 'Selo de desconto', description: 'Preenchido, com sombra suave', sample: 'Desconto', tone: 'warm', data: () => iconData('desconto', '#fbbf24', { effects: { shadow: { color: 'rgba(0,0,0,.45)', blur: 14, x: 0, y: 6 } } }, 'filled') },
      { id: 'icone-fogo', title: 'Oferta quente', description: 'Chama preenchida com contorno', sample: 'Quente', tone: 'warm', data: () => iconData('fogo', '#f97316', { effects: { outline: { color: '#ffffff', width: 3 } } }, 'filled') },
      { id: 'icone-wifi-pilula', title: 'Wi-Fi em pílula', description: 'Ícone em bloco arredondado', sample: 'Wi-Fi', tone: 'blue', data: () => iconData('wifi', '#ffffff', { effects: { container: { shape: 'pill', color: '#0ea5e9', padding: 12 } } }) },
      { id: 'icone-bloco', title: 'Estrela com bloco', description: 'Efeito de bloco deslocado atrás', sample: 'Destaque', tone: 'purple', data: () => iconData('star', '#fde047', { effects: { block: { color: '#1e1b4b', offset: 6 } } }, 'filled') },
    ] },
  [WidgetType.SHAPE]: { title: 'Formas', icon: 'image', description: 'Formas para fundos, selos e destaques.', blank: { shapeConfig: { kind: 'rounded', fill: '#02c2cd' }, transparentBackground: true }, presets: [
      { id: 'forma-selo', title: 'Selo em estrela', description: 'Serrilhado, para preço ou aviso', sample: 'Selo', tone: 'warm', data: () => shapeData('burst', '#e63946', {}, '#ffd166', 3) },
      { id: 'forma-faixa', title: 'Faixa de oferta', description: 'Pílula para texto por cima', sample: 'Faixa', tone: 'purple', data: () => shapeData('pill', '#7c3aed') },
      { id: 'forma-cartao', title: 'Cartão arredondado', description: 'Fundo para título e preço', sample: 'Cartão', tone: 'dark', data: () => shapeData('rounded', '#0b1b2b', {}, '#02c2cd', 2) },
      { id: 'forma-circulo', title: 'Círculo de preço', description: 'Destaque redondo', sample: 'Círculo', tone: 'teal', data: () => shapeData('circle', '#02c2cd') },
      { id: 'forma-seta', title: 'Seta de destaque', description: 'Aponta para o item', sample: 'Seta', tone: 'warm', data: () => shapeData('arrow', '#fbbf24') },
      { id: 'forma-linha', title: 'Linha divisória', description: 'Separa blocos da tela', sample: 'Linha', tone: 'blue', data: () => shapeData('line', '#ffffff', {}, undefined, 4) },
      { id: 'forma-estrela', title: 'Estrela', description: 'Para notas e destaques', sample: 'Estrela', tone: 'warm', data: () => shapeData('star', '#fde047') },
      { id: 'forma-triangulo', title: 'Triângulo', description: 'Detalhe decorativo', sample: 'Triângulo', tone: 'purple', data: () => shapeData('triangle', '#f43f5e') },
    ] },
  [WidgetType.MOTION]: { title: 'Motion design', icon: 'video', description: 'Animações prontas com texto, preço e cores editáveis.', blank: { ...stretch, motionConfig: { presetId: 'oferta-pulso', ...getMotionDefaults('oferta-pulso'), speed: 1 } }, presets: motionCatalogPresets },
  [WidgetType.IMAGE]: {
    title: 'Imagens', icon: 'image', description: 'Envie uma foto, escolha da biblioteca ou comece com uma arte.', media: 'image', linkLabel: 'Link de uma imagem', linkPlaceholder: 'https://.../imagem.jpg', blank: { url: '', fillContainer: false, fitContainerMode: 'contain', imageConfig: { objectFit: 'contain', scale: 1 } },
    presets: [
      { id: 'cafe', title: 'Oferta da padaria', description: 'Arte pronta • ajuste o enquadramento', sample: 'Café da manhã', image: catalogAsset('exemplos/arte-cafe.jpg'), data: () => imageData('arte-cafe.jpg') },
      { id: 'moda', title: 'Vitrine de moda', description: 'Arte pronta • ajuste o enquadramento', sample: 'Nova coleção', image: catalogAsset('exemplos/arte-moda.jpg'), data: () => imageData('arte-moda.jpg') },
      { id: 'clinica', title: 'Recepção da clínica', description: 'Foto de ambiente', sample: 'Bem-vindo', image: catalogAsset('exemplos/login-clinica.jpg'), data: () => imageData('login-clinica.jpg') },
      photo('1509440159596-0249088772ff', 'Pães rústicos', 'Padarias', 'Pães'),
      photo('1555507036-ab1f4038808a', 'Croissant', 'Padarias', 'Croissant'),
      photo('1517433670267-08bbd4be890f', 'Vitrine da padaria', 'Padarias', 'Vitrine'),
      photo('1486427944299-d1955d23e34d', 'Cupcakes', 'Padarias', 'Doces'),
      photo('1513104890138-7c749659a591', 'Pizza fatiada', 'Pizzarias', 'Pizza'),
      photo('1565299624946-b28f40a0ae38', 'Pizza com manjericão', 'Pizzarias', 'Pizza'),
      photo('1574071318508-1cdbab80d002', 'Pizza margherita', 'Pizzarias', 'Margherita'),
      photo('1568901346375-23c9450c58cd', 'Hambúrguer artesanal', 'Lanchonetes', 'Burger'),
      photo('1550547660-d9450f859349', 'Hambúrgueres e refrigerante', 'Lanchonetes', 'Burger'),
      photo('1571091718767-18b5b1457add', 'Hambúrguer completo', 'Lanchonetes', 'Burger'),
      photo('1528735602780-2552fd46c7af', 'Sanduíche prensado', 'Lanchonetes', 'Sanduíche'),
      photo('1414235077428-338989a2e8c0', 'Prato servido', 'Restaurantes', 'Prato'),
      photo('1517248135467-4c7edcad34c4', 'Salão do restaurante', 'Restaurantes', 'Salão'),
      photo('1546069901-ba9599a7e63c', 'Salada completa', 'Restaurantes', 'Salada'),
      photo('1504674900247-0877df9cc836', 'Prato do chef', 'Restaurantes', 'Prato'),
      photo('1565958011703-44f9829ba187', 'Sobremesa de frutas vermelhas', 'Restaurantes', 'Sobremesa'),
      photo('1542838132-92c53300491e', 'Hortifruti', 'Supermercados', 'Hortifruti'),
      photo('1604719312566-8912e9227c6a', 'Corredor do supermercado', 'Supermercados', 'Corredor'),
      photo('1578916171728-46686eac8d58', 'Gôndolas', 'Supermercados', 'Gôndola'),
      photo('1441986300917-64674bd600d8', 'Loja de roupas', 'Lojas', 'Loja'),
      photo('1445205170230-053b83016050', 'Arara de roupas', 'Lojas', 'Arara'),
      photo('1441984904996-e0b6ba687e04', 'Vitrine', 'Lojas', 'Vitrine'),
      photo('1483985988355-763728e1935b', 'Sacolas de compras', 'Lojas', 'Compras'),
      photo('1519567241046-7f570eee3ce6', 'Corredor do shopping', 'Shoppings', 'Shopping'),
    ],
  },
  [WidgetType.VIDEO]: {
    title: 'Vídeos', icon: 'video', description: 'Adicione um vídeo seu ou use um fundo em movimento.', media: 'video', linkLabel: 'Link do vídeo ou YouTube', linkPlaceholder: 'https://.../video.mp4', blank: { videoUrl: '', videoConfig: { autoplay: true, mute: true, loop: true, controls: false } },
    presets: [
      { id: 'landscape', title: 'Movimento horizontal', description: 'Vídeo local • sem som • em repetição', sample: '16:9\nMovimento azul', tone: 'blue', data: () => ({ videoUrl: catalogAsset('backgrounds/bg_desktop.mp4'), videoConfig: { autoplay: true, mute: true, loop: true, controls: false } }) },
      { id: 'portrait', title: 'Movimento vertical', description: 'Vídeo local • para composição vertical', sample: '9:16\nMovimento azul', tone: 'teal', data: () => ({ videoUrl: catalogAsset('backgrounds/BG-mobile.mp4'), videoConfig: { autoplay: true, mute: true, loop: true, controls: false } }) },
    ],
  },
  [WidgetType.TEXT]: {
    title: 'Textos', icon: 'text', description: 'Escolha um estilo e edite as palavras direto nas opções do bloco.', blank: { ...textData('Seu texto aqui', '#ffffff') },
    presets: [
      { id: 'headline', title: 'Título em destaque', description: 'Texto grande, branco e centralizado', sample: 'Sua próxima\nboa ideia.', tone: 'dark', data: () => textData('Sua próxima\nboa ideia.', '#ffffff', '64px') },
      { id: 'offer', title: 'Oferta do dia', description: 'Chamada em amarelo para fundo escuro', sample: 'SÓ HOJE\nAté 30% OFF', tone: 'warm', data: () => textData('SÓ HOJE\nAté 30% OFF', '#fbbf24', '56px') },
      { id: 'welcome', title: 'Boas-vindas', description: 'Turquesa e alinhamento à esquerda', sample: 'Que bom\nter você aqui.', tone: 'teal', data: () => ({ ...textData('Que bom\nter você aqui.', '#02c2cd', '48px'), textConfig: { fontFamily: 'Arial', fontSize: '48px', fontWeight: '700', textAlign: 'left', animation: 'none' } }) },
    ],
  },
  [WidgetType.GIF]: {
    title: 'GIFs', icon: 'gif', description: 'Envie um GIF ou cole o endereço da animação que você quer exibir.', media: 'image', linkLabel: 'Link direto do GIF', linkPlaceholder: 'https://.../animacao.gif', requiresLink: true, blank: { url: '', fillContainer: false, fitContainerMode: 'contain', imageConfig: { objectFit: 'contain', scale: 1 } },
    presets: [
      { id: 'fit', title: 'Animação completa', description: 'Preserva a arte inteira sem cortar', sample: 'GIF\nArte inteira', tone: 'purple', data: () => ({ fillContainer: false, fitContainerMode: 'contain', imageConfig: { objectFit: 'contain', scale: 1 } }) },
      { id: 'cover', title: 'Preencher o bloco', description: 'A animação ocupa todo o espaço', sample: 'GIF\nEm destaque', tone: 'teal', data: () => ({ fillContainer: false, fitContainerMode: 'cover', imageConfig: { objectFit: 'cover', scale: 1 } }) },
    ],
  },
  [WidgetType.IFRAME]: {
    title: 'Páginas da web', icon: 'web', description: 'Mostre uma página que permita ser incorporada.', linkLabel: 'Endereço da página', linkPlaceholder: 'https://seusite.com.br', linkHelp: 'Alguns sites bloqueiam a exibição dentro de outras páginas.', requiresLink: true, blank: { url: '', embedWebsiteConfig: { url: '', interactive: false } },
    presets: [
      { id: 'display', title: 'Página na TV', description: 'Exibição sem cliques acidentais', sample: 'www.\nSua página', tone: 'blue', data: () => ({ iframeConfig: { interactive: false, scale: 1 }, embedWebsiteConfig: { url: '', interactive: false } }) },
      { id: 'interactive', title: 'Totem interativo', description: 'Permite navegar em telas de toque', sample: 'Toque\npara explorar', tone: 'teal', data: () => ({ iframeConfig: { interactive: true, scale: 1 }, embedWebsiteConfig: { url: '', interactive: true } }) },
    ],
  },
  [WidgetType.CLOCK]: {
    title: 'Relógios', icon: 'clock', description: 'O horário se atualiza sozinho. A cidade pode ser alterada depois.', blank: { model: 'standard', city: 'São Paulo' },
    presets: [
      { id: 'minimal', title: 'Digital essencial', description: 'Só o horário, com leitura fácil', sample: '09:41', tone: 'dark', data: () => ({ model: 'minimal', city: 'São Paulo' }) },
      { id: 'date', title: 'Hora e data', description: 'Ideal para recepções e salas de espera', sample: '09:41\nQUINTA-FEIRA', tone: 'blue', data: () => ({ model: 'date-time', city: 'São Paulo' }) },
      { id: 'analog', title: 'Relógio de ponteiros', description: 'Mostrador analógico', sample: '◷', tone: 'teal', data: () => ({ model: 'analog', city: 'São Paulo' }) },
    ],
  },
  [WidgetType.WEATHER]: {
    title: 'Clima', icon: 'weather', description: 'Escolha o visual. Depois, informe a cidade nas opções do bloco.', blank: { city: 'São Paulo', model: 'simple' },
    presets: [
      { id: 'today', title: 'Tempo de agora', description: 'Temperatura e condição atual', sample: '☀ 26°\nSua cidade', tone: 'blue', data: () => ({ model: 'minimal', city: 'São Paulo' }) },
      { id: 'forecast', title: 'Próximos dias', description: 'Previsão com máximas e mínimas', sample: 'SEG  TER  QUA\n26°   24°   27°', tone: 'teal', data: () => ({ model: 'forecast', city: 'São Paulo' }) },
    ],
  },
  [WidgetType.FULL_INFO]: {
    title: 'Hora e clima', icon: 'full-info', description: 'Um painel completo para acompanhar o dia.', blank: { city: 'São Paulo', model: 'standard' },
    presets: [
      { id: 'reception', title: 'Recepção elegante', description: 'Hora, data e clima sobre uma foto', sample: '09:41\n26° São Paulo', image: catalogAsset('exemplos/login-clinica.jpg'), data: () => ({ model: 'minimal', city: 'São Paulo', backgroundImage: catalogAsset('exemplos/login-clinica.jpg') }) },
      { id: 'glass', title: 'Painel em vidro', description: 'Informações organizadas em um cartão', sample: '09:41\n☀ 26°', tone: 'blue', data: () => ({ model: 'glass', city: 'São Paulo', backgroundAnimation: 'aurora' }) },
    ],
  },
  [WidgetType.RSS]: {
    title: 'Notícias', icon: 'rss', description: 'Manchetes atualizadas pelo feed escolhido.', linkLabel: 'Link de outro feed RSS', linkPlaceholder: 'https://.../rss.xml', blank: { rssUrl: '', rssFeeds: [] },
    presets: [
      { id: 'headlines', title: 'Manchetes do dia', description: 'G1 • imagem e notícia lado a lado', sample: 'AGORA\nAs notícias do dia', tone: 'blue', data: () => ({ rssUrl: 'https://g1.globo.com/rss/g1/', rssConfig: { layout: 'split', showImage: true, showFullContent: false } }) },
      { id: 'ticker', title: 'Faixa de notícias', description: 'Economia do G1 • manchetes em faixa', sample: 'ECONOMIA  •  ÚLTIMAS NOTÍCIAS', tone: 'dark', data: () => ({ rssUrl: 'https://g1.globo.com/rss/g1/economia/', rssConfig: { layout: 'ticker', showImage: false, enableMarquee: true, marqueeSpeed: 40 } }) },
    ],
  },
  [WidgetType.CALENDAR]: {
    title: 'Agenda', icon: 'calendar', description: 'Conecte uma agenda pública do Google ou use os feriados como ponto de partida.', blank: { calendarId: '', calendarConfig: { theme: 'light', customTitle: 'Nossa agenda', showTitle: true } },
    presets: [
      { id: 'light', title: 'Agenda clara', description: 'Feriados do Brasil • tema claro', sample: 'AGENDA\nPróximos encontros', tone: 'teal', data: () => ({ calendarId: 'pt.brazilian#holiday@group.v.calendar.google.com', calendarConfig: { theme: 'light', customTitle: 'Agenda do mês', showTitle: true } }) },
      { id: 'dark', title: 'Agenda escura', description: 'Feriados do Brasil • tema escuro', sample: 'NESTE MÊS\nDatas para lembrar', tone: 'dark', data: () => ({ calendarId: 'pt.brazilian#holiday@group.v.calendar.google.com', calendarConfig: { theme: 'dark', customTitle: 'Datas para lembrar', showTitle: true } }) },
    ],
  },
  [WidgetType.NOTES]: {
    title: 'Recados', icon: 'notes', description: 'Modelos editáveis para os avisos da sua equipe.', blank: { content: 'Escreva seu recado', notesConfig: { paperTheme: 'glass' } },
    presets: [
      { id: 'meeting', title: 'Recado da equipe', description: 'Nota amarela com mensagem editável', sample: 'Vamos conversar?\nReunião hoje, às 16h.', tone: 'warm', data: () => ({ content: 'Vamos conversar?\n\nReunião rápida da equipe hoje, às 16h.\nTraga suas ideias!', notesConfig: { paperTheme: 'yellow-sticky', fontSize: '24px', textColor: '#422006', fontFamily: 'Arial' } }) },
      { id: 'wifi', title: 'Wi-Fi para clientes', description: 'Troque o nome da rede e a senha', sample: 'CONECTE-SE\nWi-Fi para você', tone: 'purple', data: () => ({ content: 'Wi-Fi para você\n\nRede: Nome da sua loja\nSenha: informe aqui\n\nFique à vontade!', notesConfig: { paperTheme: 'purple-haze', fontSize: '24px', textColor: '#ffffff', fontFamily: 'Arial' } }) },
    ],
  },
  [WidgetType.TODO]: {
    title: 'Listas de tarefas', icon: 'todo', description: 'Comece com uma rotina e personalize os itens.', blank: { todoConfig: { title: 'Minha lista', items: [] } },
    presets: [
      { id: 'opening', title: 'Abertura da loja', description: 'Três tarefas para começar o dia', sample: '□ Conferir a vitrine\n□ Repor produtos\n□ Organizar o caixa', tone: 'teal', data: () => tasks('Bom dia, equipe!', ['Conferir a vitrine', 'Repor os produtos', 'Organizar o caixa']) },
      { id: 'closing', title: 'Fechamento', description: 'Checklist para o fim do expediente', sample: '□ Conferir o estoque\n□ Fechar o caixa\n□ Desligar equipamentos', tone: 'blue', data: () => tasks('Tudo pronto para amanhã', ['Conferir o estoque', 'Fechar o caixa', 'Desligar os equipamentos']) },
    ],
  },
  [WidgetType.COUNTDOWN]: {
    title: 'Contagem regressiva', icon: 'countdown', description: 'Um lembrete visual para a próxima data importante.', blank: { countdownConfig: { title: 'Meu evento', targetDate: nextDate(7), expiredMessage: 'Chegou o dia!', theme: 'minimal' } },
    presets: [
      { id: 'offer', title: 'Últimos dias da oferta', description: 'Termina em 7 dias • data editável', sample: 'ÚLTIMOS DIAS\n07 : 00 : 00', tone: 'blue', data: () => ({ countdownConfig: { title: 'A oferta termina em', targetDate: nextDate(7), expiredMessage: 'Confira as novas ofertas!', theme: 'bold-gradient' } }) },
      { id: 'event', title: 'Próximo evento', description: 'Faltam 30 dias • data editável', sample: 'NOSSO PRÓXIMO ENCONTRO\n30 dias', tone: 'purple', data: () => ({ countdownConfig: { title: 'Nosso próximo encontro', targetDate: nextDate(30), expiredMessage: 'É hoje. Seja bem-vindo!', theme: 'glass' } }) },
    ],
  },
  [WidgetType.CHORES]: {
    title: 'Rotinas da equipe', icon: 'chores', description: 'Distribua atividades com responsáveis e dias.', blank: { choresConfig: { title: 'Rotina da equipe', items: [] } },
    presets: [
      { id: 'store', title: 'Escala da loja', description: 'Vitrine, estoque e atendimento', sample: 'Vitrine       Ana\nEstoque     João\nCaixa        Maria', tone: 'blue', data: () => ({ choresConfig: { title: 'Cada um faz a diferença', items: [{ id: 'c1', chore: 'Organizar a vitrine', assignee: 'Ana', day: 'Segunda', done: false }, { id: 'c2', chore: 'Conferir o estoque', assignee: 'João', day: 'Terça', done: false }, { id: 'c3', chore: 'Revisar o caixa', assignee: 'Maria', day: 'Quarta', done: false }] } }) },
      { id: 'care', title: 'Cuidado com o espaço', description: 'Rotina de limpeza e organização', sample: 'Recepção   Equipe A\nCopa          Equipe B', tone: 'teal', data: () => ({ choresConfig: { title: 'Nosso espaço, nosso cuidado', items: [{ id: 'c1', chore: 'Organizar a recepção', assignee: 'Equipe A', day: 'Segunda', done: false }, { id: 'c2', chore: 'Conferir a copa', assignee: 'Equipe B', day: 'Terça', done: false }] } }) },
    ],
  },
  [WidgetType.MEAL_PLAN]: {
    title: 'Cardápios', icon: 'meal-plan', description: 'Organize as refeições. Cada item pode ser editado.', blank: { mealPlanConfig: { title: 'Nosso cardápio', days: {} } },
    presets: [
      { id: 'lunch', title: 'Almoço da semana', description: 'Pratos de segunda a sexta', sample: 'NO ALMOÇO\nComida de verdade.', tone: 'warm', data: () => ({ mealPlanConfig: { title: 'Almoço da semana', days: { Segunda: { lunch: 'Frango grelhado, arroz e salada' }, Terça: { lunch: 'Carne de panela com legumes' }, Quarta: { lunch: 'Peixe assado com purê' }, Quinta: { lunch: 'Massa ao molho da casa' }, Sexta: { lunch: 'Feijoada com acompanhamentos' } } } }) },
      { id: 'breakfast', title: 'Café e lanches', description: 'Sugestões para a padaria ou café', sample: 'FEITO NA HORA\nSeu café favorito.', tone: 'teal', data: () => ({ mealPlanConfig: { title: 'Pausa para um café', days: { Segunda: { breakfast: 'Café com leite e pão na chapa', snacks: 'Bolo de cenoura' }, Terça: { breakfast: 'Cappuccino e croissant', snacks: 'Pão de queijo' }, Quarta: { breakfast: 'Suco natural e tapioca', snacks: 'Sanduíche da casa' }, Quinta: { breakfast: 'Café e cuscuz', snacks: 'Bolo de milho' }, Sexta: { breakfast: 'Chocolate quente e pão', snacks: 'Salgados da casa' } } } }) },
    ],
  },
  [WidgetType.MARKET_WATCH]: {
    title: 'Cotações', icon: 'market', description: 'Escolha uma lista inicial de ativos. Os valores vêm da integração.', blank: { marketWatchConfig: { title: 'Minhas cotações', symbols: [], layout: 'list' } },
    presets: [
      { id: 'stocks', title: 'Mercado brasileiro', description: 'Ibovespa, Petrobras e Vale', sample: 'MERCADO\nIBOV  PETR4  VALE3', tone: 'teal', data: () => ({ marketWatchConfig: { title: 'Mercado brasileiro', symbols: ['^BVSP', 'PETR4.SA', 'VALE3.SA'], layout: 'grid' } }) },
      { id: 'crypto', title: 'Criptomoedas', description: 'Bitcoin e Ethereum em lista', sample: 'CRIPTO\nBTC  •  ETH', tone: 'dark', data: () => ({ marketWatchConfig: { title: 'Criptomoedas', symbols: ['BTC-USD', 'ETH-USD'], layout: 'list' } }) },
    ],
  },
  [WidgetType.BROWSER_SNAPSHOT]: {
    title: 'Captura de página', icon: 'snapshot', description: 'Mostre uma imagem de um site, atualizada automaticamente.', linkLabel: 'Página para capturar', linkPlaceholder: 'https://seusite.com.br', requiresLink: true, blank: { browserSnapshotConfig: { url: '', updateIntervalMinutes: 15 } },
    presets: [
      { id: 'frequent', title: 'Painel atualizado', description: 'Uma nova captura a cada 5 minutos', sample: 'SEU PAINEL\nAtualização: 5 min', tone: 'blue', data: () => ({ browserSnapshotConfig: { url: '', updateIntervalMinutes: 5 } }) },
      { id: 'daily', title: 'Página institucional', description: 'Uma nova captura a cada 60 minutos', sample: 'SUA EMPRESA\nAtualização: 60 min', tone: 'teal', data: () => ({ browserSnapshotConfig: { url: '', updateIntervalMinutes: 60 } }) },
    ],
  },
  [WidgetType.GOOGLE_DOCS]: {
    title: 'Google Workspace', icon: 'google-docs', description: 'Escolha o documento e informe o link publicado para exibição.', linkLabel: 'Link publicado do Google', linkPlaceholder: 'https://docs.google.com/...', linkHelp: 'No Google, use Arquivo → Compartilhar → Publicar na Web.', requiresLink: true, blank: { googleDocsConfig: { url: '', docType: 'document' } },
    presets: [
      { id: 'document', title: 'Documento', description: 'Comunicados e informações', sample: 'COMUNICADO\nSua equipe informada.', tone: 'blue', data: () => ({ googleDocsConfig: { url: '', docType: 'document' } }) },
      { id: 'spreadsheet', title: 'Planilha', description: 'Metas, escalas e resultados', sample: 'RESULTADOS\nMetas da semana', tone: 'teal', data: () => ({ googleDocsConfig: { url: '', docType: 'spreadsheet' } }) },
      { id: 'presentation', title: 'Apresentação', description: 'Seus slides na TV', sample: 'SUA HISTÓRIA\nEm cada slide.', tone: 'warm', data: () => ({ googleDocsConfig: { url: '', docType: 'presentation' } }) },
    ],
  },
  [WidgetType.OFFICE_DOCS]: {
    title: 'Microsoft Office', icon: 'office-docs', description: 'Exiba um arquivo com link público de leitura.', linkLabel: 'Link público do arquivo', linkPlaceholder: 'https://.../arquivo.docx', requiresLink: true, blank: { officeDocsConfig: { url: '', docType: 'word' } },
    presets: [
      { id: 'word', title: 'Word', description: 'Avisos e documentos', sample: 'COMUNICADOS\nTudo em um lugar.', tone: 'blue', data: () => ({ officeDocsConfig: { url: '', docType: 'word' } }) },
      { id: 'excel', title: 'Excel', description: 'Tabelas e números da equipe', sample: 'SUA EQUIPE\nDe olho nas metas.', tone: 'teal', data: () => ({ officeDocsConfig: { url: '', docType: 'excel' } }) },
      { id: 'slides', title: 'PowerPoint', description: 'Apresentações e campanhas', sample: 'APRESENTE\nSua próxima ideia.', tone: 'warm', data: () => ({ officeDocsConfig: { url: '', docType: 'powerpoint' } }) },
    ],
  },
  [WidgetType.POWER_BI]: {
    title: 'Power BI', icon: 'power-bi', description: 'Conecte o painel de resultados da sua empresa.', linkLabel: 'Link de incorporação do Power BI', linkPlaceholder: 'https://app.powerbi.com/view?...', linkHelp: 'Use o link de incorporação fornecido pelo Power BI.', requiresLink: true, blank: { powerBiConfig: { embedUrl: '' } },
    presets: [
      { id: 'dashboard', title: 'Painel de resultados', description: 'Relatório incorporado na TV', sample: 'RESULTADOS\nSua operação à vista.', tone: 'warm', data: () => ({ powerBiConfig: { embedUrl: '' } }) },
    ],
  },
  [WidgetType.AIRTABLE]: {
    title: 'Airtable', icon: 'airtable', description: 'Exiba uma visualização compartilhada da sua base.', linkLabel: 'Link da visualização compartilhada', linkPlaceholder: 'https://airtable.com/embed/...', requiresLink: true, blank: { airtableConfig: { shareUrl: '' } },
    presets: [
      { id: 'shared', title: 'Quadro da equipe', description: 'A visualização segue o seu Airtable', sample: 'EM ANDAMENTO\nSeu trabalho organizado.', tone: 'teal', data: () => ({ airtableConfig: { shareUrl: '' } }) },
    ],
  },
  [WidgetType.PDF_DOCUMENT]: {
    title: 'Documentos PDF', icon: 'pdf', description: 'Use o endereço de um PDF disponível para leitura.', linkLabel: 'Link direto do PDF', linkPlaceholder: 'https://.../documento.pdf', requiresLink: true, blank: { pdfDocumentConfig: { pdfUrl: '' } },
    presets: [
      { id: 'document', title: 'Documento na tela', description: 'Cardápio, comunicado ou apresentação', sample: 'SEU DOCUMENTO\nPronto para exibir.', tone: 'warm', data: () => ({ pdfDocumentConfig: { pdfUrl: '' } }) },
    ],
  },
  [WidgetType.EMBED_HTML]: {
    title: 'HTML personalizado', icon: 'html', description: 'Comece com um modelo e edite o código nas opções do bloco.', blank: { embedHtmlConfig: { html: '<main style="padding:32px;font:24px Arial;color:#ffffff">Seu conteúdo aqui</main>' } },
    presets: [
      { id: 'welcome', title: 'Boas-vindas', description: 'HTML e CSS editáveis', sample: 'É BOM\nTER VOCÊ AQUI.', tone: 'teal', data: () => htmlCard('SEJA BEM-VINDO', 'É bom ter<br>você aqui.', 'Fique à vontade. Nossa equipe está pronta para ajudar.', '#064c59') },
      { id: 'offer', title: 'Oferta em destaque', description: 'Edite o título, produto e preço', sample: 'ESCOLHA DO DIA\nSeu produto favorito.', tone: 'warm', data: () => htmlCard('ESCOLHA DO DIA', 'Seu produto<br>favorito.', 'Troque esta frase pela sua oferta e informe o preço.', '#813c13') },
    ],
  },
};

/** Keep every URL in the field consumed by the corresponding renderer. */
export function withCatalogLink(type: WidgetType, data: Partial<WidgetData>, url: string): Partial<WidgetData> {
  switch (type) {
    case WidgetType.VIDEO: return { ...data, videoUrl: url };
    case WidgetType.RSS: return { ...data, rssUrl: url, rssFeeds: [] };
    case WidgetType.IFRAME: return { ...data, url, embedWebsiteConfig: { ...data.embedWebsiteConfig, url }, iframeConfig: { ...data.iframeConfig, interactive: data.iframeConfig?.interactive ?? false } };
    case WidgetType.BROWSER_SNAPSHOT: return { ...data, browserSnapshotConfig: { ...data.browserSnapshotConfig, url } };
    case WidgetType.GOOGLE_DOCS: return { ...data, googleDocsConfig: { docType: 'document', ...data.googleDocsConfig, url } };
    case WidgetType.OFFICE_DOCS: return { ...data, officeDocsConfig: { docType: 'word', ...data.officeDocsConfig, url } };
    case WidgetType.POWER_BI: return { ...data, powerBiConfig: { embedUrl: url } };
    case WidgetType.AIRTABLE: return { ...data, airtableConfig: { shareUrl: url } };
    case WidgetType.PDF_DOCUMENT: return { ...data, pdfDocumentConfig: { pdfUrl: url } };
    default: return { ...data, url };
  }
}
