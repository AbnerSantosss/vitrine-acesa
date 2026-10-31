import './ExampleArtwork.css';

const PHOTOS={aviso:'canvas-clinica',foto:'blocos-sorvete',video:'blocos-chef',clima:'canvas-fortaleza',agenda:'canvas-academia',documentos:'canvas-cardapio',listas:'canvas-equipe'};
function Layer({step,children,className=''}) { return <div className={`art-layer ${className}`} data-step={step}>{children}</div>; }
function Footer({children}) { return <Layer step={3} className="art-footer">{children}<span className="art-footer__arrow">↗</span></Layer>; }
function Chart() {return <svg viewBox="0 0 500 155" fill="none" aria-label="Vendas crescendo durante a semana"><path d="M0 35H500M0 80H500M0 125H500" stroke="#ffffff16"/><path d="M0 128 60 110 120 117 180 68 240 80 300 40 360 50 430 17 500 5V155H0Z" fill="#18aee523"/><path d="M0 128 60 110 120 117 180 68 240 80 300 40 360 50 430 17 500 5" stroke="#64d8ff" strokeWidth="4" strokeLinejoin="round"/><circle cx="430" cy="17" r="6" fill="#fff"/></svg>;}

/** Shared, layered compositions: thumbnails, TV preview and assembly use the same art. */
export default function ExampleArtwork({type='listas',frame=0,phase=3}) {
 const photo=PHOTOS[type];
 return <div className={`example-art art--${type}`} data-phase={phase}>
  {photo&&<img className="art-photo" src={`/exemplos/${photo}.jpg`} alt="" loading="lazy"/>}
  <div className="art-shade"/>
  {type==='aviso'&&<>
   <div className="art-kicker"><span>+ VIVA CLÍNICA</span><span>CUIDADO QUE ACOLHE</span></div>
   <Layer step={1} className="art-headline"><span>MAIS TEMPO PARA VOCÊ.</span><h4>Seu cuidado<br/>também cabe<br/>no sábado.</h4></Layer>
   <Layer step={2} className="art-clinic-time"><b>{frame?'08h às 12h':'Sábados'}</b><span>{frame?'Atendimento com hora marcada':'Atendimento das 08h às 12h'}</span></Layer>
   <Footer>Agende seu horário na recepção.</Footer>
  </>}
  {type==='foto'&&<>
   <div className="art-kicker"><span>GELATO / DA CASA</span><span>FEITO ARTESANALMENTE</span></div>
   <Layer step={1} className="art-headline"><span>UM ENCONTRO DELICIOSO.</span><h4>{frame?<>Seu novo<br/><em>favorito.</em></>:<>Pistache<br/>encontrou<br/><em>morango.</em></>}</h4></Layer>
   <Layer step={2} className="art-price"><small>DUAS BOLAS • NO POTINHO</small><b><span>R$</span> 18<span>,00</span></b></Layer>
   <Footer>Peça no balcão. Aproveite cada colherada.</Footer>
  </>}
  {type==='video'&&<>
   <div className="art-kicker"><span>À MESA / COZINHA AUTORAL</span><span>DO PREPARO AO SEU PRATO</span></div>
   <Layer step={1} className="art-headline"><span>INGREDIENTES. TEMPO. CUIDADO.</span><h4>{frame?<>O sabor está<br/>nos <em>detalhes.</em></>:<>Feito à mão.<br/>Preparado<br/><em>pra você.</em></>}</h4></Layer>
   <Layer step={2} className="art-film-note"><b>01 / NA COZINHA</b><span>Massas frescas, preparadas todos os dias.</span><i/></Layer>
   <Footer>Conheça o cuidado por trás do nosso menu.</Footer>
  </>}
  {type==='clima'&&<>
   <div className="art-kicker"><span>FORTALEZA / CE</span><span>{frame?'14:33':'14:32'} • BOA TARDE</span></div>
   <Layer step={1} className="art-weather-title"><span>O DIA LÁ FORA</span><h4>Um pouco de sol.<br/>Um bom dia pela frente.</h4></Layer>
   <Layer step={2} className="art-weather-data"><div><span className="art-sun">☀</span><b>26°</b><p>Sol entre nuvens</p><small>Máx. 28° · Mín. 24°</small></div><ul><li><span>AGORA</span><b>26°</b>☀</li><li><span>15H</span><b>27°</b>☀</li><li><span>18H</span><b>25°</b>☁</li></ul></Layer>
   <Footer>Fique à vontade. Logo chamaremos você.</Footer>
  </>}
  {type==='noticias'&&<>
   <div className="art-kicker"><span>HORIZONTE / BOLETIM</span><span>IDEIAS QUE CONECTAM</span></div>
   <Layer step={1} className="art-news-title"><span>NA PAUSA DO CAFÉ</span><h4>{frame?<>Mais cultura.<br/>Novos encontros.</>:<>Boas ideias<br/>começam com<br/><em>uma conversa.</em></>}</h4></Layer>
   <Layer step={2} className="art-news-stories"><span>NO RADAR / CULTURA & CIDADE</span><div className="art-news-illustration"><i/><i/><i/><b>h.</b></div><h5>{frame?'Feira de livros ocupa a praça neste fim de semana.':'Espaços de trabalho abrem as portas para encontros criativos.'}</h5><p>Um convite para conhecer pessoas e compartilhar novas perspectivas.</p></Layer>
   <Footer>Manchetes ilustrativas • Seu feed, atualizado na tela.</Footer>
  </>}
  {type==='agenda'&&<>
   <div className="art-kicker"><span>MOVIMENTO / ESTÚDIO</span><span>SEU PRÓXIMO PASSO É AQUI</span></div>
   <Layer step={1} className="art-headline"><span>PRÓXIMA AULA</span><h4>{frame?'Alongamento.':'Funcional.'}<br/><em>Vamos juntos?</em></h4></Layer>
   <Layer step={2} className="art-gym-time"><b>{frame?'18:30':'18:00'}</b><span>{frame?'Com a prof. Ana • Sala 2':'Com o prof. Lucas • Sala 1'}</span><div><strong>03</strong><p>DIAS PARA O<br/>DESAFIO MOVIMENTO</p></div></Layer>
   <Footer>HOJE / 18h Funcional · 18h30 Alongamento · 19h Pilates</Footer>
  </>}
  {type==='documentos'&&<>
   <div className="art-kicker"><span>À MESA / REFEITÓRIO</span><span>CARDÁPIO DA SEMANA</span></div>
   <Layer step={1} className="art-headline"><span>PAUSA PARA RECARREGAR.</span><h4>Comer bem<br/>faz parte<br/><em>do dia.</em></h4></Layer>
   <Layer step={2} className="art-menu"><span>{frame?'SEXTA-FEIRA':'QUINTA-FEIRA'} / 11H ÀS 14H</span><h5>{frame?'Peixe ao forno':'Frango grelhado'}</h5><p>{frame?'Arroz, legumes e salada da estação.':'Arroz, legumes assados e folhas frescas.'}</p><small>OPÇÃO VEGETARIANA</small><b>{frame?'Grão-de-bico com legumes':'Risoto de cogumelos'}</b></Layer>
   <Footer>Seu PDF ou planilha, disponível para todos na TV.</Footer>
  </>}
  {type==='resultados'&&<>
   <div className="art-kicker"><span>NORTE / TIME COMERCIAL</span><span>VISÃO DA SEMANA • DADOS DEMO</span></div>
   <Layer step={1} className="art-dashboard-title"><div><span>CADA VENDA CONTA.</span><h4>Vamos mais longe.</h4></div><b>↗ {frame?'78':'72'}%<small>DA META ATINGIDA</small></b></Layer>
   <Layer step={2} className="art-dashboard"><div className="art-stat"><span>RECEITA DA SEMANA</span><b>R$ {frame?'39':'36'}.000</b><small>↑ 18% em relação à semana anterior</small><Chart/><div className="art-chart-days">SEG <span>TER</span><span>QUA</span><span>QUI</span>SEX</div></div><div className="art-dashboard-side"><div><span>META DA SEMANA</span><b>R$ 50 mil</b><i><em style={{width:frame?'78%':'72%'}}/></i></div><div><span>FALTAM PARA CHEGAR LÁ</span><b>R$ {frame?'11':'14'} mil</b><small>O próximo resultado começa agora.</small></div></div></Layer>
   <Footer>Uma equipe alinhada. Uma meta à vista.</Footer>
  </>}
  {type==='listas'&&<>
   <div className="art-kicker"><span>CASA / EQUIPE DA LOJA</span><span>{frame?'FECHAMENTO':'ABERTURA'} • TURNO DO DIA</span></div>
   <Layer step={1} className="art-team-title"><span>O CUIDADO COMEÇA COM A GENTE.</span><h4>{frame?<>Bom trabalho,<br/><em>equipe.</em></>:<>Uma boa loja.<br/>Uma ótima<br/><em>equipe.</em></>}</h4></Layer>
   <Layer step={2} className="art-checklist"><div><b>{frame?'Tudo certo para amanhã?':'Prontos para receber bem?'}</b><span>CHECKLIST DO TURNO</span></div>{(frame?['Organizar o balcão','Conferir o estoque','Preparar a próxima vitrine']:['Conferir a vitrine','Repor os produtos','Atualizar os preços']).map((text,i)=><p key={text}><i>{i<2?'✓':''}</i>{text}<small>{i<2?'FEITO':'A FAZER'}</small></p>)}</Layer>
   <Footer>RECADO DO DIA / Encontro rápido da equipe às 16h.</Footer>
  </>}
 </div>;
}
