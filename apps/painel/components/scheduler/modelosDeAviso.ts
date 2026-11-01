/**
 * Modelos de aviso do assistente "Nova publicação" (Agendar publicação).
 *
 * Oito modelos, cada um em 16:9 (grade 48×27) e 9:16 (grade 27×48). Todo item é um widget
 * comum (TEXT, SHAPE, ICON, IMAGE, MOTION), montado com as mesmas funções de
 * `editor/presets/sceneTemplates.ts`, então o cliente edita tudo no editor depois.
 * A ordem dos itens vira o `zIndex` (o primeiro é o fundo) e os ids são gerados na aplicação.
 *
 * Tamanho de texto em cqw: na vertical 1 cqw vale 10,8 px; na horizontal, 19,2 px.
 * Texto: pt-BR, sem travessão, sem promessa de resultado, exemplos de comércio em geral.
 */
import { WidgetType, type LayoutItem } from '../../types';
import { txt, shape, icon, motion } from '../editor/presets/sceneTemplates';

export type ItemDeModelo = Omit<LayoutItem, 'i'>;

export interface ModeloDeAviso {
  id: string;
  titulo: string;
  descricao: string;
  /** Cor de destaque do cartão no assistente. */
  cor: string;
  horizontal: ItemDeModelo[];
  vertical: ItemDeModelo[];
}

const MARCA = '#0369a1';
const MARCA_ESCURA = '#075985';
const TINTA = '#0a1223';
const BRANCO = '#ffffff';
const CLARO = '#f8fafc';
const CINZA = '#cbd5e1';
const TEXTO = '#334155';
const ALERTA = '#dc2626';
const AMARELO = '#facc15';

/** Vaga de imagem vazia: o editor mostra "Imagem" e o cliente troca pela foto ou pelo logo. */
const vaga = (x: number, y: number, w: number, h: number, ajuste: 'cover' | 'contain' = 'cover'): ItemDeModelo => ({
  x, y, w, h, type: WidgetType.IMAGE,
  data: {
    url: '', padding: '0', fillContainer: true, contentAlignment: 'stretch', fitContainerMode: ajuste,
    imageConfig: { objectFit: ajuste, scale: 1 },
  },
});

const fundoH = (cor: string) => shape(0, 0, 48, 27, 'rect', cor);
const fundoV = (cor: string) => shape(0, 0, 27, 48, 'rect', cor);

export const MODELOS_DE_AVISO: ModeloDeAviso[] = [
  {
    id: 'aviso-urgente',
    titulo: 'Aviso urgente',
    descricao: 'Recado que não pode esperar',
    cor: ALERTA,
    horizontal: [
      fundoH(TINTA),
      shape(0, 0, 48, 3, 'rect', AMARELO),
      txt(0, 0, 48, 3, 'AVISO URGENTE', { s: 1.6, c: TINTA, w: '900', ls: 0.12 }),
      motion(4, 5, 40, 9, 'oferta-pulso', { titulo: 'Atenção', preco: 'Aviso importante' }, { fundo: ALERTA, destaque: AMARELO }),
      txt(4, 15, 40, 5, 'O caixa 3 está fora de funcionamento hoje.', { s: 3.2, c: BRANCO, w: '800' }),
      txt(4, 20, 40, 3, 'Use os outros caixas. Obrigado pela compreensão.', { s: 1.8, c: CINZA, w: '600' }),
      shape(0, 24, 48, 3, 'rect', AMARELO),
    ],
    vertical: [
      fundoV(TINTA),
      shape(0, 0, 27, 4, 'rect', AMARELO),
      txt(0, 0, 27, 4, 'AVISO URGENTE', { s: 4.6, c: TINTA, w: '900', ls: 0.1 }),
      motion(2, 6, 23, 12, 'oferta-pulso', { titulo: 'Atenção', preco: 'Aviso importante' }, { fundo: ALERTA, destaque: AMARELO }),
      icon(10, 19, 7, 7, 'alerta', AMARELO),
      txt(2, 27, 23, 10, 'O caixa 3 está fora de funcionamento hoje.', { s: 7.4, c: BRANCO, w: '800', lh: 1.15 }),
      txt(2, 37, 23, 6, 'Use os outros caixas. Obrigado pela compreensão.', { s: 4.4, c: CINZA, w: '600', lh: 1.25 }),
      shape(0, 45, 27, 3, 'rect', AMARELO),
    ],
  },
  {
    id: 'promocao-relampago',
    titulo: 'Promoção relâmpago',
    descricao: 'Oferta com prazo curto',
    cor: '#ea580c',
    horizontal: [
      fundoH(TINTA),
      shape(0, 0, 20, 27, 'rect', ALERTA),
      icon(6, 2, 8, 7, 'raio', AMARELO, { filled: true }),
      txt(1, 10, 18, 6, 'Promoção relâmpago', { s: 3.4, c: BRANCO, w: '900', lh: 1.05 }),
      txt(1, 17, 18, 6, '20% de desconto em toda a loja', { s: 2, c: '#fde68a', w: '700', lh: 1.2 }),
      motion(22, 3, 24, 16, 'contagem-regressiva', { titulo: 'Termina em', hora: '18:00', fim: 'Promoção encerrada' }, { fundo: TINTA, numero: AMARELO, texto: BRANCO }),
      txt(22, 20, 24, 4, 'Válido só hoje, enquanto durar o estoque.', { s: 1.6, c: CINZA, w: '600' }),
    ],
    vertical: [
      fundoV(TINTA),
      shape(0, 0, 27, 17, 'rect', ALERTA),
      icon(10, 1, 7, 5, 'raio', AMARELO, { filled: true }),
      txt(1, 6, 25, 6, 'Promoção relâmpago', { s: 9, c: BRANCO, w: '900', lh: 1.05 }),
      txt(1, 12, 25, 4, '20% de desconto em toda a loja', { s: 5, c: '#fde68a', w: '700' }),
      motion(1, 19, 25, 17, 'contagem-regressiva', { titulo: 'Termina em', hora: '18:00', fim: 'Promoção encerrada' }, { fundo: TINTA, numero: AMARELO, texto: BRANCO }),
      txt(1, 38, 25, 6, 'Válido só hoje, enquanto durar o estoque.', { s: 4.4, c: CINZA, w: '600', lh: 1.25 }),
    ],
  },
  {
    id: 'comunicado',
    titulo: 'Comunicado',
    descricao: 'Recado geral para clientes ou equipe',
    cor: MARCA,
    horizontal: [
      fundoH(CLARO),
      shape(0, 0, 48, 4, 'rect', MARCA),
      txt(3, 0, 30, 4, 'COMUNICADO', { s: 1.6, c: BRANCO, w: '800', a: 'left', ls: 0.1 }),
      vaga(37, 6, 8, 6, 'contain'),
      txt(3, 6, 33, 6, 'Novo horário de atendimento', { s: 3.6, c: TINTA, w: '900', a: 'left', lh: 1.05 }),
      shape(3, 13, 6, 1, 'pill', MARCA),
      txt(3, 15, 40, 7, 'A partir de segunda, abrimos das 8h às 20h. Aos domingos, das 9h às 13h.', { s: 2.1, c: TEXTO, w: '600', a: 'left', lh: 1.3 }),
      txt(3, 23, 40, 2, 'A gerência', { s: 1.4, c: MARCA, w: '700', a: 'left' }),
    ],
    vertical: [
      fundoV(CLARO),
      shape(0, 0, 27, 5, 'rect', MARCA),
      txt(1, 0, 25, 5, 'COMUNICADO', { s: 4.6, c: BRANCO, w: '800', ls: 0.1 }),
      vaga(8, 7, 11, 6, 'contain'),
      txt(2, 15, 23, 9, 'Novo horário de atendimento', { s: 8.4, c: TINTA, w: '900', lh: 1.05 }),
      shape(10, 25, 7, 1, 'pill', MARCA),
      txt(2, 27, 23, 13, 'A partir de segunda, abrimos das 8h às 20h. Aos domingos, das 9h às 13h.', { s: 5, c: TEXTO, w: '600', lh: 1.3 }),
      txt(2, 42, 23, 3, 'A gerência', { s: 4, c: MARCA, w: '700' }),
    ],
  },
  {
    id: 'horario-especial',
    titulo: 'Horário especial',
    descricao: 'Feriado ou horário reduzido',
    cor: '#0891b2',
    horizontal: [
      fundoH(MARCA),
      motion(2, 3, 18, 21, 'relogio-data', { rotulo: 'Agora são' }, { fundo: TINTA, hora: BRANCO, data: '#7dd3fc' }),
      txt(22, 3, 24, 5, 'Horário especial de feriado', { s: 2.8, c: BRANCO, w: '900', a: 'left', lh: 1.05 }),
      shape(22, 9, 24, 4, 'rounded', BRANCO, { opacity: 0.12 }),
      txt(23, 9, 12, 4, 'Véspera do feriado', { s: 1.6, c: BRANCO, w: '700', a: 'left' }),
      txt(34, 9, 11, 4, '8h às 13h', { s: 1.7, c: AMARELO, w: '800', a: 'right' }),
      shape(22, 14, 24, 4, 'rounded', BRANCO, { opacity: 0.12 }),
      txt(23, 14, 12, 4, 'No feriado', { s: 1.6, c: BRANCO, w: '700', a: 'left' }),
      txt(34, 14, 11, 4, 'Fechado', { s: 1.7, c: AMARELO, w: '800', a: 'right' }),
      shape(22, 19, 24, 4, 'rounded', BRANCO, { opacity: 0.12 }),
      txt(23, 19, 12, 4, 'Dia seguinte', { s: 1.6, c: BRANCO, w: '700', a: 'left' }),
      txt(34, 19, 11, 4, '9h às 18h', { s: 1.7, c: AMARELO, w: '800', a: 'right' }),
      txt(22, 23, 24, 3, 'Nos outros dias, horário normal.', { s: 1.2, c: '#e0f2fe', w: '600', a: 'left' }),
    ],
    vertical: [
      fundoV(MARCA),
      motion(3, 2, 21, 14, 'relogio-data', { rotulo: 'Agora são' }, { fundo: TINTA, hora: BRANCO, data: '#7dd3fc' }),
      txt(1, 17, 25, 6, 'Horário especial de feriado', { s: 8, c: BRANCO, w: '900', lh: 1.05 }),
      shape(1, 24, 25, 5, 'rounded', BRANCO, { opacity: 0.12 }),
      txt(2, 24, 14, 5, 'Véspera do feriado', { s: 4.4, c: BRANCO, w: '700', a: 'left' }),
      txt(15, 24, 10, 5, '8h às 13h', { s: 4.6, c: AMARELO, w: '800', a: 'right' }),
      shape(1, 30, 25, 5, 'rounded', BRANCO, { opacity: 0.12 }),
      txt(2, 30, 14, 5, 'No feriado', { s: 4.4, c: BRANCO, w: '700', a: 'left' }),
      txt(15, 30, 10, 5, 'Fechado', { s: 4.6, c: AMARELO, w: '800', a: 'right' }),
      shape(1, 36, 25, 5, 'rounded', BRANCO, { opacity: 0.12 }),
      txt(2, 36, 14, 5, 'Dia seguinte', { s: 4.4, c: BRANCO, w: '700', a: 'left' }),
      txt(15, 36, 10, 5, '9h às 18h', { s: 4.6, c: AMARELO, w: '800', a: 'right' }),
      txt(1, 42, 25, 4, 'Nos outros dias, horário normal.', { s: 3.8, c: '#e0f2fe', w: '600' }),
    ],
  },
  {
    id: 'fechado-temporariamente',
    titulo: 'Fechado temporariamente',
    descricao: 'Manutenção ou pausa com hora de volta',
    cor: '#475569',
    horizontal: [
      fundoH(TINTA),
      icon(20, 2, 8, 7, 'clock', AMARELO),
      txt(4, 10, 40, 5, 'Fechado temporariamente', { s: 4, c: BRANCO, w: '900' }),
      txt(4, 15, 40, 3, 'Estamos em manutenção. Pedimos desculpas pelo transtorno.', { s: 1.8, c: CINZA, w: '600' }),
      shape(14, 19, 20, 5, 'pill', AMARELO),
      txt(14, 19, 20, 5, 'Voltamos às 14h', { s: 2.4, c: TINTA, w: '900' }),
    ],
    vertical: [
      fundoV(TINTA),
      icon(8, 4, 11, 10, 'clock', AMARELO),
      txt(1, 16, 25, 10, 'Fechado temporariamente', { s: 10, c: BRANCO, w: '900', lh: 1.05 }),
      txt(2, 27, 23, 7, 'Estamos em manutenção. Pedimos desculpas pelo transtorno.', { s: 4.8, c: CINZA, w: '600', lh: 1.25 }),
      shape(3, 36, 21, 6, 'pill', AMARELO),
      txt(3, 36, 21, 6, 'Voltamos às 14h', { s: 6.5, c: TINTA, w: '900' }),
    ],
  },
  {
    id: 'produto-chegou-ou-esgotou',
    titulo: 'Produto esgotado ou chegou',
    descricao: 'Estoque: troque o selo para ESGOTOU quando acabar',
    cor: '#16a34a',
    horizontal: [
      fundoH(CLARO),
      shape(2, 2, 22, 23, 'rounded', '#e2e8f0'),
      vaga(3, 3, 20, 21),
      motion(17, 1, 9, 9, 'selo-girando', { texto: 'CHEGOU', sub: 'novidade' }, { selo: ALERTA, borda: AMARELO, texto: BRANCO }),
      txt(27, 4, 19, 3, 'NOVIDADE NA LOJA', { s: 1.4, c: MARCA, w: '800', a: 'left', ls: 0.1 }),
      txt(27, 7, 19, 8, 'Chegou o novo lote de tênis de corrida', { s: 3, c: TINTA, w: '900', a: 'left', lh: 1.1 }),
      txt(27, 15, 19, 4, 'Todos os tamanhos disponíveis.', { s: 1.8, c: TEXTO, w: '600', a: 'left' }),
      shape(27, 20, 15, 4, 'pill', MARCA),
      txt(27, 20, 15, 4, 'Peça ao atendente', { s: 1.6, c: BRANCO, w: '800' }),
    ],
    vertical: [
      fundoV(CLARO),
      shape(2, 2, 23, 22, 'rounded', '#e2e8f0'),
      vaga(3, 3, 21, 20),
      motion(17, 1, 9, 9, 'selo-girando', { texto: 'CHEGOU', sub: 'novidade' }, { selo: ALERTA, borda: AMARELO, texto: BRANCO }),
      txt(2, 25, 23, 3, 'NOVIDADE NA LOJA', { s: 4, c: MARCA, w: '800', ls: 0.1 }),
      txt(2, 28, 23, 9, 'Chegou o novo lote de tênis de corrida', { s: 8, c: TINTA, w: '900', lh: 1.1 }),
      txt(2, 37, 23, 4, 'Todos os tamanhos disponíveis.', { s: 4.6, c: TEXTO, w: '600' }),
      shape(4, 42, 19, 4, 'pill', MARCA),
      txt(4, 42, 19, 4, 'Peça ao atendente', { s: 4.6, c: BRANCO, w: '800' }),
    ],
  },
  {
    id: 'evento',
    titulo: 'Evento',
    descricao: 'Hoje tem, inauguração, lançamento',
    cor: '#7c3aed',
    horizontal: [
      fundoH(TINTA),
      txt(3, 3, 30, 3, 'HOJE TEM', { s: 1.8, c: AMARELO, w: '900', a: 'left', ls: 0.12 }),
      txt(3, 6, 29, 8, 'Tarde de degustação de cafés especiais', { s: 3.6, c: BRANCO, w: '900', a: 'left', lh: 1.05 }),
      shape(3, 15, 13, 6, 'rounded', MARCA),
      icon(4, 16, 3, 4, 'calendario', BRANCO),
      txt(7, 15, 9, 6, 'Sábado', { s: 1.7, c: BRANCO, w: '800', a: 'left' }),
      shape(17, 15, 15, 6, 'rounded', MARCA),
      icon(18, 16, 3, 4, 'clock', BRANCO),
      txt(21, 15, 11, 6, 'Das 15h às 18h', { s: 1.7, c: BRANCO, w: '800', a: 'left' }),
      motion(34, 5, 12, 16, 'chamada-brilho', { texto: 'Entrada livre', sub: 'Venha participar' }, { botao: ALERTA, texto: BRANCO, brilho: 'rgba(255,255,255,0.5)' }),
      shape(0, 24, 48, 3, 'rect', AMARELO),
      txt(0, 24, 48, 3, 'Rua das Flores, 120, Centro', { s: 1.4, c: TINTA, w: '800' }),
    ],
    vertical: [
      fundoV(TINTA),
      txt(1, 2, 25, 4, 'HOJE TEM', { s: 5, c: AMARELO, w: '900', ls: 0.12 }),
      txt(1, 6, 25, 13, 'Tarde de degustação de cafés especiais', { s: 9, c: BRANCO, w: '900', lh: 1.05 }),
      shape(2, 20, 23, 5, 'rounded', MARCA),
      icon(3, 20, 4, 5, 'calendario', BRANCO),
      txt(8, 20, 16, 5, 'Sábado', { s: 5.5, c: BRANCO, w: '800', a: 'left' }),
      shape(2, 26, 23, 5, 'rounded', MARCA),
      icon(3, 26, 4, 5, 'clock', BRANCO),
      txt(8, 26, 16, 5, 'Das 15h às 18h', { s: 5.5, c: BRANCO, w: '800', a: 'left' }),
      motion(2, 33, 23, 10, 'chamada-brilho', { texto: 'Entrada livre', sub: 'Venha participar' }, { botao: ALERTA, texto: BRANCO, brilho: 'rgba(255,255,255,0.5)' }),
      txt(1, 44, 25, 3, 'Rua das Flores, 120, Centro', { s: 4, c: CINZA, w: '700' }),
    ],
  },
  {
    id: 'boas-vindas',
    titulo: 'Boas-vindas',
    descricao: 'Visita ou cliente especial, com nome editável',
    cor: MARCA_ESCURA,
    horizontal: [
      fundoH(MARCA),
      shape(36, 0, 12, 27, 'rect', MARCA_ESCURA),
      icon(38, 9, 8, 9, 'aperto-mao', BRANCO),
      txt(3, 6, 31, 3, 'BOAS-VINDAS', { s: 1.6, c: '#bae6fd', w: '800', a: 'left', ls: 0.12 }),
      txt(3, 9, 31, 7, 'Maria Souza', { s: 5.5, c: BRANCO, w: '900', a: 'left' }),
      txt(3, 16, 31, 4, 'É um prazer receber você hoje.', { s: 2.2, c: '#e0f2fe', w: '600', a: 'left' }),
      shape(3, 21, 6, 1, 'pill', AMARELO),
    ],
    vertical: [
      fundoV(MARCA),
      shape(0, 31, 27, 17, 'rect', MARCA_ESCURA),
      icon(9, 34, 9, 10, 'aperto-mao', BRANCO),
      txt(1, 5, 25, 4, 'BOAS-VINDAS', { s: 5, c: '#bae6fd', w: '800', ls: 0.12 }),
      txt(1, 10, 25, 10, 'Maria Souza', { s: 11, c: BRANCO, w: '900', lh: 1.05 }),
      txt(2, 21, 23, 6, 'É um prazer receber você hoje.', { s: 5.5, c: '#e0f2fe', w: '600', lh: 1.2 }),
      shape(10, 28, 7, 1, 'pill', AMARELO),
    ],
  },
];

export const buscarModelo = (id: string | null | undefined): ModeloDeAviso | undefined =>
  id ? MODELOS_DE_AVISO.find(m => m.id === id) : undefined;

const novoId = () => Math.random().toString(36).slice(2, 11);

/**
 * Layout pronto para a cena: ids novos e `zIndex` pela ordem (10, 11, 12...).
 * Modelo inexistente ou "Em branco" (`null`) devolve cena vazia.
 */
export function layoutDoModelo(id: string | null | undefined, orientation: 'horizontal' | 'vertical'): LayoutItem[] {
  const modelo = buscarModelo(id);
  if (!modelo) return [];
  const itens = orientation === 'vertical' ? modelo.vertical : modelo.horizontal;
  return itens.map((item, index) => ({
    ...item,
    i: novoId(),
    data: { ...item.data, zIndex: 10 + index },
  }));
}
