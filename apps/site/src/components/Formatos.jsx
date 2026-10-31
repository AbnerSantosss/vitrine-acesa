import { useState } from 'react';
import ScreenPlaylist from './ScreenPlaylist';
import './Formatos.css';

const WIDGETS = [{type:'weather', city:'sp'}, {type:'metrics', variant:'powerbi'}];
const ADS_WIDGETS = [{type:'weather', city:'rj'}, {type:'metrics', variant:'ads'}];
const BI_WIDGETS = [{type:'weather', city:'ce'}, {type:'metrics', variant:'powerbi'}];

export default function Formatos() {
  const [selection, setSelection] = useState(null);
  return (
    <section id="formatos" className="secao secao--papel secao--compacta formatos" aria-labelledby="formatos-titulo">
      <div className="secao__cabeca reveal">
        <h2 id="formatos-titulo" className="h2">A TV da parede e o totem da entrada, no mesmo painel.</h2>
        <p className="lead">Clima, avisos e indicadores também ganham espaço. Veja exemplos de widgets nos dois formatos.</p>
      </div>
      <div className="formatos__opcoes" role="group" aria-label="Escolha um exemplo de widget">
        <button type="button" aria-pressed={selection===0} onClick={()=>setSelection(0)}>Clima</button>
        <button type="button" aria-pressed={selection===1} onClick={()=>setSelection(1)}>Indicadores de dados</button>
        <button type="button" aria-pressed={selection===null} onClick={()=>setSelection(null)}>Alternar a cada 3 s</button>
      </div>
      <div className="formatos__grade grid-2">
        <figure className="formato reveal">
          <div className="formato__demo formato__demo--horizontal"><ScreenPlaylist label="Widgets na TV horizontal" slides={WIDGETS} selection={selection} /></div>
          <figcaption className="cap formato__legenda">16:9 · Clima e indicadores para recepção, loja ou equipe.</figcaption>
        </figure>
        <figure className="formato reveal">
          <div className="formato__demo formato__demo--vertical">
            <ScreenPlaylist label="Clima do Rio e dashboard de tráfego pago" portrait slides={ADS_WIDGETS} selection={selection} />
            <ScreenPlaylist label="Clima do Ceará e dashboard Power BI" portrait slides={BI_WIDGETS} selection={selection} />
          </div>
          <figcaption className="cap formato__legenda">9:16 · Informação que acompanha o formato do seu display.</figcaption>
        </figure>
      </div>
      <p className="cap">Demonstrações com dados ilustrativos. Clima usa a cidade escolhida; indicadores podem vir de painéis e páginas conectados.</p>
    </section>
  );
}
