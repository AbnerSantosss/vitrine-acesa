import './Rodape.css';

function Selo({tipo,titulo,texto}) {
 return <div className="rodape__selo"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
 {tipo==='trofeu'?<><path d="M10 5h12v9a6 6 0 0 1-12 0ZM10 8H5v4a5 5 0 0 0 6 5M22 8h5v4a5 5 0 0 1-6 5M16 20v6M10 27h12"/><path d="m13 11 2 2 4-4"/></>:<><path d="m16 3 11 4v9c0 7-11 13-11 13S5 23 5 16V7Z"/><path d="m10 15 4 4 8-9"/></>}
 </svg><div><strong>{titulo}</strong><small>{texto}</small></div></div>;
}
export default function Rodape({scrollToSection,abrirContato}) {
 const atalhos=[['Produto',[['Como funciona','como-funciona'],['Para seu negócio','segmentos'],['Recursos na tela','na-tela'],['Planos e preços','precos']]],['Explore',[['Formatos e widgets','formatos'],['Compare as opções','comparar'],['Condições de contratação','risco-zero'],['Perguntas frequentes','duvidas']]]];
 return <footer className="secao rodape">
  <div className="rodape__grade">
   <div className="rodape__marca"><a href="/" aria-label="TelaHub — início"><span className="brand-lockup brand-lockup--white" role="img" aria-label="Tellas" /></a>
    <p>O que o seu negócio precisa dizer.<br />Na tela que seu cliente já está vendo.</p><span className="rodape__origem">Feito no Brasil · Valores em reais</span>
   </div>
   {atalhos.map(([titulo,links])=><nav key={titulo} aria-label={titulo+' no rodapé'}><h2>{titulo}</h2>{links.map(([nome,id])=><button type="button" key={id} onClick={()=>scrollToSection('#'+id,id)}>{nome}</button>)}</nav>)}
   <nav aria-label="Atendimento e documentos"><h2>Vamos conversar</h2><button type="button" onClick={abrirContato}>Falar com a gente ↗</button><a href="/app/">Acessar meu painel</a><a href="/privacidade">Política de privacidade</a><a href="/termos">Termos de uso</a><button type="button" onClick={abrirContato}>Solicitações sobre dados pessoais</button></nav>
  </div>
  <div className="rodape__confianca">
   <div><h2>Comece com tranquilidade</h2><div className="rodape__selos"><Selo titulo="Primeira tela grátis" texto="Sem cartão para começar"/><Selo titulo="7 dias para decidir" texto="Contratação online de plano pago"/></div></div>
   <div className="rodape__pagamentos"><h2>Pagamento · modelos de selos</h2><div><span>◇ Pix</span><span>▰ Cartão</span><span>▥ Boleto</span></div><small>Ilustrativos. Meios disponíveis serão confirmados na contratação.</small></div>
   <div><h2>Reconhecimento · espaço demonstrativo</h2><div className="rodape__selos"><Selo tipo="trofeu" titulo="Prêmio de inovação" texto="Modelo — não concedido"/><Selo titulo="Selo de qualidade" texto="Modelo — não certificado"/></div></div>
  </div>
  <div className="rodape__legal"><div><strong>TelaHub Tecnologia e Comunicação Visual Ltda.</strong><p>CNPJ 00.000.000/0000-00 · Identificação empresarial fictícia para apresentação.</p></div><span>© {new Date().getFullYear()} TelaHub.<br />Todos os direitos reservados.</span></div>
 </footer>;
}
