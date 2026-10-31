import React from 'react';
import {
  Star, Heart, ShoppingCart, ShoppingBag, ShoppingBasket, Tag, Tags, Percent, Gift, Phone, Smartphone, MapPin, Clock, Wifi, QrCode,
  Instagram, Facebook, Youtube, Twitter, Linkedin, MessageCircle, Mail, Globe, Pizza, Coffee, Croissant, UtensilsCrossed,
  Sandwich, IceCream, Beer, Wine, Store, Truck, CreditCard, BadgePercent, Flame, Sparkles, Check, ArrowRight, ArrowLeft,
  ArrowUp, ArrowDown, ChevronsRight, Banknote, Wallet, Receipt, Package, PackageCheck, Shirt, Watch, Gem, Crown, Award,
  Trophy, ThumbsUp, Megaphone, Bell, BellRing, Info, TriangleAlert, CircleAlert, Ban, CigaretteOff, Accessibility, Baby,
  CircleParking, Hourglass, Calendar, CalendarDays, Timer, AlarmClock, Sun, Moon, Cake, CakeSlice, Cherry, Apple, Carrot,
  Fish, Beef, Egg, Milk, Salad, Soup, Cookie, Candy, Donut, Wheat, Popcorn, Utensils, Martini, CupSoda, Drumstick, Banana,
  Grape, Citrus, ChefHat, Bike, Send, Navigation, Link2, Share2, Zap, Rocket, DollarSign, Coins, PiggyBank, BadgeCheck,
  CircleCheck, CircleX, Barcode, Ticket, TicketPercent, Building2, Users, Smile, PartyPopper, Handshake, ScanLine,
} from 'lucide-react';
import type { WidgetData } from '../../types';
import { getContainerStyle, getEffectFilter } from '../editor/widgetStyles';

type IconComponent = React.ComponentType<any>;

export interface IconEntry {
  /** Chave salva em `iconConfig.name`. */
  key: string;
  label: string;
  /** Palavras extras para a busca (sem acento, minúsculas). */
  keywords: string;
  Icon: IconComponent;
}

export interface IconGroup {
  id: string;
  label: string;
  icons: IconEntry[];
}

const i = (key: string, label: string, keywords: string, Icon: IconComponent): IconEntry => ({ key, label, keywords, Icon });

/**
 * Catálogo de ícones flat por grupo. As chaves do primeiro lote (star, heart,
 * shopping-cart...) já existem em cenas salvas e não podem mudar.
 */
export const ICON_GROUPS: IconGroup[] = [
  {
    id: 'comercio', label: 'Comércio e ofertas', icons: [
      i('loja', 'Loja', 'comercio balcao fachada', Store),
      i('shopping-cart', 'Carrinho', 'compras mercado supermercado', ShoppingCart),
      i('shopping-bag', 'Sacola', 'compras loja', ShoppingBag),
      i('cesta', 'Cesta', 'compras mercado feira', ShoppingBasket),
      i('tag', 'Etiqueta', 'preco oferta promocao', Tag),
      i('etiquetas', 'Etiquetas', 'precos ofertas', Tags),
      i('percent', 'Porcentagem', 'desconto oferta', Percent),
      i('desconto', 'Selo de desconto', 'promocao oferta', BadgePercent),
      i('cupom', 'Cupom', 'ingresso desconto voucher', TicketPercent),
      i('ingresso', 'Ingresso', 'entrada ticket', Ticket),
      i('gift', 'Presente', 'brinde promocao', Gift),
      i('pacote', 'Pacote', 'produto caixa encomenda', Package),
      i('pacote-ok', 'Pedido pronto', 'entregue produto caixa', PackageCheck),
      i('entrega', 'Entrega', 'delivery caminhao frete', Truck),
      i('moto', 'Moto entrega', 'delivery bicicleta motoboy', Bike),
      i('camisa', 'Roupa', 'moda camisa vestuario', Shirt),
      i('relogio-pulso', 'Relógio de pulso', 'acessorio joia', Watch),
      i('joia', 'Joia', 'diamante luxo', Gem),
      i('coroa', 'Coroa', 'premium vip destaque', Crown),
      i('premio', 'Prêmio', 'qualidade certificado', Award),
      i('trofeu', 'Troféu', 'campeao melhor', Trophy),
      i('codigo-barras', 'Código de barras', 'produto leitor', Barcode),
      i('leitor', 'Leitor', 'scanner preco consulta', ScanLine),
      i('predio', 'Prédio', 'empresa shopping andar', Building2),
      i('clientes', 'Clientes', 'pessoas equipe grupo', Users),
    ],
  },
  {
    id: 'comida', label: 'Comida e bebida', icons: [
      i('pizza', 'Pizza', 'pizzaria fatia', Pizza),
      i('sanduiche', 'Sanduíche', 'lanche hamburguer', Sandwich),
      i('croissant', 'Croissant', 'padaria pao', Croissant),
      i('pao', 'Trigo', 'padaria pao farinha', Wheat),
      i('bolo', 'Bolo', 'aniversario confeitaria doce', Cake),
      i('fatia-bolo', 'Fatia de bolo', 'sobremesa doce', CakeSlice),
      i('donut', 'Rosquinha', 'doce padaria', Donut),
      i('biscoito', 'Biscoito', 'cookie doce', Cookie),
      i('bala', 'Bala', 'doce', Candy),
      i('sorvete', 'Sorvete', 'gelado sobremesa', IceCream),
      i('pipoca', 'Pipoca', 'cinema lanche', Popcorn),
      i('talheres', 'Talheres', 'restaurante refeicao almoco', UtensilsCrossed),
      i('talher', 'Garfo e faca', 'restaurante prato', Utensils),
      i('chef', 'Chef', 'cozinha restaurante cozinheiro', ChefHat),
      i('sopa', 'Sopa', 'prato caldo', Soup),
      i('salada', 'Salada', 'saudavel vegetal', Salad),
      i('carne', 'Carne', 'churrasco acougue', Beef),
      i('frango', 'Frango', 'coxa assado', Drumstick),
      i('peixe', 'Peixe', 'frutos do mar', Fish),
      i('ovo', 'Ovo', 'cafe da manha', Egg),
      i('leite', 'Leite', 'laticinio', Milk),
      i('maca', 'Maçã', 'fruta hortifruti', Apple),
      i('cenoura', 'Cenoura', 'legume hortifruti', Carrot),
      i('banana', 'Banana', 'fruta hortifruti', Banana),
      i('uva', 'Uva', 'fruta hortifruti', Grape),
      i('cereja', 'Cereja', 'fruta', Cherry),
      i('laranja', 'Laranja', 'citrico fruta suco', Citrus),
      i('coffee', 'Café', 'xicara cafeteria', Coffee),
      i('refrigerante', 'Refrigerante', 'copo bebida suco', CupSoda),
      i('cerveja', 'Cerveja', 'chopp bar', Beer),
      i('vinho', 'Vinho', 'taca adega', Wine),
      i('drinque', 'Drinque', 'coquetel bar', Martini),
    ],
  },
  {
    id: 'pagamento', label: 'Pagamento', icons: [
      i('cartao', 'Cartão', 'credito debito maquininha', CreditCard),
      i('dinheiro', 'Dinheiro', 'nota especie cedula', Banknote),
      i('carteira', 'Carteira', 'pagamento pix', Wallet),
      i('cifrao', 'Cifrão', 'preco valor real', DollarSign),
      i('moedas', 'Moedas', 'troco economia', Coins),
      i('cofrinho', 'Cofrinho', 'economia poupar', PiggyBank),
      i('recibo', 'Recibo', 'nota fiscal cupom', Receipt),
      i('qr-code', 'QR Code', 'pix pagamento cardapio', QrCode),
    ],
  },
  {
    id: 'redes', label: 'Redes sociais e contato', icons: [
      i('instagram', 'Instagram', 'rede social perfil arroba', Instagram),
      i('facebook', 'Facebook', 'rede social pagina', Facebook),
      i('youtube', 'YouTube', 'video canal', Youtube),
      i('twitter', 'X / Twitter', 'rede social', Twitter),
      i('linkedin', 'LinkedIn', 'rede social profissional', Linkedin),
      i('whatsapp', 'WhatsApp', 'mensagem conversa contato zap', MessageCircle),
      i('phone', 'Telefone', 'ligar contato fone', Phone),
      i('celular', 'Celular', 'smartphone app', Smartphone),
      i('mail', 'E-mail', 'contato carta', Mail),
      i('globe', 'Site', 'internet globo web', Globe),
      i('wifi', 'Wi-Fi', 'internet rede sem fio', Wifi),
      i('map-pin', 'Localização', 'endereco mapa pin', MapPin),
      i('rota', 'Rota', 'navegacao como chegar', Navigation),
      i('enviar', 'Enviar', 'mensagem aviao', Send),
      i('link', 'Link', 'endereco url', Link2),
      i('compartilhar', 'Compartilhar', 'divulgar', Share2),
    ],
  },
  {
    id: 'avisos', label: 'Avisos e destaques', icons: [
      i('star', 'Estrela', 'favorito avaliacao destaque', Star),
      i('heart', 'Coração', 'amor favorito curtir', Heart),
      i('fogo', 'Fogo', 'quente oferta destaque hot', Flame),
      i('brilho', 'Brilho', 'novo novidade destaque', Sparkles),
      i('raio', 'Raio', 'rapido energia relampago', Zap),
      i('foguete', 'Foguete', 'lancamento novo', Rocket),
      i('festa', 'Festa', 'comemoracao inauguracao', PartyPopper),
      i('sorriso', 'Sorriso', 'cliente feliz', Smile),
      i('joinha', 'Joinha', 'aprovado curtir', ThumbsUp),
      i('megafone', 'Megafone', 'aviso anuncio comunicado', Megaphone),
      i('sino', 'Sino', 'aviso notificacao', Bell),
      i('sino-toque', 'Sino tocando', 'alerta atencao', BellRing),
      i('info', 'Informação', 'aviso ajuda', Info),
      i('atencao', 'Atenção', 'cuidado perigo alerta', TriangleAlert),
      i('alerta', 'Alerta', 'aviso circulo', CircleAlert),
      i('proibido', 'Proibido', 'nao permitido', Ban),
      i('nao-fumar', 'Proibido fumar', 'cigarro aviso', CigaretteOff),
      i('acessivel', 'Acessibilidade', 'cadeirante prioridade', Accessibility),
      i('bebe', 'Bebê', 'fraldario familia crianca', Baby),
      i('estacionamento', 'Estacionamento', 'vaga carro parking', CircleParking),
      i('aperto-mao', 'Parceria', 'acordo cumprimento', Handshake),
      i('selo-ok', 'Selo verificado', 'aprovado garantia', BadgeCheck),
      i('check', 'Confirmado', 'certo ok', Check),
      i('check-circulo', 'Confirmado em círculo', 'certo ok', CircleCheck),
      i('x-circulo', 'Cancelado', 'errado fechado', CircleX),
    ],
  },
  {
    id: 'setas', label: 'Setas', icons: [
      i('seta', 'Seta para a direita', 'proximo direita', ArrowRight),
      i('seta-esq', 'Seta para a esquerda', 'voltar esquerda', ArrowLeft),
      i('seta-cima', 'Seta para cima', 'subir', ArrowUp),
      i('seta-baixo', 'Seta para baixo', 'descer', ArrowDown),
      i('setas-duplas', 'Setas duplas', 'avancar adiante', ChevronsRight),
    ],
  },
  {
    id: 'horario', label: 'Horário e datas', icons: [
      i('clock', 'Relógio', 'hora horario funcionamento', Clock),
      i('despertador', 'Despertador', 'hora alarme', AlarmClock),
      i('ampulheta', 'Ampulheta', 'tempo espera ultimas', Hourglass),
      i('cronometro', 'Cronômetro', 'tempo contagem', Timer),
      i('calendario', 'Calendário', 'data dia', Calendar),
      i('calendario-dias', 'Agenda', 'datas semana', CalendarDays),
      i('sol', 'Sol', 'dia aberto manha', Sun),
      i('lua', 'Lua', 'noite fechado', Moon),
    ],
  },
];

/** Lista plana (com o grupo) usada na busca do painel. */
export const ICON_LIST: (IconEntry & { groupId: string; groupLabel: string })[] = ICON_GROUPS.flatMap(g =>
  g.icons.map(icon => ({ ...icon, groupId: g.id, groupLabel: g.label })));

/** Catálogo chave -> componente. Chave salva em `iconConfig.name`. */
export const ICON_CATALOG: Record<string, IconComponent> = Object.fromEntries(ICON_LIST.map(e => [e.key, e.Icon]));

export const IconWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const cfg = data.iconConfig || { name: 'star' };
  const Icon = ICON_CATALOG[cfg.name] || Star;
  const color = cfg.color || '#ffffff';
  const container = getContainerStyle(data.effects);
  const filter = getEffectFilter(data.effects);
  const icon = (
    <Icon
      color={color}
      fill={cfg.variant === 'filled' ? color : 'none'}
      strokeWidth={cfg.strokeWidth ?? 2}
      style={{ width: '100%', height: '100%', filter: container ? undefined : filter }}
      aria-hidden="true"
    />
  );
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ padding: '6%', containerType: 'size' }}>
      {container ? <div style={{ ...container, filter }}>{icon}</div> : icon}
    </div>
  );
};
