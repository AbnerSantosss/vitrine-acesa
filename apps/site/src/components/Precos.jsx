import { useId, useState } from 'react';
import { ANUAL, MENSAL, faturaMensal, melhorPlanoPago, plano, precoUnitario, reais, telasCobradas, telasEmQueRedeCompensa } from '../data/catalogo';
import { EVENT, track } from '../lib/tracking';
import './Precos.css';

// Prices and savings always derive from the synchronized product catalog.
// Annual prices are monthly equivalents; the annual total is paid upfront.
const INCLUI = {
 gratis: ['Texto, foto, GIF, relógio e clima', 'Aviso imediato nas telas', 'E-mail se a tela desconectar', 'Formatos horizontal e vertical'],
 loja: ['Tudo do Grátis, sem limite de telas*', 'Vídeo, notícias, agenda e contador', 'PDF, Docs, Office e páginas web', '3 pessoas + relatório de exibição', 'Avisos agendados por data e hora'],
 rede: ['Tudo do Loja', 'Power BI, cotações, Airtable e HTML', '15 pessoas na equipe', 'Auditoria de quem publicou'],
};
const DESCRICAO = {gratis:'Para conhecer no seu negócio.',loja:'Para a comunicação do dia a dia.',rede:'Para conectar telas e equipes.'};
const NOMES = {gratis:'Grátis',loja:'Loja',rede:'Rede'};
const Marca = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m4 12 5 5L20 6"/></svg>;

export default function Precos({startConversion,abrirContato}) {
 const [intervalo,setIntervalo] = useState(ANUAL);
 const [telas,setTelas] = useState(3);
 const [selecionado,setSelecionado] = useState('loja');
 const [recursosAbertos,setRecursosAbertos] = useState(null);
 const idSimulador=useId();
 const anual=intervalo===ANUAL;
 const degrauRede=telasEmQueRedeCompensa(intervalo);
 const sugestao=melhorPlanoPago(telas,intervalo);
 const planoSugerido=sugestao?plano(sugestao.code):null;
 const converter=(code,local,rotulo,quantasTelas)=>{
   track({event:EVENT.CTA_CLICK,params:{cta_location:local,plan:code}});
   startConversion(code,local,rotulo,quantasTelas,intervalo);
 };
 const economia=code=>(precoUnitario(code,MENSAL)-precoUnitario(code,ANUAL))*12;

 return <>
  <section id="precos" className="secao secao--papel precos" aria-labelledby="precos-titulo">
   <div className="precos__cabeca">
    <span className="blocos__eyebrow">UM COMEÇO GRÁTIS. ESPAÇO PARA CRESCER.</span>
    <h2 className="h2" id="precos-titulo"><span className="precos__headline-desktop">A TV você já tem.<br /><span>A primeira tela é por nossa conta.</span></span><span className="precos__headline-mobile">Sua primeira tela.<br /><span>Grátis para sempre.</span></span></h2>
    <p>Comece grátis. Amplie quando fizer sentido para o seu negócio.</p>
    <div className="precos__intervalo" role="group" aria-label="Forma de cobrança">
      <button type="button" aria-pressed={!anual} onClick={()=>setIntervalo(MENSAL)}>Mensal <small>sem fidelidade</small></button>
      <button type="button" aria-pressed={anual} onClick={()=>setIntervalo(ANUAL)}>Anual <small>12 meses · economize {Math.round(economia('loja')/(precoUnitario('loja',MENSAL)*12)*100)}% no Loja</small></button>
    </div>
   </div>
   <div className="precos__seletor" role="group" aria-label="Plano para visualizar">{Object.keys(NOMES).map(code=><button type="button" key={code} aria-pressed={selecionado===code} onClick={()=>setSelecionado(code)}>{NOMES[code]}</button>)}</div>
   <div className="precos__grade">
    {Object.keys(NOMES).map(code=>{
      const gratis=code==='gratis';
      const valor=precoUnitario(code,intervalo);
      const quantidade=code==='rede'?plano('rede').minScreens:1;
      const rotulo=gratis?'Começar grátis':`Escolher ${NOMES[code]}`;
      return <article key={code} data-active={selecionado===code} className={`card precos__card${code==='loja'?' precos__card--destaque':''}`}>
       <div className="precos__topo"><h3>{NOMES[code]}</h3><span className="precos__selo">{gratis?'1 tela, para sempre':code==='loja'?'Para o dia a dia':`Mín. ${quantidade} telas`}</span></div>
       <p className="precos__descricao">{DESCRICAO[code]}</p>
       <p className="precos__ancora">{gratis?'Sem prazo de teste':anual?<><span>{reais(precoUnitario(code,MENSAL))}/mês</span> no mensal</>:'Cobrança mês a mês'}</p>
       <p className="precos__valor">{reais(valor)}{!gratis&&<span>/tela/mês</span>}</p>
       <p className="precos__cobranca">{gratis?'Sem cartão. Sem cobrança automática.':anual?<>{reais(valor*12)} por tela/ano, pagos de uma vez.</>:<>Sem compromisso anual.</>}</p>
       <p className="precos__economia">{gratis?'Seu primeiro conteúdo já pode ir ao ar.':anual?<><Marca/>Economize {reais(economia(code))} por tela/ano.</>:<>No anual: {reais(precoUnitario(code,ANUAL))} por tela/mês.</>}</p>
       <button type="button" className="precos__ver-recursos" aria-expanded={recursosAbertos===code} aria-controls={`recursos-${code}`} onClick={()=>setRecursosAbertos(recursosAbertos===code?null:code)}>Ver {INCLUI[code].length} recursos incluídos <span aria-hidden="true">{recursosAbertos===code?'-':'+'}</span></button><ul id={`recursos-${code}`} data-expanded={recursosAbertos===code} className="precos__inclui">{INCLUI[code].map(item=><li key={item}><Marca/><span>{item}</span></li>)}</ul>
       <button type="button" className={`btn btn--largo${code==='rede'?' btn--fantasma':''}`} onClick={()=>converter(code,`precos_${code}`,rotulo,gratis?1:code==='rede'?Math.max(telas,quantidade):telas)}>{rotulo}<span aria-hidden="true">↗</span></button>
       <p className="precos__rodape-card">{gratis?'Plano permanente: não vira pago sozinho.':code==='loja'?'*Cada tela ativa é cobrada no plano pago.':anual?`Mínimo anual: ${reais(faturaMensal('rede',quantidade,intervalo)*12)} por ${quantidade} telas.`:`Mínimo mensal: ${reais(faturaMensal('rede',quantidade,intervalo))} por ${quantidade} telas.`}</p>
      </article>;
    })}
   </div>
   <p className="precos__aviso">Valores em R$. Planos pagos cobram por tela ativa. <a href="#planejar-telas">Calcule seu total ↓</a></p>
  </section>
  <section id="planejar-telas" className="secao precos-planejar" aria-labelledby="planejar-titulo">
   <div className="precos__simulador card">
    <div className="precos__simulador-campo">
     <h2 id="planejar-titulo">Planeje sua operação.</h2>
     <label htmlFor={idSimulador}>Quantas telas você quer ligar?</label>
     <input id={idSimulador} className="form-input" type="number" inputMode="numeric" min="1" max="500" value={telas} onChange={e=>{const n=Number(e.target.value);setTelas(Number.isFinite(n)?Math.min(Math.max(n,1),500):1);}}/>
    </div>
    <div className="precos__simulador-conta" role="status" aria-live="polite">
     {planoSugerido&&<><span className="blocos__eyebrow">MENOR TOTAL ENTRE OS PLANOS PAGOS</span><p className="precos__simulador-total">{reais(sugestao.total)}<span>/mês no {planoSugerido.name}</span></p>
      <p className="micro">{telasCobradas(sugestao.code,telas)} telas na fatura{telasCobradas(sugestao.code,telas)>telas?` (mínimo do plano: ${planoSugerido.minScreens})`:''}. {anual?`${reais(sugestao.total*12)} no ano, pagos de uma vez.`:'Mensal sem fidelidade; cancelamento solicitado ao atendimento, válido no próximo ciclo, sem multa.'}</p>
      <p className="micro">A partir de {degrauRede} telas, o Rede tem menor total que o Loja. Para 1 tela com recursos básicos, o Grátis continua disponível.</p></>}
    </div>
    <button type="button" className="btn" onClick={()=>converter(sugestao.code,'precos_simulador',`Assinar o ${planoSugerido.name}`,telasCobradas(sugestao.code,telas))}>Escolher {planoSugerido?.name}</button>
   </div>
   <div className="precos__secundarios">
    <article><div><h3>Você instala para outros negócios?</h3><p>Converse sobre o programa para instaladores, síndicos, técnicos e agências.</p></div><button type="button" className="btn btn--fantasma" onClick={()=>abrirContato('Parceiro','precos')}>Quero ser parceiro</button></article>
    <article><div><h3>Uma operação maior?</h3><p>Enterprise: escopo e preço definidos numa conversa, antes da proposta.</p></div><button type="button" className="btn btn--fantasma" onClick={()=>startConversion('enterprise','precos','Falar com a gente')}>Falar com a gente</button></article>
   </div>
  </section>
 </>;
}
