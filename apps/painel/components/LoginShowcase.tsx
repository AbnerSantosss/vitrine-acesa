import React, { useEffect, useState } from 'react';
const PLACES=[
 {id:'loja',name:'Vitrine de loja',description:'Sua coleção chama atenção antes mesmo da entrada.'},
 {id:'padaria',name:'Balcão da padaria',description:'O café, o pão quentinho e a oferta do dia à vista.'},
 {id:'mercado',name:'Corredor do mercado',description:'Ofertas frescas perto de quem está escolhendo.'},
 {id:'farmacia',name:'Balcão da farmácia',description:'Cuidados e novidades enquanto o cliente espera.'},
 {id:'shopping',name:'Corredor do shopping',description:'Cinema, gastronomia e eventos no caminho das pessoas.'},
 {id:'clinica',name:'Sala de espera',description:'Horários, clima e informação para uma espera melhor.'}
];
export default function LoginShowcase() {
 const [selected,setSelected]=useState(0);
 const [manual,setManual]=useState(false);
 const [hovered,setHovered]=useState(false);
 useEffect(()=>{
  if(manual||hovered)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const timer=window.setInterval(()=>{if(!document.hidden&&!motion.matches)setSelected(i=>(i+1)%PLACES.length);},3000);
  return ()=>window.clearInterval(timer);
 },[manual,hovered]);
 return <div className="login-showcase" onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
  <figure className="login-showcase__scene">
   {PLACES.map((place,i)=><img key={place.id} className={i===selected?'is-active':''} src={`${import.meta.env.BASE_URL}exemplos/login-${place.id}.jpg`} alt={`${place.name} com TV exibindo conteúdo de exemplo`} aria-hidden={i!==selected} loading={i===0?'eager':'lazy'}/>)}
   <figcaption><span><b>{PLACES[selected].name}</b><small>{PLACES[selected].description}</small></span><span className="login-showcase__count">0{selected+1} / 06</span></figcaption>
  </figure>
  <div className="login-showcase__choices" role="group" aria-label="Ambientes de exemplo">{PLACES.map((place,i)=><button key={place.id} type="button" aria-pressed={i===selected} onClick={()=>{setSelected(i);setManual(true);}}><img src={`${import.meta.env.BASE_URL}exemplos/login-${place.id}.jpg`} alt="" loading="lazy"/><span>{place.name}</span></button>)}</div>
  <p className="login-showcase__note">Ambientes ilustrativos. Veja como sua comunicação pode ganhar espaço.</p>
 </div>;
}
