import { useState, useSyncExternalStore } from 'react';
import useDemoCycle from './useDemoCycle';
import ExampleArtwork from './ExampleArtwork';
import './CanvasDemo.css';

const STEPS=['Escolha o fundo','Adicione o título','Combine os blocos','Sua arte está pronta'];
const subscribeMotion=callback=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)');q.addEventListener('change',callback);return ()=>q.removeEventListener('change',callback);};
const getMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const serverMotion=()=>true;

function Assembly({type,title}) {
 const [paused,setPaused]=useState(false);
 const [manual,setManual]=useState(null);
 const reduced=useSyncExternalStore(subscribeMotion,getMotion,serverMotion);
 const {frameRef,index}=useDemoCycle(5,paused||manual!==null||reduced);
 const phase=manual??(reduced?3:Math.min(index,3));
 return <>
  <div ref={frameRef} className="editor-demo" data-phase={phase} data-art={type}>
   <div className="editor-demo__top"><span className="editor-demo__brand"><span className="brand-lockup brand-lockup--white" role="img" aria-label="Tellas" /></span><span>{title} · 16:9</span><b>{phase===3?'✓ Pronto para publicar':'Editando a composição'}</b></div>
   <div className="editor-demo__body">
    <aside className="editor-demo__sidebar" aria-hidden="true"><span>CAMADAS DA ARTE</span>{['Fundo','Título','Conteúdo','Finalização'].map((label,i)=><div key={label} className={phase===i?'active':''}><b>{['▧','T','▦','✓'][i]}</b>{label}</div>)}<small>Uma composição feita<br/>bloco a bloco.</small></aside>
    <div className="editor-demo__workspace">
     <div className="editor-demo__tools" aria-hidden="true"><span>↖</span><span>Texto</span><b>Geist</b><span>48</span><strong>B</strong><i className="editor-demo__swatch"/><span>Alinhar</span></div>
     <div className="editor-demo__canvas">
      <ExampleArtwork type={type} phase={phase}/>
      {phase<3&&!reduced&&<svg className="editor-demo__cursor" viewBox="0 0 28 32" aria-hidden="true"><path d="M3 2v25l7-6 6 9 5-3-6-9 9-2Z" fill="#0369a1" stroke="#fff" strokeWidth="2"/></svg>}
     </div>
     <div className="editor-demo__bottom" aria-hidden="true"><span>Cena 1 de 1 · {title}</span><span>− ━━━━━ + &nbsp; 50%</span></div>
    </div>
   </div>
  </div>
  <div className="canvas-demo__progress"><div role="group" aria-label="Etapas da montagem">{STEPS.map((step,i)=><button type="button" key={step} aria-pressed={phase===i} onClick={()=>setManual(i)}><span>{i+1}</span>{step}</button>)}</div><button type="button" className="canvas-demo__play" onClick={()=>{if(manual!==null){setManual(null);setPaused(false);}else setPaused(v=>!v);}} disabled={reduced}>{reduced?'Arte completa · movimento reduzido':manual!==null||paused?'Animar montagem':'Pausar montagem'}</button></div>
 </>;
}

export default function CanvasDemo({type="listas",options=[],onSelect}) {
 const title=options.find(item=>item.id===type)?.nome||"Recados da equipe";
 return <div id="montagem" className="canvas-demo">
  <div className="canvas-demo__heading"><div><span className="blocos__eyebrow">POR TRÁS DA TELA</span><h3>Uma ideia. Alguns blocos. Uma bela tela.</h3><p>Escolha uma arte e acompanhe a montagem, do fundo ao último detalhe.</p></div><span className="canvas-demo__disclaimer">Simulação do editor</span></div>
  <div className="canvas-demo__gallery" role="group" aria-label="Escolha a arte para montar">{options.map(item=><button type="button" key={item.id} aria-pressed={type===item.id} onClick={()=>onSelect(item.id)}><span className="canvas-demo__thumb" aria-hidden="true"><ExampleArtwork type={item.id}/></span><span>{item.nome}</span></button>)}</div>
  <Assembly key={type} type={type} title={title}/>
 </div>;
}
