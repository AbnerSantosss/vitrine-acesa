import { useState } from 'react';
import useDemoCycle from './useDemoCycle';
import WidgetExample from './WidgetExample';
import './ScreenPlaylist.css';

export default function ScreenPlaylist({slides,label,portrait=false,priority=false,selection=null}) {
 const [hovered,setHovered]=useState(false);
 const {frameRef,index}=useDemoCycle(slides.length,hovered||selection!==null);
 const current=selection===null?index:selection;
 return <div ref={frameRef} className={`demo-tv ${portrait?'demo-tv--portrait':''}`} role="group" aria-label={label} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
  <div className="demo-tv__body"><div className="demo-tv__viewport" data-current-slide={current}>
   {slides.map((slide,i)=><div key={slide.src||slide.type} className={`demo-tv__slide ${i===current?'is-active':''}`} aria-hidden={i!==current}>
    {slide.type?<WidgetExample {...slide} portrait={portrait}/>:<img src={slide.src} alt={slide.alt} width={portrait?941:1672} height={portrait?1672:941} loading={priority?'eager':'lazy'} fetchPriority={priority&&i===0?'high':'auto'}/>}
   </div>)}
  </div><div className="demo-tv__bezel" aria-hidden="true"><span className="demo-tv__wordmark"><span className="brand-lockup brand-lockup--white" style={{width:32,height:9}} /></span><span className="demo-tv__sensor"/></div></div>
  <div className="demo-tv__stand" aria-hidden="true"/>
 </div>;
}
