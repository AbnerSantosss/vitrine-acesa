/**
 * Presets de motion design (HTML/CSS/JS, mesma linguagem do HyperFrames).
 * Contrato: `MOTION_PRESETS`, `getMotionPreset(id)` e `buildMotionHtml(config)`.
 * Todo texto e toda cor do preset ficam em `fields`/`colors`, para o cliente
 * editar 100% sem tocar em código.
 *
 * Regras de segurança (o preset roda num iframe `sandbox="allow-scripts"`):
 * - todo valor digitado entra no HTML só por `escapeHtml`, `safeColor` ou `safeUrl`;
 * - os scripts não montam HTML com texto do cliente: leem `data-*` e usam `textContent`.
 * Regras de desempenho (TV barata): só `transform` e `opacity` nas animações, sem
 * bibliotecas, e `prefers-reduced-motion` desliga as animações.
 */
import type { WidgetData } from '../../../types';

export interface MotionField { key: string; label: string; kind: 'text' | 'image' | 'price'; default: string }
export interface MotionColor { key: string; label: string; default: string }
export interface MotionPreset {
  id: string;
  title: string;
  /** Texto curto para a galeria. */
  description?: string;
  segment: string[];
  orientation: 'any' | 'horizontal' | 'vertical';
  fields: MotionField[];
  colors: MotionColor[];
  /** HTML com {{campo}} e {{cor.chave}}; o valor é escapado antes de entrar. */
  template: string;
}

const ALL = ['todos'];

export const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'oferta-pulso',
    title: 'Oferta pulsando',
    description: 'Chamada e preço grande que pulsa.',
    segment: ALL,
    orientation: 'any',
    fields: [
      { key: 'titulo', label: 'Chamada', kind: 'text', default: 'Oferta do dia' },
      { key: 'preco', label: 'Preço', kind: 'price', default: 'R$ 9,90' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo', default: '#083d65' },
      { key: 'destaque', label: 'Destaque', default: '#02c2cd' },
    ],
    template: '<style>html,body{background:{{cor.fundo}};color:#fff}main{height:100%;display:grid;place-items:center;text-align:center}h1{font-size:12vmin;margin:0;animation:in 1s ease-out both}b{display:inline-block;margin-top:4vmin;font-size:16vmin;color:{{cor.destaque}};animation:pulse calc(1.6s/var(--v)) ease-in-out infinite}@keyframes in{from{opacity:0;transform:translateY(6vmin)}}@keyframes pulse{50%{transform:scale(1.08)}}</style><main><div><h1>{{titulo}}</h1><b>{{preco}}</b></div></main>',
  },
  {
    id: 'letreiro',
    title: 'Letreiro rolando',
    description: 'Faixa com texto correndo na horizontal.',
    segment: ALL,
    orientation: 'horizontal',
    fields: [
      { key: 'texto', label: 'Mensagem', kind: 'text', default: 'Peça pelo WhatsApp e receba em casa' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo da faixa', default: '#e63946' },
      { key: 'texto', label: 'Letra', default: '#ffffff' },
      { key: 'marca', label: 'Marcador', default: '#ffd166' },
    ],
    template: `<style>
body{display:flex;align-items:center}
.faixa{width:100%;height:100%;background:{{cor.fundo}};color:{{cor.texto}};overflow:hidden;display:flex;align-items:center}
.trilho{display:flex;width:max-content;animation:rola calc(18s/var(--v)) linear infinite;will-change:transform}
.item{display:flex;align-items:center;white-space:nowrap;font-weight:800;font-size:52vh;line-height:1;padding:0 4vh}
.item i{display:inline-block;width:18vh;height:18vh;background:{{cor.marca}};border-radius:50%;margin-left:8vh;flex:none}
@keyframes rola{to{transform:translateX(-50%)}}
</style>
<div class="faixa"><div class="trilho">
<span class="item">{{texto}}<i></i></span><span class="item">{{texto}}<i></i></span><span class="item">{{texto}}<i></i></span><span class="item">{{texto}}<i></i></span>
<span class="item">{{texto}}<i></i></span><span class="item">{{texto}}<i></i></span><span class="item">{{texto}}<i></i></span><span class="item">{{texto}}<i></i></span>
</div></div>`,
  },
  {
    id: 'contagem-regressiva',
    title: 'Contagem regressiva',
    description: 'Relógio que conta até uma hora do dia.',
    segment: ['lojas', 'supermercados', 'padarias', 'shoppings', 'restaurantes', 'pizzarias', 'lanchonetes'],
    orientation: 'any',
    fields: [
      { key: 'titulo', label: 'Chamada', kind: 'text', default: 'A oferta acaba em' },
      { key: 'hora', label: 'Hora final (HH:MM)', kind: 'text', default: '18:00' },
      { key: 'fim', label: 'Texto quando acabar', kind: 'text', default: 'Oferta encerrada' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo', default: '#111827' },
      { key: 'numero', label: 'Números', default: '#ffd166' },
      { key: 'texto', label: 'Texto', default: '#ffffff' },
    ],
    template: `<style>
html,body{background:{{cor.fundo}};color:{{cor.texto}}}
main{height:100%;display:grid;place-items:center;text-align:center;align-content:center;gap:3vmin}
h1{margin:0;font-size:6.5vmin;font-weight:700;opacity:.9}
#t{font-size:17vmin;font-weight:800;color:{{cor.numero}};font-variant-numeric:tabular-nums;letter-spacing:.02em;animation:bat calc(1s/var(--v)) steps(2,jump-none) infinite}
#t.fim{font-size:9vmin;animation:none}
@keyframes bat{50%{transform:scale(1.03)}}
</style>
<main><h1>{{titulo}}</h1><div id="t" data-hora="{{hora}}" data-fim="{{fim}}">--:--:--</div></main>
<script>
(function(){
var el=document.getElementById('t');
var partes=(el.getAttribute('data-hora')||'18:00').split(':');
var hh=parseInt(partes[0],10),mm=parseInt(partes[1],10);
if(isNaN(hh)||hh<0||hh>23)hh=18;
if(isNaN(mm)||mm<0||mm>59)mm=0;
function p(n){return (n<10?'0':'')+n}
function tick(){
var agora=new Date(),alvo=new Date();
alvo.setHours(hh,mm,0,0);
var d=Math.floor((alvo-agora)/1000);
if(d<=0){el.textContent=el.getAttribute('data-fim')||'';el.className='fim';return}
el.textContent=p(Math.floor(d/3600))+':'+p(Math.floor(d%3600/60))+':'+p(d%60);
}
tick();setInterval(tick,1000);
})();
</script>`,
  },
  {
    id: 'preco-de-por',
    title: 'Preço de/por',
    description: 'Preço antigo riscado e preço novo que salta.',
    segment: ['lojas', 'supermercados', 'padarias', 'shoppings', 'restaurantes', 'pizzarias', 'lanchonetes'],
    orientation: 'any',
    fields: [
      { key: 'produto', label: 'Produto', kind: 'text', default: 'Pão de queijo 500 g' },
      { key: 'de', label: 'Preço antigo', kind: 'price', default: 'R$ 18,90' },
      { key: 'por', label: 'Preço novo', kind: 'price', default: 'R$ 12,90' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo', default: '#fff7e6' },
      { key: 'texto', label: 'Texto', default: '#1f2937' },
      { key: 'destaque', label: 'Preço novo', default: '#d62828' },
    ],
    template: `<style>
html,body{background:{{cor.fundo}};color:{{cor.texto}}}
main{height:100%;display:grid;place-content:center;text-align:center;gap:2vmin}
h1{margin:0;font-size:7vmin;font-weight:700;animation:sobe 7s ease-out infinite;animation-duration:calc(7s/var(--v))}
.de{font-size:8vmin;font-weight:600;position:relative;display:inline-block;opacity:.75;animation:sobe 7s ease-out infinite;animation-duration:calc(7s/var(--v))}
.de::after{content:"";position:absolute;left:-3%;right:-3%;top:52%;height:.7vmin;background:{{cor.destaque}};transform-origin:left;animation:risca 7s ease-out infinite;animation-duration:calc(7s/var(--v))}
.por{font-size:21vmin;font-weight:900;color:{{cor.destaque}};line-height:1;animation:salta 7s cubic-bezier(.3,1.6,.5,1) infinite;animation-duration:calc(7s/var(--v))}
@keyframes sobe{0%{opacity:0;transform:translateY(4vmin)}10%,90%{opacity:1;transform:none}100%{opacity:0}}
@keyframes risca{0%,18%{transform:scaleX(0)}30%,100%{transform:scaleX(1)}}
@keyframes salta{0%,32%{opacity:0;transform:scale(.4)}44%{opacity:1;transform:scale(1)}90%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
</style>
<main><h1>{{produto}}</h1><div><span class="de">{{de}}</span></div><div class="por">{{por}}</div></main>`,
  },
  {
    id: 'selo-girando',
    title: 'Selo girando',
    description: 'Selo em estrela com texto, girando devagar.',
    segment: ALL,
    orientation: 'any',
    fields: [
      { key: 'texto', label: 'Texto do selo', kind: 'text', default: 'NOVO' },
      { key: 'sub', label: 'Texto menor', kind: 'text', default: 'no cardápio' },
    ],
    colors: [
      { key: 'selo', label: 'Selo', default: '#e63946' },
      { key: 'borda', label: 'Borda', default: '#ffd166' },
      { key: 'texto', label: 'Letra', default: '#ffffff' },
    ],
    template: `<style>
main{height:100%;display:grid;place-items:center;position:relative}
.roda{position:absolute;width:96vmin;height:96vmin;animation:gira calc(14s/var(--v)) linear infinite;will-change:transform}
.roda svg{width:100%;height:100%;display:block}
.txt{position:relative;text-align:center;color:{{cor.texto}};animation:bate calc(2.4s/var(--v)) ease-in-out infinite}
.txt b{display:block;font-size:19vmin;font-weight:900;line-height:1}
.txt span{display:block;font-size:7vmin;font-weight:700;margin-top:1vmin}
@keyframes gira{to{transform:rotate(360deg)}}
@keyframes bate{50%{transform:scale(1.06)}}
</style>
<main>
<div class="roda"><svg viewBox="0 0 100 100" aria-hidden="true"><polygon fill="{{cor.selo}}" stroke="{{cor.borda}}" stroke-width="1.6" points="50,1 56.4,9.6 66.3,5.2 68.4,15.9 79.2,16.5 78.7,27.3 89.3,29.8 85.1,39.8 95,44.5 88.4,53.1 95.7,61.1 86.2,66.5 89.6,76.8 79,78.4 78.2,89.2 67.6,87.3 62.9,97 54.4,90.3 46.2,97.3 40.2,88 29.8,90.5 27.7,79.9 17,79.4 18.2,68.7 8.4,64.2 13.1,54.6 4.7,48.2 12.6,40.6 7,31.4 17.2,27.5 16.8,16.8 27.5,17.1 31.6,7.3 41.8,10.9 50,1"/></svg></div>
<div class="txt"><b>{{texto}}</b><span>{{sub}}</span></div>
</main>`,
  },
  {
    id: 'chamada-brilho',
    title: 'Chamada com brilho',
    description: 'Botão de chamada com brilho passando.',
    segment: ALL,
    orientation: 'any',
    fields: [
      { key: 'texto', label: 'Chamada', kind: 'text', default: 'Peça já pelo WhatsApp' },
      { key: 'sub', label: 'Complemento', kind: 'text', default: 'Entrega rápida na sua região' },
    ],
    colors: [
      { key: 'botao', label: 'Botão', default: '#16a34a' },
      { key: 'texto', label: 'Letra', default: '#ffffff' },
      { key: 'brilho', label: 'Brilho', default: '#ffffff80' },
    ],
    template: `<style>
main{height:100%;display:grid;place-content:center;justify-items:center;gap:3.5vmin;text-align:center;padding:4vmin;box-sizing:border-box}
.btn{position:relative;overflow:hidden;background:{{cor.botao}};color:{{cor.texto}};font-weight:800;font-size:9vmin;padding:4vmin 9vmin;border-radius:999px;animation:pulsa calc(2.2s/var(--v)) ease-in-out infinite;box-shadow:0 1.6vmin 4vmin rgba(0,0,0,.3);max-width:100%;box-sizing:border-box;overflow-wrap:anywhere}
.btn::after{content:"";position:absolute;top:0;bottom:0;left:0;width:30%;background:linear-gradient(100deg,transparent,{{cor.brilho}},transparent);transform:translateX(-160%) skewX(-20deg);animation:passa calc(2.2s/var(--v)) ease-in-out infinite}
.sub{font-size:5vmin;font-weight:600;color:{{cor.botao}};filter:brightness(1.4)}
@keyframes pulsa{50%{transform:scale(1.04)}}
@keyframes passa{0%,35%{transform:translateX(-160%) skewX(-20deg)}80%,100%{transform:translateX(420%) skewX(-20deg)}}
</style>
<main><div class="btn">{{texto}}</div><div class="sub">{{sub}}</div></main>`,
  },
  {
    id: 'cardapio-rolando',
    title: 'Lista rolando',
    description: 'Lista de itens e preços que sobe sozinha.',
    segment: ['padarias', 'restaurantes', 'pizzarias', 'lanchonetes', 'supermercados'],
    orientation: 'any',
    fields: [
      { key: 'titulo', label: 'Título', kind: 'text', default: 'Hoje no balcão' },
      { key: 'i1', label: 'Item 1', kind: 'text', default: 'Pão francês · R$ 0,90' },
      { key: 'i2', label: 'Item 2', kind: 'text', default: 'Pão de queijo · R$ 3,50' },
      { key: 'i3', label: 'Item 3', kind: 'text', default: 'Café coado · R$ 4,00' },
      { key: 'i4', label: 'Item 4', kind: 'text', default: 'Bolo de cenoura · R$ 6,50' },
      { key: 'i5', label: 'Item 5', kind: 'text', default: 'Sanduíche natural · R$ 12,00' },
      { key: 'i6', label: 'Item 6', kind: 'text', default: 'Suco de laranja · R$ 7,00' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo', default: '#2b1d14' },
      { key: 'texto', label: 'Letra', default: '#fff7ed' },
      { key: 'destaque', label: 'Título e traço', default: '#f59e0b' },
    ],
    template: `<style>
html,body{background:{{cor.fundo}};color:{{cor.texto}}}
main{height:100%;display:flex;flex-direction:column;padding:5vmin 6vmin;box-sizing:border-box}
h1{margin:0 0 3vmin;font-size:8vmin;color:{{cor.destaque}};font-weight:800;flex:none}
.janela{flex:1;overflow:hidden;position:relative;-webkit-mask-image:linear-gradient(transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(transparent,#000 8%,#000 92%,transparent)}
.lista{animation:sobe calc(16s/var(--v)) linear infinite;will-change:transform}
.lista p{margin:0;padding:2.6vmin 0;font-size:6.4vmin;font-weight:600;position:relative;overflow-wrap:anywhere}
.lista p::after{content:"";position:absolute;left:0;right:0;bottom:0;height:.5vmin;background:{{cor.destaque}};opacity:.35}
@keyframes sobe{to{transform:translateY(-50%)}}
</style>
<main><h1>{{titulo}}</h1><div class="janela"><div class="lista">
<div><p>{{i1}}</p><p>{{i2}}</p><p>{{i3}}</p><p>{{i4}}</p><p>{{i5}}</p><p>{{i6}}</p></div>
<div><p>{{i1}}</p><p>{{i2}}</p><p>{{i3}}</p><p>{{i4}}</p><p>{{i5}}</p><p>{{i6}}</p></div>
</div></div></main>`,
  },
  {
    id: 'faixa-novidade',
    title: 'Faixa de novidade',
    description: 'Faixa que entra, aparece e sai, em ciclo.',
    segment: ['lojas', 'shoppings', 'restaurantes', 'padarias', 'pizzarias', 'lanchonetes', 'supermercados'],
    orientation: 'horizontal',
    fields: [
      { key: 'texto', label: 'Destaque', kind: 'text', default: 'Inaugurado' },
      { key: 'sub', label: 'Complemento', kind: 'text', default: 'Venha conhecer a nova loja' },
    ],
    colors: [
      { key: 'faixa', label: 'Faixa', default: '#7c3aed' },
      { key: 'texto', label: 'Letra', default: '#ffffff' },
      { key: 'detalhe', label: 'Detalhe', default: '#fde047' },
    ],
    template: `<style>
main{height:100%;display:flex;align-items:center;overflow:hidden}
.faixa{width:100%;height:78%;background:{{cor.faixa}};color:{{cor.texto}};display:flex;align-items:center;gap:5vh;padding:0 6vh;box-sizing:border-box;border-top:3vh solid {{cor.detalhe}};border-bottom:3vh solid {{cor.detalhe}};animation:ciclo calc(7s/var(--v)) cubic-bezier(.2,.8,.2,1) infinite;will-change:transform,opacity}
.faixa b{font-size:34vh;font-weight:900;text-transform:uppercase;white-space:nowrap;color:{{cor.detalhe}}}
.faixa span{font-size:22vh;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@keyframes ciclo{0%{transform:translateX(-105%);opacity:1}14%,82%{transform:none;opacity:1}96%{transform:translateX(105%);opacity:1}100%{transform:translateX(105%);opacity:0}}
</style>
<main><div class="faixa"><b>{{texto}}</b><span>{{sub}}</span></div></main>`,
  },
  {
    id: 'confete-promocao',
    title: 'Confete de promoção',
    description: 'Chuva de confete atrás de uma frase de festa.',
    segment: ALL,
    orientation: 'any',
    fields: [
      { key: 'titulo', label: 'Frase', kind: 'text', default: 'Promoção imperdível' },
      { key: 'sub', label: 'Complemento', kind: 'text', default: 'Só até domingo' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo', default: '#1e1b4b' },
      { key: 'texto', label: 'Letra', default: '#ffffff' },
      { key: 'c1', label: 'Confete 1', default: '#f43f5e' },
      { key: 'c2', label: 'Confete 2', default: '#fbbf24' },
      { key: 'c3', label: 'Confete 3', default: '#22d3ee' },
    ],
    template: `<style>
html,body{background:{{cor.fundo}};color:{{cor.texto}}}
main{height:100%;display:grid;place-content:center;text-align:center;gap:2.5vmin;position:relative;padding:4vmin;box-sizing:border-box}
h1{margin:0;font-size:12vmin;font-weight:900;line-height:1.05;position:relative;z-index:2;animation:pop calc(2.6s/var(--v)) ease-in-out infinite;overflow-wrap:anywhere}
p{margin:0;font-size:6vmin;font-weight:600;position:relative;z-index:2;opacity:.92}
.c{position:absolute;top:-6vmin;width:2.4vmin;height:4.4vmin;border-radius:.4vmin;opacity:0;animation:cai linear infinite;will-change:transform}
@keyframes cai{0%{opacity:1;transform:translate3d(0,0,0) rotate(0)}100%{opacity:1;transform:translate3d(var(--dx),115vh,0) rotate(720deg)}}
@keyframes pop{50%{transform:scale(1.05)}}
</style>
<main id="m" data-c1="{{cor.c1}}" data-c2="{{cor.c2}}" data-c3="{{cor.c3}}"><h1>{{titulo}}</h1><p>{{sub}}</p></main>
<script>
(function(){
var m=document.getElementById('m');
var cores=[m.getAttribute('data-c1'),m.getAttribute('data-c2'),m.getAttribute('data-c3')];
var v=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--v'))||1;
for(var i=0;i<32;i++){
var d=document.createElement('div');
d.className='c';
var r1=((i*37)%100)/100,r2=((i*61)%100)/100,r3=((i*17)%100)/100;
d.style.left=(r1*100)+'%';
d.style.background=cores[i%3];
d.style.animationDuration=((3.2+r2*3)/v)+'s';
d.style.animationDelay=(-r3*6)+'s';
d.style.setProperty('--dx',((r2-0.5)*24)+'vmin');
m.appendChild(d);
}
})();
</script>`,
  },
  {
    id: 'relogio-data',
    title: 'Relógio e data',
    description: 'Hora e data de hoje em português.',
    segment: ALL,
    orientation: 'any',
    fields: [
      { key: 'rotulo', label: 'Texto acima', kind: 'text', default: 'Seja bem-vindo' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo', default: '#0f172a' },
      { key: 'hora', label: 'Hora', default: '#ffffff' },
      { key: 'data', label: 'Data', default: '#38bdf8' },
    ],
    template: `<style>
html,body{background:{{cor.fundo}}}
main{height:100%;display:grid;place-content:center;text-align:center;gap:1.5vmin}
.rot{font-size:5.4vmin;font-weight:600;color:{{cor.data}};opacity:.9;animation:fade calc(4s/var(--v)) ease-in-out infinite}
#h{font-size:24vmin;font-weight:800;color:{{cor.hora}};line-height:1;font-variant-numeric:tabular-nums}
#d{font-size:6vmin;font-weight:600;color:{{cor.data}};text-transform:capitalize}
@keyframes fade{50%{opacity:.45}}
</style>
<main><div class="rot">{{rotulo}}</div><div id="h">--:--</div><div id="d"></div></main>
<script>
(function(){
var h=document.getElementById('h'),d=document.getElementById('d');
function tick(){
var n=new Date();
h.textContent=n.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
d.textContent=n.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
}
tick();setInterval(tick,5000);
})();
</script>`,
  },
  {
    id: 'qr-moldura',
    title: 'QR Code com moldura',
    description: 'Imagem do QR Code com cantos animados.',
    segment: ALL,
    orientation: 'any',
    fields: [
      { key: 'titulo', label: 'Chamada', kind: 'text', default: 'Aponte a câmera' },
      { key: 'legenda', label: 'Legenda', kind: 'text', default: 'Veja o cardápio completo' },
      { key: 'imagem', label: 'Imagem do QR Code', kind: 'image', default: '' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo', default: '#0b1b2b' },
      { key: 'moldura', label: 'Moldura', default: '#02c2cd' },
      { key: 'texto', label: 'Letra', default: '#ffffff' },
    ],
    template: `<style>
html,body{background:{{cor.fundo}};color:{{cor.texto}}}
main{height:100%;display:grid;place-content:center;justify-items:center;text-align:center;gap:3vmin}
h1{margin:0;font-size:7.4vmin;font-weight:800}
p{margin:0;font-size:4.6vmin;font-weight:500;opacity:.85}
.qr{position:relative;width:46vmin;height:46vmin;padding:3vmin;box-sizing:border-box;animation:resp calc(2.4s/var(--v)) ease-in-out infinite}
.qr .img{width:100%;height:100%;background:var(--img) center/contain no-repeat #ffffff;border-radius:1.2vmin;box-shadow:inset 0 0 0 1px #0002}
.qr i{position:absolute;width:9vmin;height:9vmin;border:1.4vmin solid {{cor.moldura}}}
.qr i:nth-child(1){top:0;left:0;border-right:0;border-bottom:0;border-top-left-radius:2vmin}
.qr i:nth-child(2){top:0;right:0;border-left:0;border-bottom:0;border-top-right-radius:2vmin}
.qr i:nth-child(3){bottom:0;left:0;border-right:0;border-top:0;border-bottom-left-radius:2vmin}
.qr i:nth-child(4){bottom:0;right:0;border-left:0;border-top:0;border-bottom-right-radius:2vmin}
.qr b{position:absolute;left:3vmin;right:3vmin;top:3vmin;height:.9vmin;background:{{cor.moldura}};opacity:.8;box-shadow:0 0 2vmin {{cor.moldura}};animation:varre calc(2.4s/var(--v)) ease-in-out infinite}
@keyframes resp{50%{transform:scale(1.035)}}
@keyframes varre{0%,100%{transform:translateY(0)}50%{transform:translateY(40vmin)}}
</style>
<main><h1>{{titulo}}</h1>
<div class="qr" style="--img:url('{{imagem}}')"><div class="img"></div><i></i><i></i><i></i><i></i><b></b></div>
<p>{{legenda}}</p></main>`,
  },
  {
    id: 'frase-digitando',
    title: 'Frase digitando',
    description: 'Texto que aparece letra por letra, em ciclo.',
    segment: ALL,
    orientation: 'any',
    fields: [
      { key: 'texto', label: 'Frase', kind: 'text', default: 'Pão quentinho saindo agora' },
      { key: 'sub', label: 'Complemento', kind: 'text', default: 'Todos os dias, às 7h e às 16h' },
    ],
    colors: [
      { key: 'fundo', label: 'Fundo', default: '#fef3c7' },
      { key: 'texto', label: 'Frase', default: '#78350f' },
      { key: 'cursor', label: 'Cursor', default: '#d97706' },
    ],
    template: `<style>
html,body{background:{{cor.fundo}}}
main{height:100%;display:grid;place-content:center;text-align:center;gap:3vmin;padding:5vmin;box-sizing:border-box}
#t{font-size:11vmin;font-weight:800;color:{{cor.texto}};line-height:1.1;min-height:1.1em;overflow-wrap:anywhere}
#t::after{content:"";display:inline-block;width:.07em;height:.9em;margin-left:.06em;background:{{cor.cursor}};vertical-align:-.08em;animation:pisca calc(1s/var(--v)) steps(2,jump-none) infinite}
.sub{font-size:5vmin;font-weight:600;color:{{cor.cursor}}}
@keyframes pisca{50%{opacity:0}}
</style>
<main><div id="t" data-texto="{{texto}}"></div><div class="sub">{{sub}}</div></main>
<script>
(function(){
var el=document.getElementById('t');
var s=el.getAttribute('data-texto')||'';
var v=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--v'))||1;
var reduz=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduz){el.textContent=s;return}
var i=0;
function digita(){
i++;
el.textContent=s.slice(0,i);
if(i<s.length){setTimeout(digita,75/v)}else{setTimeout(function(){i=0;el.textContent='';setTimeout(digita,500/v)},2600/v)}
}
digita();
})();
</script>`,
  },
];

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value: string) => String(value).replace(/[&<>"']/g, c => ESCAPES[c]);
export const safeColor = (value: string, fallback: string) =>
  /^#[0-9a-f]{3,8}$/i.test(value) || /^rgba?\([\d\s.,%]+\)$/i.test(value) ? value : fallback;
/** Só aceita imagem por http(s) ou caminho relativo; nada de javascript: ou data: com script. */
export const safeUrl = (value: string, fallback = '') =>
  /^(https?:\/\/|\/)[^\s"'<>]*$/i.test(value) || /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(value) ? value : fallback;

export function getMotionPreset(id?: string): MotionPreset | undefined {
  return MOTION_PRESETS.find(p => p.id === id);
}

/** Base comum: zera margens, fundo transparente e respeita "reduzir movimento". */
const BASE_CSS = 'html,body{margin:0;height:100%;overflow:hidden;background:transparent;font-family:system-ui,Arial,sans-serif}*{box-sizing:border-box}@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}';

/** Valores iniciais de um preset (campos e cores), para o editor preencher o widget novo. */
export function getMotionDefaults(presetId: string): { fields: Record<string, string>; colors: Record<string, string> } {
  const preset = getMotionPreset(presetId) || MOTION_PRESETS[0];
  return {
    fields: Object.fromEntries(preset.fields.map(f => [f.key, f.default])),
    colors: Object.fromEntries(preset.colors.map(c => [c.key, c.default])),
  };
}

export function buildMotionHtml(config?: WidgetData['motionConfig']): string {
  const preset = getMotionPreset(config?.presetId) || MOTION_PRESETS[0];
  const speed = Math.max(0.5, Math.min(2, Number(config?.speed) || 1));
  // Uma só passada: o valor que entra no HTML nunca é relido como modelo.
  const html = preset.template.replace(/\{\{([a-z0-9._-]+)\}\}/gi, (_m, key: string) => {
    if (key.startsWith('cor.')) {
      const c = preset.colors.find(x => x.key === key.slice(4));
      return c ? safeColor(config?.colors?.[c.key] ?? c.default, c.default) : '';
    }
    const f = preset.fields.find(x => x.key === key);
    if (!f) return '';
    const raw = String(config?.fields?.[f.key] ?? f.default);
    return f.kind === 'image' ? escapeHtml(safeUrl(raw, f.default)) : escapeHtml(raw);
  });
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--v:${speed}}${BASE_CSS}</style></head><body>${html}</body></html>`;
}
