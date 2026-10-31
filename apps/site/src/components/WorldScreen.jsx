import { useEffect, useState } from 'react';
import useDemoCycle from './useDemoCycle';

// Project a flat creative inside the photographed bezel. Points use the source photo's 1536 x 1024 coordinates.
function projection(points, width, height) {
  const [p0,p1,p2,p3]=points;
  const dx1=p1[0]-p2[0], dx2=p3[0]-p2[0], dx3=p0[0]-p1[0]+p2[0]-p3[0];
  const dy1=p1[1]-p2[1], dy2=p3[1]-p2[1], dy3=p0[1]-p1[1]+p2[1]-p3[1];
  const denominator=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/denominator, h=(dx1*dy3-dx3*dy1)/denominator;
  const a=(p1[0]-p0[0]+g*p1[0])/width, b=(p1[1]-p0[1]+g*p1[1])/width;
  const c=(p3[0]-p0[0]+h*p3[0])/height, d=(p3[1]-p0[1]+h*p3[1])/height;
  return `matrix3d(${a},${b},0,${g/width},${c},${d},0,${h/height},0,0,1,0,${p0[0]},${p0[1]},0,1)`;
}

export default function WorldScreen({ scene, paused }) {
  const {frameRef,index}=useDemoCycle(2,paused);
  const [scale,setScale]=useState(0);
  useEffect(()=>{
    const observer=new ResizeObserver(([entry])=>setScale(entry.contentRect.width/1536));
    if(frameRef.current) observer.observe(frameRef.current);
    return ()=>observer.disconnect();
  },[frameRef]);
  const height=scene.portrait?1777.7778:562.5;
  return <div ref={frameRef} className="cena__media" data-current-slide={index}>
    <img className="cena__imagem" src={scene.imagem} alt={scene.alt} width="1536" height="1024" loading="lazy" decoding="async" />
    <div className={`cena__projection ${index===1?'is-active':''}`} style={{transform:`scale(${scale})`}} aria-hidden="true">
      <div className="cena__screen" style={{width:1000,height,transform:projection(scene.corners,1000,height)}}><img src={scene.slide} alt="" loading="lazy" /></div>
    </div>
  </div>;
}
