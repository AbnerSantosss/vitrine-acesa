/**
 * Telas prontas por segmento. Contrato: `SceneTemplate`, `SEGMENTS`, `SCENE_TEMPLATES`.
 * Aplicação na cena: Editor (agente B), que gera ids novos para cada item e troca o layout da cena ativa.
 * Coordenadas na grade de 40 px: 48×27 (horizontal) ou 27×48 (vertical), sempre em células inteiras.
 * Todo item é um widget comum (TEXT, IMAGE, SHAPE, ICON, MOTION), por isso 100% editável.
 *
 * Como os modelos são montados: um conjunto de funções (`txt`, `img`, `shape`, `icon`, `motion`)
 * descreve cada widget, e cada "arquétipo" (oferta, lista de preços, três ofertas, destaque)
 * recebe o perfil de um segmento (cores, fotos, textos). A ordem dos itens vira o `zIndex`
 * (10, 11, 12...), então o primeiro item é o fundo.
 * Tamanhos de texto em `cqw` (relativo à largura da cena): na vertical 1 cqw vale 10,8 px, na
 * horizontal 19,2 px, por isso os arquétipos verticais usam números maiores.
 */
import { WidgetType, type LayoutItem, type Page, type WidgetData } from '../../../types';
import { getMotionDefaults } from './motionPresets';

export type Segment = 'lojas' | 'supermercados' | 'padarias' | 'shoppings' | 'restaurantes' | 'pizzarias' | 'lanchonetes';

export const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'lojas', label: 'Lojas' },
  { id: 'supermercados', label: 'Supermercados' },
  { id: 'padarias', label: 'Padarias' },
  { id: 'shoppings', label: 'Shoppings' },
  { id: 'restaurantes', label: 'Restaurantes' },
  { id: 'pizzarias', label: 'Pizzarias' },
  { id: 'lanchonetes', label: 'Lanchonetes' },
];

export interface SceneTemplate {
  id: string;
  title: string;
  segment: Segment | 'todos';
  orientation: 'horizontal' | 'vertical';
  tags?: string[];
  page?: Partial<Pick<Page, 'backgroundImage' | 'backgroundAnimation' | 'backgroundVideoUrl'>>;
  layout: Omit<LayoutItem, 'i'>[];
}

/* ------------------------------------------------------------------ */
/* Funções que descrevem cada widget                                   */
/* ------------------------------------------------------------------ */

type Item = Omit<LayoutItem, 'i'>;
type TextEffect = NonNullable<NonNullable<WidgetData['textConfig']>['effect']>;

const STRETCH = { fillContainer: true, contentAlignment: 'stretch' as const, padding: '0', transparentBackground: true };

interface TxtOpts {
  /** Tamanho em cqw. */
  s: number;
  c: string;
  w?: string;
  a?: 'left' | 'center' | 'right';
  fx?: TextEffect;
  fx1?: string;
  fx2?: string;
  lh?: number;
  ls?: number;
  rot?: number;
}

/** Texto centralizado na vertical dentro da caixa, sem margem interna. */
export const txt = (x: number, y: number, w: number, h: number, content: string, o: TxtOpts): Item => ({
  x, y, w, h, type: WidgetType.TEXT,
  data: {
    content, color: o.c, fontSize: '', padding: '0', fillContainer: false, contentAlignment: 'center', fitContainerMode: 'none',
    transparentBackground: true, rotation: o.rot,
    textConfig: {
      fontSize: `${o.s}cqw`, fontWeight: o.w ?? '800', textAlign: o.a ?? 'center', lineHeight: o.lh, letterSpacing: o.ls,
      effect: o.fx, effectColor: o.fx1, effectColor2: o.fx2,
    },
  },
});

export const shape = (x: number, y: number, w: number, h: number, kind: NonNullable<WidgetData['shapeConfig']>['kind'], fill: string,
  o: { stroke?: string; sw?: number; rot?: number; opacity?: number } = {}): Item => ({
  x, y, w, h, type: WidgetType.SHAPE,
  data: { ...STRETCH, shapeConfig: { kind, fill, stroke: o.stroke, strokeWidth: o.sw }, rotation: o.rot, opacity: o.opacity },
});

export const icon = (x: number, y: number, w: number, h: number, name: string, color: string,
  o: { filled?: boolean; container?: NonNullable<WidgetData['effects']>['container']; rot?: number } = {}): Item => ({
  x, y, w, h, type: WidgetType.ICON,
  data: { ...STRETCH, iconConfig: { name, color, strokeWidth: 2, variant: o.filled ? 'filled' : 'stroke' }, effects: o.container ? { container: o.container } : undefined, rotation: o.rot },
});

const photoUrl = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?w=${width}&q=80`;

const img = (x: number, y: number, w: number, h: number, photoId: string,
  o: { frame?: NonNullable<WidgetData['imageConfig']>['frame']; filter?: NonNullable<WidgetData['imageConfig']>['filter']; width?: number } = {}): Item => ({
  x, y, w, h, type: WidgetType.IMAGE,
  data: {
    url: photoUrl(photoId, o.width ?? 1600), padding: '0', fillContainer: true, contentAlignment: 'stretch', fitContainerMode: 'cover',
    imageConfig: { objectFit: 'cover', scale: 1, frame: o.frame, filter: o.filter },
  },
});

export const motion = (x: number, y: number, w: number, h: number, presetId: string,
  fields: Record<string, string> = {}, colors: Record<string, string> = {}): Item => {
  const d = getMotionDefaults(presetId);
  return { x, y, w, h, type: WidgetType.MOTION, data: { ...STRETCH, motionConfig: { presetId, fields: { ...d.fields, ...fields }, colors: { ...d.colors, ...colors }, speed: 1 } } };
};

const build = (id: string, title: string, segment: SceneTemplate['segment'], orientation: SceneTemplate['orientation'], items: Item[], tags: string[] = []): SceneTemplate => ({
  id, title, segment, orientation, tags,
  layout: items.map((item, index) => ({ ...item, data: { ...item.data, zIndex: 10 + index } })),
});

/* ------------------------------------------------------------------ */
/* Perfil de cada segmento                                             */
/* ------------------------------------------------------------------ */

interface Profile {
  id: Segment;
  label: string;
  bg: string; panel: string; ink: string; muted: string; accent: string; accent2: string; onAccent: string; shade: string;
  icon: string;
  /** Fotos (ids do Unsplash): 0 principal, 1 e 2 de apoio. */
  photos: [string, string, string];
  oferta: { tag: string; produto: string; desc: string; de: string; por: string; selo: string; cta: string };
  lista: { titulo: string; itens: [string, string][]; rodape: string };
  cards: { titulo: string; itens: [string, string, string][] };
  destaque: { titulo: string; sub: string; cta: string; selo: string; seloSub: string };
  tags: string[];
}

const DARK = '#111827';

const PROFILES: Profile[] = [
  {
    id: 'lojas', label: 'Lojas', bg: '#0f172a', panel: '#1e293b', ink: '#ffffff', muted: '#cbd5e1', accent: '#f43f5e', accent2: '#fde047', onAccent: '#ffffff', shade: '#7f1d1d',
    icon: 'shopping-bag', photos: ['1441986300917-64674bd600d8', '1445205170230-053b83016050', '1483985988355-763728e1935b'],
    oferta: { tag: 'OFERTA DA SEMANA', produto: 'Jaqueta jeans feminina', desc: 'Todos os tamanhos, em até 3x sem juros', de: 'De R$ 199,90', por: 'R$ 149,90', selo: '-25%', cta: 'Venha conferir' },
    lista: { titulo: 'Liquidação de verão', rodape: 'Peças selecionadas, enquanto durar o estoque', itens: [['Camiseta básica', 'R$ 39,90'], ['Bermuda de sarja', 'R$ 79,90'], ['Calça jeans', 'R$ 119,90'], ['Vestido midi', 'R$ 129,90'], ['Tênis casual', 'R$ 169,90'], ['Bolsa tiracolo', 'R$ 89,90']] },
    cards: { titulo: 'Mais vendidos', itens: [['Camiseta básica', 'R$ 39,90', '3 por R$ 99,00'], ['Tênis casual', 'R$ 169,90', 'ou 3x de R$ 56,63'], ['Bolsa tiracolo', 'R$ 89,90', 'ou 2x de R$ 44,95']] },
    destaque: { titulo: 'Nova coleção chegou', sub: 'Peças a partir de R$ 39,90', cta: 'Confira na loja', selo: 'NOVO', seloSub: 'na vitrine' },
    tags: ['roupa', 'moda', 'vitrine', 'liquidação'],
  },
  {
    id: 'supermercados', label: 'Supermercados', bg: '#fef9c3', panel: '#ffffff', ink: '#7f1d1d', muted: '#78716c', accent: '#dc2626', accent2: '#facc15', onAccent: '#ffffff', shade: '#7f1d1d',
    icon: 'shopping-cart', photos: ['1542838132-92c53300491e', '1604719312566-8912e9227c6a', '1578916171728-46686eac8d58'],
    oferta: { tag: 'OFERTA DO DIA', produto: 'Tomate italiano, o quilo', desc: 'Direto do produtor, colhido esta semana', de: 'De R$ 9,90', por: 'R$ 5,99', selo: '-40%', cta: 'Só hoje no hortifruti' },
    lista: { titulo: 'Ofertas do hortifruti', rodape: 'Preços válidos enquanto durarem os estoques', itens: [['Banana prata, kg', 'R$ 5,49'], ['Maçã fuji, kg', 'R$ 8,99'], ['Batata lavada, kg', 'R$ 4,99'], ['Cenoura, kg', 'R$ 3,99'], ['Cebola, kg', 'R$ 4,49'], ['Limão tahiti, kg', 'R$ 6,99']] },
    cards: { titulo: 'Ofertas da semana', itens: [['Arroz branco 5 kg', 'R$ 24,90', 'Limite de 3 por cliente'], ['Feijão carioca 1 kg', 'R$ 6,99', 'Limite de 5 por cliente'], ['Óleo de soja 900 ml', 'R$ 5,99', 'Limite de 6 por cliente']] },
    destaque: { titulo: 'Semana das ofertas', sub: 'Centenas de produtos com preço baixo', cta: 'Aproveite hoje', selo: 'SÓ HOJE', seloSub: 'preço baixo' },
    tags: ['mercado', 'hortifruti', 'ofertas', 'compras'],
  },
  {
    id: 'padarias', label: 'Padarias', bg: '#fff7ed', panel: '#ffedd5', ink: '#431407', muted: '#9a3412', accent: '#c2410c', accent2: '#f59e0b', onAccent: '#ffffff', shade: '#7c2d12',
    icon: 'croissant', photos: ['1555507036-ab1f4038808a', '1509440159596-0249088772ff', '1517433670267-08bbd4be890f'],
    oferta: { tag: 'SAIU AGORA', produto: 'Croissant de manteiga', desc: 'Folhado, quentinho e feito hoje de manhã', de: 'De R$ 9,00', por: 'R$ 6,50', selo: '-28%', cta: 'Peça no balcão' },
    lista: { titulo: 'Hoje no balcão', rodape: 'Fornadas novas às 7h e às 16h', itens: [['Pão francês, unidade', 'R$ 0,90'], ['Pão de queijo', 'R$ 3,50'], ['Café coado', 'R$ 4,00'], ['Bolo de cenoura, fatia', 'R$ 6,50'], ['Sanduíche natural', 'R$ 12,00'], ['Suco de laranja', 'R$ 7,00']] },
    cards: { titulo: 'Combos do café da manhã', itens: [['Pão na chapa + café', 'R$ 9,90', 'Das 6h às 10h'], ['Croissant + suco', 'R$ 14,90', 'Das 6h às 10h'], ['Pão de queijo + café', 'R$ 8,90', 'Das 6h às 10h']] },
    destaque: { titulo: 'Pão quentinho saindo agora', sub: 'Fornadas às 7h e às 16h, todos os dias', cta: 'Venha buscar', selo: 'FRESCO', seloSub: 'todo dia' },
    tags: ['pão', 'café', 'confeitaria', 'padaria'],
  },
  {
    id: 'shoppings', label: 'Shoppings', bg: '#0b1220', panel: '#162033', ink: '#ffffff', muted: '#94a3b8', accent: '#d4af37', accent2: '#38bdf8', onAccent: '#0b1220', shade: '#7a5c00',
    icon: 'predio', photos: ['1519567241046-7f570eee3ce6', '1483985988355-763728e1935b', '1441986300917-64674bd600d8'],
    oferta: { tag: 'NO SEU SHOPPING', produto: 'Liquidação de inverno', desc: 'Mais de 80 lojas com descontos reais', de: 'Descontos de até', por: '60% OFF', selo: 'ATÉ 60%', cta: 'Confira as lojas' },
    lista: { titulo: 'Onde ir hoje', rodape: 'Funcionamento conforme cada loja', itens: [['Praça de alimentação', 'Piso 2'], ['Cinema', 'Piso 3'], ['Moda feminina', 'Piso 1'], ['Moda masculina', 'Piso 1'], ['Eletrônicos', 'Piso 2'], ['Serviços e banco', 'Térreo']] },
    cards: { titulo: 'Novidades no shopping', itens: [['Nova loja de calçados', 'Piso 1', 'Inauguração neste sábado'], ['Festival gastronômico', 'Piso 2', 'De sexta a domingo'], ['Cinema com meia-entrada', 'Piso 3', 'Toda quarta-feira']] },
    destaque: { titulo: 'Fim de semana de ofertas', sub: 'Estacionamento com desconto para quem compra', cta: 'Venha para o shopping', selo: 'ATÉ 60%', seloSub: 'de desconto' },
    tags: ['mall', 'lojas', 'cinema', 'praça de alimentação'],
  },
  {
    id: 'restaurantes', label: 'Restaurantes', bg: '#1c1917', panel: '#292524', ink: '#fafaf9', muted: '#a8a29e', accent: '#f59e0b', accent2: '#f87171', onAccent: '#1c1917', shade: '#92400e',
    icon: 'talheres', photos: ['1414235077428-338989a2e8c0', '1504674900247-0877df9cc836', '1546069901-ba9599a7e63c'],
    oferta: { tag: 'PRATO DO DIA', produto: 'Filé à parmegiana com arroz e fritas', desc: 'Acompanha salada e suco do dia', de: 'De R$ 49,90', por: 'R$ 39,90', selo: 'CHEF', cta: 'Peça ao garçom' },
    lista: { titulo: 'Cardápio executivo', rodape: 'Servido de segunda a sexta, das 11h às 15h', itens: [['Filé de frango grelhado', 'R$ 32,90'], ['Strogonoff de carne', 'R$ 36,90'], ['Feijoada completa', 'R$ 42,90'], ['Peixe com legumes', 'R$ 44,90'], ['Salada completa', 'R$ 28,90'], ['Sobremesa do dia', 'R$ 12,00']] },
    cards: { titulo: 'Sugestões do chef', itens: [['Risoto de cogumelos', 'R$ 54,90', 'Serve uma pessoa'], ['Costela assada', 'R$ 68,90', 'Serve duas pessoas'], ['Salada com salmão', 'R$ 48,90', 'Serve uma pessoa']] },
    destaque: { titulo: 'Almoço executivo', sub: 'Prato, bebida e sobremesa por R$ 39,90', cta: 'Reserve sua mesa', selo: 'NOVO', seloSub: 'no cardápio' },
    tags: ['almoço', 'jantar', 'prato', 'cardápio'],
  },
  {
    id: 'pizzarias', label: 'Pizzarias', bg: '#450a0a', panel: '#7f1d1d', ink: '#fff7ed', muted: '#fecaca', accent: '#fbbf24', accent2: '#4ade80', onAccent: '#450a0a', shade: '#92400e',
    icon: 'pizza', photos: ['1513104890138-7c749659a591', '1565299624946-b28f40a0ae38', '1574071318508-1cdbab80d002'],
    oferta: { tag: 'PIZZA DO DIA', produto: 'Pizza grande de calabresa', desc: '8 fatias, borda recheada de graça', de: 'De R$ 59,90', por: 'R$ 44,90', selo: '-25%', cta: 'Peça pelo WhatsApp' },
    lista: { titulo: 'Sabores da casa', rodape: 'Pizzas grandes, 8 fatias', itens: [['Mussarela', 'R$ 44,90'], ['Calabresa', 'R$ 46,90'], ['Portuguesa', 'R$ 52,90'], ['Frango com catupiry', 'R$ 54,90'], ['Quatro queijos', 'R$ 56,90'], ['Margherita', 'R$ 49,90']] },
    cards: { titulo: 'Combos para a noite', itens: [['Pizza grande + refri', 'R$ 59,90', 'Refrigerante de 2 litros'], ['Duas pizzas médias', 'R$ 79,90', 'Dois sabores à escolha'], ['Pizza doce + salgada', 'R$ 69,90', 'Tamanho médio']] },
    destaque: { titulo: 'Terça é dia de pizza', sub: 'Segunda pizza com 50% de desconto', cta: 'Faça seu pedido', selo: '2 POR 1', seloSub: 'toda terça' },
    tags: ['pizza', 'delivery', 'forno a lenha', 'combo'],
  },
  {
    id: 'lanchonetes', label: 'Lanchonetes', bg: '#111827', panel: '#1f2937', ink: '#ffffff', muted: '#d1d5db', accent: '#f97316', accent2: '#fde047', onAccent: DARK, shade: '#9a3412',
    icon: 'sanduiche', photos: ['1568901346375-23c9450c58cd', '1550547660-d9450f859349', '1571091718767-18b5b1457add'],
    oferta: { tag: 'COMBO DO DIA', produto: 'Hambúrguer artesanal com fritas', desc: 'Pão brioche, carne de 160 g e queijo', de: 'De R$ 34,90', por: 'R$ 27,90', selo: '-20%', cta: 'Peça no balcão' },
    lista: { titulo: 'Cardápio de lanches', rodape: 'Todos acompanham batata frita pequena', itens: [['X-Burger', 'R$ 19,90'], ['X-Salada', 'R$ 22,90'], ['X-Bacon', 'R$ 26,90'], ['Cachorro-quente', 'R$ 14,90'], ['Sanduíche natural', 'R$ 16,90'], ['Porção de batata', 'R$ 18,90']] },
    cards: { titulo: 'Combos', itens: [['Burger + fritas + refri', 'R$ 29,90', 'Combo individual'], ['Dois burgers + fritas', 'R$ 49,90', 'Combo para dividir'], ['Cachorro-quente + suco', 'R$ 21,90', 'Combo econômico']] },
    destaque: { titulo: 'O melhor burger do bairro', sub: 'Carne na hora, pão fresquinho', cta: 'Peça o seu', selo: 'NOVO', seloSub: 'no cardápio' },
    tags: ['hambúrguer', 'lanche', 'combo', 'fast food'],
  },
];

/* ------------------------------------------------------------------ */
/* Arquétipos horizontais (48 × 27)                                    */
/* ------------------------------------------------------------------ */

/** Foto à esquerda, painel à direita com produto, preço de/por, selo e chamada. */
function ofertaH(p: Profile): SceneTemplate {
  const o = p.oferta;
  return build(`${p.id}-oferta-h`, 'Oferta com foto', p.id, 'horizontal', [
    shape(0, 0, 48, 27, 'rect', p.bg),
    img(0, 0, 26, 27, p.photos[0]),
    shape(26, 0, 22, 27, 'rect', p.panel),
    shape(28, 2, 12, 2, 'pill', p.accent),
    txt(28, 2, 12, 2, o.tag, { s: 1.05, c: p.onAccent, ls: 0.04 }),
    icon(43, 2, 4, 4, p.icon, p.accent),
    txt(28, 6, 19, 6, o.produto, { s: 3.4, c: p.ink, a: 'left', lh: 1.05 }),
    txt(28, 12, 19, 2, o.desc, { s: 1.25, c: p.muted, a: 'left', w: '500' }),
    txt(28, 14, 19, 2, o.de, { s: 1.5, c: p.muted, a: 'left', w: '600' }),
    txt(28, 16, 19, 5, o.por, { s: 6.6, c: p.accent, a: 'left', fx: '3d', fx2: p.shade }),
    shape(28, 22, 14, 3, 'pill', p.accent),
    txt(28, 22, 14, 3, o.cta, { s: 1.3, c: p.onAccent }),
    shape(20, 2, 9, 9, 'burst', p.accent2, { rot: 10 }),
    txt(20, 2, 9, 9, o.selo, { s: 1.9, c: DARK, rot: 10, lh: 1 }),
  ], ['oferta', 'preço', 'promoção', ...p.tags]);
}

/** Lista de itens com preço, faixas alternadas e foto na lateral. */
function listaH(p: Profile): SceneTemplate {
  const l = p.lista;
  const rows: Item[] = [];
  l.itens.forEach(([nome, preco], i) => {
    const y = 7 + i * 3;
    if (i % 2 === 0) rows.push(shape(1, y, 30, 3, 'rounded', p.panel));
    rows.push(txt(2, y, 21, 3, nome, { s: 1.55, c: p.ink, a: 'left', w: '600' }));
    rows.push(txt(23, y, 7, 3, preco, { s: 1.55, c: p.accent, a: 'right' }));
  });
  return build(`${p.id}-lista-h`, 'Lista de preços', p.id, 'horizontal', [
    shape(0, 0, 48, 27, 'rect', p.bg),
    txt(2, 1, 25, 4, l.titulo, { s: 2.9, c: p.accent, a: 'left' }),
    icon(27, 1, 4, 4, p.icon, p.accent),
    shape(2, 5, 28, 1, 'line', p.accent, { sw: 3 }),
    ...rows,
    txt(2, 25, 28, 2, l.rodape, { s: 1, c: p.muted, a: 'left', w: '500' }),
    img(32, 0, 16, 27, p.photos[1], { width: 900 }),
  ], ['cardápio', 'tabela', 'preços', ...p.tags]);
}

/** Três cartões lado a lado, cada um com foto, nome e preço. */
function cardsH(p: Profile): SceneTemplate {
  const cards: Item[] = [];
  p.cards.itens.forEach(([nome, preco, nota], i) => {
    const x = 2 + i * 15;
    cards.push(shape(x, 6, 14, 20, 'rounded', p.panel));
    cards.push(img(x, 6, 14, 10, p.photos[i], { frame: 'rounded', width: 900 }));
    cards.push(txt(x + 1, 16, 12, 4, nome, { s: 1.6, c: p.ink, w: '700', lh: 1.1 }));
    cards.push(txt(x + 1, 20, 12, 4, preco, { s: 3.2, c: p.accent }));
    cards.push(txt(x + 1, 24, 12, 2, nota, { s: 0.95, c: p.muted, w: '500' }));
  });
  return build(`${p.id}-cards-h`, 'Três ofertas', p.id, 'horizontal', [
    shape(0, 0, 48, 27, 'rect', p.bg),
    txt(2, 1, 30, 4, p.cards.titulo, { s: 2.9, c: p.ink, a: 'left' }),
    icon(43, 1, 4, 4, p.icon, p.accent),
    ...cards,
  ], ['ofertas', 'combos', 'vitrine', ...p.tags]);
}

/** Foto em tela cheia com título grande em 3D e selo animado. */
function destaqueH(p: Profile): SceneTemplate {
  const d = p.destaque;
  return build(`${p.id}-destaque-h`, 'Destaque do dia', p.id, 'horizontal', [
    img(0, 0, 48, 27, p.photos[0]),
    shape(0, 0, 48, 27, 'rect', 'rgba(0,0,0,0.5)'),
    txt(4, 5, 30, 9, d.titulo, { s: 6.2, c: '#ffffff', a: 'left', fx: '3d', fx2: p.accent, lh: 1.05 }),
    txt(4, 15, 28, 3, d.sub, { s: 1.9, c: '#ffffff', a: 'left', w: '500' }),
    shape(4, 20, 14, 3, 'pill', p.accent),
    txt(4, 20, 14, 3, d.cta, { s: 1.3, c: p.onAccent }),
    icon(4, 2, 3, 3, p.icon, '#ffffff'),
    motion(36, 3, 10, 10, 'selo-girando', { texto: d.selo, sub: d.seloSub }, { selo: p.accent, borda: p.accent2, texto: p.onAccent }),
  ], ['destaque', 'chamada', 'foto grande', ...p.tags]);
}

/** Oferta com contagem regressiva animada ao lado da foto. */
function relampagoH(p: Profile): SceneTemplate {
  const o = p.oferta;
  return build(`${p.id}-relampago-h`, 'Oferta relâmpago', p.id, 'horizontal', [
    shape(0, 0, 48, 27, 'rect', p.bg),
    img(28, 0, 20, 27, p.photos[2], { width: 1000 }),
    txt(2, 2, 24, 3, 'OFERTA RELÂMPAGO', { s: 1.7, c: p.accent, a: 'left', ls: 0.06 }),
    txt(2, 5, 24, 6, o.produto, { s: 3.4, c: p.ink, a: 'left', lh: 1.05 }),
    txt(2, 11, 24, 6, o.por, { s: 6.6, c: p.accent, a: 'left', fx: '3d', fx2: p.shade }),
    motion(2, 17, 24, 8, 'contagem-regressiva', { titulo: 'A oferta acaba em', hora: '18:00' }, { fundo: p.panel, numero: p.accent, texto: p.ink }),
    shape(23, 1, 8, 8, 'burst', p.accent2, { rot: -8 }),
    txt(23, 1, 8, 8, o.selo, { s: 1.7, c: DARK, rot: -8 }),
  ], ['relâmpago', 'contagem', 'urgência', ...p.tags]);
}

/* ------------------------------------------------------------------ */
/* Arquétipos verticais (27 × 48)                                      */
/* ------------------------------------------------------------------ */

function ofertaV(p: Profile): SceneTemplate {
  const o = p.oferta;
  return build(`${p.id}-oferta-v`, 'Oferta com foto', p.id, 'vertical', [
    shape(0, 0, 27, 48, 'rect', p.bg),
    img(0, 0, 27, 26, p.photos[0], { width: 1200 }),
    shape(0, 26, 27, 22, 'rect', p.panel),
    shape(2, 28, 13, 2, 'pill', p.accent),
    txt(2, 28, 13, 2, o.tag, { s: 2, c: p.onAccent, ls: 0.04 }),
    txt(2, 31, 23, 6, o.produto, { s: 5.8, c: p.ink, a: 'left', lh: 1.05 }),
    txt(2, 37, 23, 2, o.de, { s: 2.8, c: p.muted, a: 'left', w: '600' }),
    txt(2, 39, 23, 5, o.por, { s: 10.5, c: p.accent, a: 'left', fx: '3d', fx2: p.shade }),
    shape(2, 44, 23, 3, 'pill', p.accent),
    txt(2, 44, 23, 3, o.cta, { s: 3, c: p.onAccent }),
    shape(17, 18, 8, 8, 'burst', p.accent2, { rot: 10 }),
    txt(17, 18, 8, 8, o.selo, { s: 3.4, c: DARK, rot: 10, lh: 1 }),
  ], ['oferta', 'preço', 'promoção', ...p.tags]);
}

function listaV(p: Profile): SceneTemplate {
  const l = p.lista;
  const rows: Item[] = [];
  l.itens.forEach(([nome, preco], i) => {
    const y = 7 + i * 4;
    if (i % 2 === 0) rows.push(shape(1, y, 25, 4, 'rounded', p.panel));
    rows.push(txt(2, y, 16, 4, nome, { s: 3, c: p.ink, a: 'left', w: '600', lh: 1.05 }));
    rows.push(txt(18, y, 7, 4, preco, { s: 3, c: p.accent, a: 'right' }));
  });
  return build(`${p.id}-lista-v`, 'Lista de preços', p.id, 'vertical', [
    shape(0, 0, 27, 48, 'rect', p.bg),
    txt(2, 1, 19, 4, l.titulo, { s: 5, c: p.accent, a: 'left', lh: 1.05 }),
    icon(21, 1, 4, 4, p.icon, p.accent),
    shape(2, 5, 23, 1, 'line', p.accent, { sw: 3 }),
    ...rows,
    txt(2, 31, 23, 2, l.rodape, { s: 2, c: p.muted, a: 'left', w: '500' }),
    img(0, 34, 27, 14, p.photos[1], { width: 1100 }),
  ], ['cardápio', 'tabela', 'preços', ...p.tags]);
}

function cardsV(p: Profile): SceneTemplate {
  const cards: Item[] = [];
  p.cards.itens.forEach(([nome, preco, nota], i) => {
    const y = 6 + i * 14;
    cards.push(shape(1, y, 25, 13, 'rounded', p.panel));
    cards.push(img(1, y, 10, 13, p.photos[i], { frame: 'rounded', width: 700 }));
    cards.push(txt(12, y + 1, 13, 4, nome, { s: 3, c: p.ink, a: 'left', w: '700', lh: 1.05 }));
    cards.push(txt(12, y + 5, 13, 5, preco, { s: 6.8, c: p.accent, a: 'left' }));
    cards.push(txt(12, y + 10, 13, 2, nota, { s: 2, c: p.muted, a: 'left', w: '500' }));
  });
  return build(`${p.id}-cards-v`, 'Ofertas empilhadas', p.id, 'vertical', [
    shape(0, 0, 27, 48, 'rect', p.bg),
    txt(2, 1, 19, 4, p.cards.titulo, { s: 5, c: p.ink, a: 'left', lh: 1.05 }),
    icon(21, 1, 4, 4, p.icon, p.accent),
    ...cards,
  ], ['ofertas', 'combos', 'vitrine', ...p.tags]);
}

function destaqueV(p: Profile): SceneTemplate {
  const d = p.destaque;
  return build(`${p.id}-destaque-v`, 'Destaque do dia', p.id, 'vertical', [
    img(0, 0, 27, 48, p.photos[0], { width: 1400 }),
    shape(0, 0, 27, 48, 'rect', 'rgba(0,0,0,0.5)'),
    txt(2, 22, 23, 11, d.titulo, { s: 8.6, c: '#ffffff', a: 'left', fx: '3d', fx2: p.accent, lh: 1.05 }),
    txt(2, 34, 23, 4, d.sub, { s: 3.4, c: '#ffffff', a: 'left', w: '500' }),
    shape(2, 40, 15, 3, 'pill', p.accent),
    txt(2, 40, 15, 3, d.cta, { s: 2.7, c: p.onAccent }),
    motion(15, 3, 10, 10, 'selo-girando', { texto: d.selo, sub: d.seloSub }, { selo: p.accent, borda: p.accent2, texto: p.onAccent }),
  ], ['destaque', 'chamada', 'foto grande', ...p.tags]);
}

/* ------------------------------------------------------------------ */
/* Modelos para qualquer segmento                                      */
/* ------------------------------------------------------------------ */

const NAVY = '#0b1b2b';
const TEAL = '#02c2cd';

const geral: SceneTemplate[] = [
  build('todos-aviso-h', 'Aviso importante', 'todos', 'horizontal', [
    shape(0, 0, 48, 27, 'rect', NAVY),
    icon(4, 5, 9, 9, 'megafone', '#fde047', { container: { shape: 'circle', color: '#e63946', padding: 20 } }),
    txt(16, 4, 28, 6, 'Aviso importante', { s: 5.2, c: '#ffffff', a: 'left' }),
    txt(16, 10, 28, 6, 'Escreva aqui o comunicado para os clientes, com poucas palavras e letra grande.', { s: 2.2, c: '#cbd5e1', a: 'left', w: '500', lh: 1.25 }),
    motion(0, 20, 48, 5, 'letreiro', { texto: 'Atenção ao aviso e obrigado pela compreensão' }, { fundo: '#e63946', texto: '#ffffff', marca: '#fde047' }),
  ], ['aviso', 'comunicado', 'atenção']),
  build('todos-aviso-v', 'Aviso importante', 'todos', 'vertical', [
    shape(0, 0, 27, 48, 'rect', NAVY),
    icon(8, 6, 11, 11, 'megafone', '#fde047', { container: { shape: 'circle', color: '#e63946', padding: 20 } }),
    txt(2, 19, 23, 6, 'Aviso importante', { s: 7.2, c: '#ffffff', lh: 1.05 }),
    txt(2, 26, 23, 10, 'Escreva aqui o comunicado para os clientes, com poucas palavras e letra grande.', { s: 3.6, c: '#cbd5e1', w: '500', lh: 1.25 }),
    motion(0, 40, 27, 5, 'letreiro', { texto: 'Atenção ao aviso e obrigado pela compreensão' }, { fundo: '#e63946', texto: '#ffffff', marca: '#fde047' }),
  ], ['aviso', 'comunicado', 'atenção']),

  build('todos-horario-h', 'Horário de funcionamento', 'todos', 'horizontal', [
    shape(0, 0, 48, 27, 'rect', NAVY),
    icon(3, 2, 4, 4, 'clock', TEAL),
    txt(8, 2, 26, 4, 'Horário de funcionamento', { s: 2.9, c: '#ffffff', a: 'left' }),
    shape(3, 7, 28, 1, 'line', TEAL, { sw: 3 }),
    txt(3, 9, 16, 3, 'Segunda a sexta', { s: 1.9, c: '#cbd5e1', a: 'left', w: '600' }),
    txt(19, 9, 12, 3, '8h às 20h', { s: 2.3, c: '#ffffff', a: 'right' }),
    txt(3, 13, 16, 3, 'Sábado', { s: 1.9, c: '#cbd5e1', a: 'left', w: '600' }),
    txt(19, 13, 12, 3, '8h às 18h', { s: 2.3, c: '#ffffff', a: 'right' }),
    txt(3, 17, 16, 3, 'Domingo e feriados', { s: 1.9, c: '#cbd5e1', a: 'left', w: '600' }),
    txt(19, 17, 12, 3, '9h às 14h', { s: 2.3, c: '#ffffff', a: 'right' }),
    txt(3, 22, 28, 3, 'Atendimento pelo WhatsApp até as 22h', { s: 1.5, c: TEAL, a: 'left', w: '600' }),
    motion(33, 2, 14, 23, 'relogio-data', { rotulo: 'Estamos abertos' }, { fundo: '#112a42', hora: '#ffffff', data: TEAL }),
  ], ['horário', 'funcionamento', 'abre', 'fecha']),
  build('todos-horario-v', 'Horário de funcionamento', 'todos', 'vertical', [
    shape(0, 0, 27, 48, 'rect', NAVY),
    icon(2, 2, 5, 5, 'clock', TEAL),
    txt(8, 2, 17, 5, 'Horário de funcionamento', { s: 4.4, c: '#ffffff', a: 'left', lh: 1.05 }),
    shape(2, 8, 23, 1, 'line', TEAL, { sw: 3 }),
    txt(2, 10, 23, 3, 'Segunda a sexta', { s: 3.4, c: '#cbd5e1', a: 'left', w: '600' }),
    txt(2, 13, 23, 4, '8h às 20h', { s: 6, c: '#ffffff', a: 'left' }),
    txt(2, 18, 23, 3, 'Sábado', { s: 3.4, c: '#cbd5e1', a: 'left', w: '600' }),
    txt(2, 21, 23, 4, '8h às 18h', { s: 6, c: '#ffffff', a: 'left' }),
    txt(2, 26, 23, 3, 'Domingo e feriados', { s: 3.4, c: '#cbd5e1', a: 'left', w: '600' }),
    txt(2, 29, 23, 4, '9h às 14h', { s: 6, c: '#ffffff', a: 'left' }),
    motion(2, 35, 23, 11, 'relogio-data', { rotulo: 'Estamos abertos' }, { fundo: '#112a42', hora: '#ffffff', data: TEAL }),
  ], ['horário', 'funcionamento', 'abre', 'fecha']),

  build('todos-wifi-h', 'Wi-Fi e QR Code', 'todos', 'horizontal', [
    shape(0, 0, 48, 27, 'rect', NAVY),
    icon(4, 4, 6, 6, 'wifi', '#ffffff', { container: { shape: 'circle', color: TEAL, padding: 18 } }),
    txt(12, 4, 20, 6, 'Wi-Fi grátis para clientes', { s: 3.2, c: '#ffffff', a: 'left', lh: 1.05 }),
    txt(4, 12, 28, 3, 'Rede', { s: 1.7, c: '#94a3b8', a: 'left', w: '600' }),
    txt(4, 15, 28, 4, 'NomeDaSuaLoja', { s: 3.2, c: TEAL, a: 'left' }),
    txt(4, 19, 28, 3, 'Senha', { s: 1.7, c: '#94a3b8', a: 'left', w: '600' }),
    txt(4, 22, 28, 4, 'bemvindo2026', { s: 3.2, c: '#ffffff', a: 'left' }),
    motion(33, 3, 14, 21, 'qr-moldura', { titulo: 'Conecte pelo celular', legenda: 'Aponte a câmera' }, { fundo: '#112a42', moldura: TEAL, texto: '#ffffff' }),
  ], ['wifi', 'internet', 'senha', 'qr code']),
  build('todos-wifi-v', 'Wi-Fi e QR Code', 'todos', 'vertical', [
    shape(0, 0, 27, 48, 'rect', NAVY),
    icon(9, 3, 9, 9, 'wifi', '#ffffff', { container: { shape: 'circle', color: TEAL, padding: 18 } }),
    txt(2, 13, 23, 7, 'Wi-Fi grátis para clientes', { s: 6.4, c: '#ffffff', lh: 1.05 }),
    txt(2, 21, 23, 2, 'Rede', { s: 3, c: '#94a3b8', w: '600' }),
    txt(2, 23, 23, 4, 'NomeDaSuaLoja', { s: 6.4, c: TEAL }),
    txt(2, 28, 23, 2, 'Senha', { s: 3, c: '#94a3b8', w: '600' }),
    txt(2, 30, 23, 4, 'bemvindo2026', { s: 6.4, c: '#ffffff' }),
    motion(3, 35, 21, 12, 'qr-moldura', { titulo: 'Conecte pelo celular', legenda: 'Aponte a câmera' }, { fundo: '#112a42', moldura: TEAL, texto: '#ffffff' }),
  ], ['wifi', 'internet', 'senha', 'qr code']),

  build('todos-redes-h', 'Redes sociais e contato', 'todos', 'horizontal', [
    shape(0, 0, 48, 27, 'rect', NAVY),
    txt(3, 2, 30, 5, 'Fale com a gente', { s: 4.2, c: '#ffffff', a: 'left' }),
    txt(3, 7, 30, 3, 'Siga, chame e venha nos visitar', { s: 1.9, c: '#94a3b8', a: 'left', w: '500' }),
    icon(3, 11, 4, 4, 'instagram', '#ffffff', { container: { shape: 'rect', color: '#c026d3', padding: 14 } }),
    txt(9, 11, 22, 4, '@sualoja', { s: 2.6, c: '#ffffff', a: 'left', w: '700' }),
    icon(3, 16, 4, 4, 'whatsapp', '#ffffff', { container: { shape: 'rect', color: '#16a34a', padding: 14 } }),
    txt(9, 16, 22, 4, '(11) 90000-0000', { s: 2.6, c: '#ffffff', a: 'left', w: '700' }),
    icon(3, 21, 4, 4, 'map-pin', '#ffffff', { container: { shape: 'rect', color: '#e63946', padding: 14 } }),
    txt(9, 21, 22, 4, 'Rua das Flores, 123', { s: 2.6, c: '#ffffff', a: 'left', w: '700' }),
    motion(33, 3, 14, 21, 'qr-moldura', { titulo: 'Aponte a câmera', legenda: 'Abra nosso perfil' }, { fundo: '#112a42', moldura: TEAL, texto: '#ffffff' }),
  ], ['instagram', 'whatsapp', 'endereço', 'contato']),
  build('todos-redes-v', 'Redes sociais e contato', 'todos', 'vertical', [
    shape(0, 0, 27, 48, 'rect', NAVY),
    txt(2, 2, 23, 5, 'Fale com a gente', { s: 7.4, c: '#ffffff', a: 'left' }),
    txt(2, 7, 23, 3, 'Siga, chame e venha nos visitar', { s: 3.2, c: '#94a3b8', a: 'left', w: '500' }),
    icon(2, 12, 5, 5, 'instagram', '#ffffff', { container: { shape: 'rect', color: '#c026d3', padding: 14 } }),
    txt(8, 12, 17, 5, '@sualoja', { s: 4.4, c: '#ffffff', a: 'left', w: '700' }),
    icon(2, 19, 5, 5, 'whatsapp', '#ffffff', { container: { shape: 'rect', color: '#16a34a', padding: 14 } }),
    txt(8, 19, 17, 5, '(11) 90000-0000', { s: 3.6, c: '#ffffff', a: 'left', w: '700' }),
    icon(2, 26, 5, 5, 'map-pin', '#ffffff', { container: { shape: 'rect', color: '#e63946', padding: 14 } }),
    txt(8, 26, 17, 5, 'Rua das Flores, 123', { s: 3.6, c: '#ffffff', a: 'left', w: '700' }),
    motion(3, 33, 21, 14, 'qr-moldura', { titulo: 'Aponte a câmera', legenda: 'Abra nosso perfil' }, { fundo: '#112a42', moldura: TEAL, texto: '#ffffff' }),
  ], ['instagram', 'whatsapp', 'endereço', 'contato']),

  build('todos-promocao-h', 'Promoção com confete', 'todos', 'horizontal', [
    motion(0, 0, 48, 27, 'confete-promocao', { titulo: 'Promoção imperdível', sub: 'Só até domingo' }),
    motion(0, 22, 48, 5, 'letreiro', { texto: 'Aproveite as ofertas da semana' }, { fundo: '#f43f5e', texto: '#ffffff', marca: '#fde047' }),
  ], ['promoção', 'festa', 'confete']),
  build('todos-novidade-h', 'Novidade ou inauguração', 'todos', 'horizontal', [
    shape(0, 0, 48, 27, 'rect', '#1e1b4b'),
    icon(4, 3, 7, 7, 'festa', '#fde047'),
    txt(13, 3, 31, 7, 'Novidade na casa', { s: 5.4, c: '#ffffff', a: 'left' }),
    txt(4, 12, 40, 6, 'Conte aqui o que mudou e por que vale a visita. Poucas palavras funcionam melhor na TV.', { s: 2.3, c: '#c7d2fe', a: 'left', w: '500', lh: 1.25 }),
    motion(0, 19, 48, 7, 'faixa-novidade', { texto: 'Inaugurado', sub: 'Venha conhecer' }, { faixa: '#7c3aed', texto: '#ffffff', detalhe: '#fde047' }),
  ], ['novidade', 'inauguração', 'lançamento']),
];

/* ------------------------------------------------------------------ */
/* Lista final                                                         */
/* ------------------------------------------------------------------ */

export const SCENE_TEMPLATES: SceneTemplate[] = [
  ...PROFILES.flatMap(p => [ofertaH(p), listaH(p), cardsH(p), destaqueH(p), relampagoH(p), ofertaV(p), listaV(p), cardsV(p), destaqueV(p)]),
  ...geral,
];
