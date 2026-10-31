import './WidgetExample.css';

const WEATHER = {
  sp: { city: 'São Paulo', state: 'São Paulo · SP', temp: '24°', condition: 'Sol entre nuvens', range: 'Máx. 27° · Mín. 18°', photo: '/exemplos/clima-sp-sol.jpg', alt: 'Avenida Paulista em São Paulo em uma manhã ensolarada com poucas nuvens', forecast: ['26°','27°','23°'] },
  rj: { city: 'Rio de Janeiro', state: 'Rio de Janeiro · RJ', temp: '21°', condition: 'Chuva leve', range: 'Máx. 23° · Mín. 19°', photo: '/exemplos/clima-rj-chuva.jpg', alt: 'Enseada de Botafogo e Pão de Açúcar sob céu chuvoso, com calçada molhada', forecast: ['21°','22°','20°'], rain: true },
  ce: { city: 'Fortaleza', state: 'Ceará · CE', temp: '29°', condition: 'Parcialmente nublado', range: 'Máx. 31° · Mín. 26°', photo: '/exemplos/clima-ce-nuvens.jpg', alt: 'Orla de Fortaleza no Ceará com nuvens brancas e aberturas de sol', forecast: ['30°','31°','28°'] },
};

function WeatherIcon({ rain = false }) {
  return <svg viewBox="0 0 100 90" aria-hidden="true">{!rain && <g stroke="#ffda75" strokeWidth="4" strokeLinecap="round"><circle cx="43" cy="32" r="17" fill="#ffda75" /><path d="M43 3v6M43 55v6M14 32h6M66 32h6M22 11l4 4M60 49l4 4M22 53l4-4M60 15l4-4" /></g>}<path d="M25 62h50c20 0 19-28 3-30-7-26-42-21-45 0-22-2-27 30-8 30Z" fill="#f8fbff" />{rain && <path d="m33 71-4 9m22-9-4 9m22-9-4 9" stroke="#83d5ff" strokeWidth="4" strokeLinecap="round" />}</svg>;
}

function Bars({ ads = false }) {
  const heights = ads ? [26,39,32,61,70,93] : [36,54,47,72,65,99];
  return <div className="dash-bars">{heights.map((h,i)=><div key={i}><span className="dash-bars__pair">{ads && <i className="dash-bars__cost" style={{height: h / 3 + '%'}} />}<i style={{height:h+'%'}} /></span><small>{['Seg','Ter','Qua','Qui','Sex','Sáb'][i]}</small></div>)}</div>;
}

export default function WidgetExample({ type, portrait, variant = 'powerbi', city = 'sp' }) {
  if (type === 'weather') {
    const weather = WEATHER[city] || WEATHER.sp;
    return <div className={`climate-demo ${portrait ? 'climate-demo--portrait' : ''}`}>
      <img className="climate-demo__photo" src={weather.photo} alt={weather.alt} loading="lazy" width="1672" height="941" />
      <div className="climate-demo__content">
        <div className="climate-demo__top"><span>CLIMA & INFORMAÇÃO</span><b>09:41</b></div>
        <div className="climate-demo__place"><small>{weather.state}</small><strong>{weather.city}</strong></div>
        <div className="climate-demo__now"><strong>{weather.temp}</strong><WeatherIcon rain={weather.rain} /></div>
        <div className="climate-demo__condition"><b>{weather.condition}</b><span>{weather.range}</span></div>
        <div className="climate-demo__forecast">{weather.forecast.map((temp,i)=><div key={i}><span>{['12h','15h','18h'][i]}</span><WeatherIcon rain={weather.rain} /><b>{temp}</b></div>)}</div>
        <small className="climate-demo__note">Clima ilustrativo · cenário da condição exibida</small>
      </div>
    </div>;
  }
  const ads = variant === 'ads';
  return <div className={`signage-dashboard ${portrait ? 'signage-dashboard--portrait' : ''} ${ads ? 'signage-dashboard--ads' : ''}`}>
    <div className="dash-appbar"><span className="dash-appmark" aria-hidden="true">{ads ? '↗' : <><i /><i /><i /></>}</span><b>{ads ? 'Ads · Visão de vendas' : 'Power BI · Painel demonstrativo'}</b><span>•••</span></div>
    <div className="dash-workspace">
      <div className="dash-title"><div><small>{ads ? 'PERFORMANCE DE MÍDIA' : 'VISÃO EXECUTIVA'}</small><strong>{ads ? 'Do anúncio à venda.' : 'Resultado à vista.'}</strong></div><span>Esta semana ▾</span></div>
      <div className="dash-kpis">
        <div><small>{ads ? 'Receita atribuída' : 'Receita total'}</small><strong>{ads ? 'R$ 19.200' : 'R$ 128.400'}</strong><span>{ads ? '128 pedidos' : '856 vendas'}</span></div>
        <div><small>{ads ? 'Investimento' : 'Meta atingida'}</small><strong>{ads ? 'R$ 3.200' : '86%'}</strong><span>{ads ? 'CPA: R$ 25' : 'Meta: R$ 150 mil'}</span></div>
        <div><small>{ads ? 'ROAS' : 'Ticket médio'}</small><strong>{ads ? '6,0×' : 'R$ 150'}</strong><span>{ads ? 'Receita ÷ investimento' : 'Receita ÷ vendas'}</span></div>
      </div>
      <div className="dash-charts"><div className="dash-panel dash-panel--bars"><div className="dash-panel__title"><b>{ads ? 'Receita e investimento' : 'Receita por dia'}</b><small>{ads ? '■ Receita  ▪ Mídia' : 'Semana atual'}</small></div><Bars ads={ads} /></div>
        <div className="dash-panel dash-panel--donut"><b>{ads ? 'Vendas por canal' : 'Canais de venda'}</b><div className="dash-donut"><span>{ads ? '128' : '856'}<small>vendas</small></span></div><div className="dash-legend"><span>■ {ads ? 'Meta Ads · 66%' : 'Loja · 68%'}</span><span>■ {ads ? 'Google Ads · 34%' : 'Online · 32%'}</span></div></div>
      </div>
      <div className="dash-bottom">{ads ? <><b>Funil da campanha</b><div className="dash-funnel"><span><strong>4.000</strong> cliques</span><i>→</i><span><strong>640</strong> carrinhos</span><i>→</i><span><strong>128</strong> pedidos</span></div></> : <><b>Receita por unidade</b><div className="dash-units"><span>São Paulo <b>R$ 54,8 mil</b></span><span>Campinas <b>R$ 41,2 mil</b></span><span>Santos <b>R$ 32,4 mil</b></span></div></>}</div>
      <small className="dash-disclaimer">Dados fictícios · exemplo de dashboard na TV{!ads && ' · Plano Rede'}</small>
    </div>
  </div>;
}

