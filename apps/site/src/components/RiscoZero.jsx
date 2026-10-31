import './RiscoZero.css';

const GARANTIAS = [
 ['01', 'Grátis de verdade', 'Sua primeira tela não expira e não pede cartão. Comece no seu ritmo.'],
 ['02', 'Você escolhe o compromisso', 'Mensal sem fidelidade: peça o cancelamento pelo atendimento, válido no próximo ciclo, sem multa. O anual tem compromisso de 12 meses.'],
 ['03', 'Sem cobrança retroativa', 'Ao mudar para um plano pago, você não paga pelo período que já passou.'],
 ['04', '7 dias para decidir', 'Na contratação online de um plano pago, você pode desistir em até 7 dias e receber o valor de volta.'],
];

export default function RiscoZero({abrirContato}) {
 return <section id="risco-zero" className="secao risco" aria-labelledby="risco-titulo">
   <div className="risco__grade">
     <div className="risco__intro reveal">
       <span className="risco__eyebrow">COMECE COM TRANQUILIDADE</span>
       <h2 id="risco-titulo" className="h2">Sua primeira tela.<br /><em>Seu próximo passo.</em></h2>
       <p>Experimente no seu negócio antes de ampliar. As condições ficam claras desde o início.</p>
       <button type="button" className="btn" onClick={abrirContato}>Montar minha primeira tela com ajuda <span aria-hidden="true">↗</span></button>
       <small>Se precisar, montamos a primeira tela junto com você.</small>
     </div>
     <ul className="risco__lista">{GARANTIAS.map(([numero,titulo,texto])=><li key={numero} className="risco__item reveal">
       <span className="risco__numero" aria-hidden="true">{numero}</span><div><h3>{titulo}</h3><p>{texto}</p></div>
     </li>)}</ul>
   </div>
 </section>;
}
