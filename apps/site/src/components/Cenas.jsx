import { useState } from 'react';
import WorldScreen from './WorldScreen';
import './Cenas.css';

const CENAS = [
  { setor:'Padarias e cafés', imagem:'/exemplos/uso-padaria.jpg', slide:'/exemplos/ambiente-padaria-doce.jpg', corners:[[552,84],[1248,32],[1248,454],[552,463]], alt:'TV sobre o balcão de uma padaria, alternando ofertas de café da manhã e sobremesas.', texto:'O combo do dia e o pão que acabou de sair, bem na hora de escolher.' },
  { setor:'Lojas e vitrines', imagem:'/exemplos/uso-loja.jpg', slide:'/exemplos/ambiente-loja-jeans.jpg', portrait:true, corners:[[336,68],[773,50],[767,824],[338,800]], alt:'Display na entrada de uma loja, alternando campanhas de roupas.', texto:'Novas coleções e ofertas em destaque para quem passa pela vitrine.' },
  { setor:'Mercados', imagem:'/exemplos/uso-mercado.jpg', slide:'/exemplos/ambiente-mercado-morango.jpg', corners:[[609,108],[1418,27],[1415,500],[609,498]], alt:'TV no hortifrúti de um mercado, alternando ofertas de laranjas e morangos.', texto:'Preço, produto e promoção da semana ao lado de quem está comprando.' },
  { setor:'Shopping e redes', imagem:'/exemplos/uso-shopping-v2.jpg', slide:'/exemplos/ambiente-shopping-musica.jpg', portrait:true, corners:[[891,79],[1305,73],[1306,814],[891,793]], alt:'Totem de shopping, alternando gastronomia e programação musical.', texto:'Gastronomia, serviços e programação nos pontos de maior movimento.' },
];

export default function Cenas() {
  const [paused,setPaused]=useState(false);
  return <section id="segmentos" className="secao secao--noite cenas" aria-labelledby="cenas-titulo" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
    <div className="secao__cabeca reveal">
      <h2 id="cenas-titulo" className="h2">Veja sua próxima campanha no lugar certo.</h2>
      <p className="lead">Da TV do balcão ao totem do shopping: exemplos de como seu conteúdo pode aparecer.</p>
    </div>
    <ul className="cenas__lista">{CENAS.map(cena=><li key={cena.setor} className="cena reveal">
      <WorldScreen scene={cena} paused={paused} />
      <div className="cena__conteudo"><h3 className="cena__setor">{cena.setor}</h3><p className="cena__resumo">{cena.texto}</p></div>
    </li>)}</ul>
    <div className="cenas__playback"><span>Exemplos ilustrativos · conteúdo alternado a cada 3 segundos</span></div>
  </section>;
}
