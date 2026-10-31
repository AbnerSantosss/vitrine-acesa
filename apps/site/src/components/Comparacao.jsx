import { precoUnitario, MENSAL, reais } from '../data/catalogo';
import './Comparacao.css';

const COLUNAS = ['Cartaz impresso', 'Pen-drive', 'Serviço contratado', 'TelaHub'];
const LINHAS = [
  ['Atualizar o conteúdo', 'Editar e imprimir novamente', 'Editar o arquivo e levar até a TV', 'Solicitar a alteração ao fornecedor', 'Editar e publicar pelo painel'],
  ['Investimento inicial', 'Impressão e reposição sob orçamento', 'TV e pen-drive compatíveis', 'Conforme proposta e equipamentos', `${reais(precoUnitario('gratis', MENSAL))} para começar com 1 tela`],
  ['Cuidar de várias telas', 'Trocar cada cartaz no local', 'Atualizar cada aparelho', 'Conforme o serviço contratado', 'Organizar a publicação em um painel'],
  ['Saber se a TV desconectou', 'Não se aplica', 'Verificação no local', 'Depende do serviço contratado', 'Receber um aviso por e-mail'],
  ['Compromisso', 'Pagamento a cada impressão', 'Compra do equipamento', 'Conforme o contrato', 'Mensal sem fidelidade; anual de 12 meses'],
];

export default function Comparacao() {
  return <section id="comparar" className="secao comparacao-secao" aria-labelledby="comparar-titulo">
    <div className="secao__cabeca reveal">
      <span className="blocos__eyebrow">MENOS IDAS E VINDAS. MAIS AUTONOMIA.</span>
      <h2 id="comparar-titulo" className="h2">Compare a rotina,<br />além do preço.</h2>
      <p className="lead">O custo também está no trabalho de manter a informação atualizada. Veja o que muda em cada opção.</p>
    </div>
    <div className="tabela card comparacao__quadro reveal">
      <table className="comparacao__tabela" role="table">
        <caption className="sr-only">Comparação de atualização, investimento e operação de cartazes, pen-drive, serviço contratado e TelaHub.</caption>
        <thead role="rowgroup"><tr role="row"><th scope="col">Na sua rotina</th>{COLUNAS.map((coluna,i)=><th key={coluna} scope="col" className={i===3?'comparacao__nos':''}>{coluna}{i===3&&<small>Você no controle</small>}</th>)}</tr></thead>
        <tbody role="rowgroup">{LINHAS.map(([criterio,...valores])=><tr key={criterio} role="row">
          <th scope="row" role="rowheader">{criterio}</th>{valores.map((valor,i)=><td role="cell" key={COLUNAS[i]} data-coluna={COLUNAS[i]} className={i===3?'comparacao__nos':''}>{i===3&&<span aria-hidden="true">✓ </span>}{valor}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <p className="micro comparacao__nota">Valores do TelaHub em reais. Impressão, equipamentos e serviços de terceiros dependem de orçamento. No mensal, o cancelamento é solicitado pelo atendimento e vale no próximo ciclo, sem multa.</p>
  </section>;
}
