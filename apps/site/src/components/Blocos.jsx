import { useRef, useState } from 'react';
import BlockExample from './BlockExample';
import CanvasDemo from './CanvasDemo';
import useDemoCycle from './useDemoCycle';
import './ScreenPlaylist.css';
import './Blocos.css';

// Only existing editor blocks. All previews are illustrative.
// Keep document and Power BI plan gates explicit.
const BLOCOS = [
  {
    id: 'aviso', nome: 'Texto e aviso', exemplo: 'Horários e recados', local: 'Na recepção da clínica',
    dor: '“Não sabia que vocês atendiam aos sábados.”',
    uso: 'Seu cliente já está na recepção, mas ainda não conhece todos os horários. Coloque esse aviso na TV e deixe a informação à vista.',
    como: 'Escreva o recado, escolha tamanho e cor e publique na tela.',
    icone: <path d="M4 6h16M12 6v14" />,
  },
  {
    id: 'foto', nome: 'Foto e GIF', exemplo: 'O produto em destaque', local: 'No balcão da sorveteria',
    dor: '“Eu nem vi que tinha esse sabor.”',
    uso: 'O produto novo passa despercebido no balcão. Uma foto grande na TV apresenta o sabor enquanto o cliente escolhe o pedido.',
    como: 'Envie sua foto ou GIF, acrescente a oferta e inclua na programação.',
    icone: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m3 16 5-5 4 4 3-3 6 6" /><circle cx="15" cy="8" r="1" /></>,
  },
  {
    id: 'video', nome: 'Vídeo', exemplo: 'Bastidores que valorizam', local: 'No salão do restaurante',
    dor: '“Por que esse prato é especial?”',
    uso: 'Quem vê só o nome no cardápio não conhece o cuidado no preparo. Mostre os bastidores na TV enquanto o cliente espera.',
    como: 'Use um vídeo seu ou um link do YouTube, em loop, com ou sem som.',
    icone: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="m10 9 5 3-5 3Z" /></>,
  },
  {
    id: 'clima', nome: 'Relógio e clima', exemplo: 'Uma espera mais útil', local: 'Na sala de espera',
    dor: '“Será que vai chover quando eu sair?”',
    uso: 'Na espera, informações simples fazem falta. Combine a hora e o clima da cidade com as orientações da recepção.',
    como: 'Escolha a cidade e posicione os widgets de clima e relógio na sua cena.',
    icone: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  },
  {
    id: 'noticias', nome: 'Notícias', exemplo: 'Assunto para a espera', local: 'No lounge do coworking',
    dor: '“Essa tela só passa o mesmo anúncio.”',
    uso: 'Uma programação repetitiva perde a atenção. Intercale seus avisos com notícias da fonte que fizer sentido para o seu público.',
    como: 'Configure o feed de notícias e deixe as manchetes se alternarem na TV.',
    icone: <><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" /></>,
  },
  {
    id: 'agenda', nome: 'Agenda e contador', exemplo: 'A próxima aula à vista', local: 'Na entrada da academia',
    dor: '“Que horas começa a próxima aula?”',
    uso: 'A equipe repete os mesmos horários ao longo do dia. Exiba a agenda das aulas e destaque a contagem para um evento especial.',
    como: 'Preencha a agenda e ajuste a data do contador no editor.',
    icone: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 2v4M16 2v4M3 10h18M7 14h3M14 14h3" /></>,
  },
  {
    id: 'documentos', nome: 'PDF e planilhas', exemplo: 'O arquivo que você já usa', local: 'No refeitório da empresa', plano: 'Plano Loja ou Rede',
    dor: '“O cardápio mudou e o papel ficou velho.”',
    uso: 'A informação já existe num arquivo, mas não chega a quem precisa. Mostre seu PDF, documento ou planilha na TV do ambiente.',
    como: 'Adicione o PDF ou o documento compatível ao bloco de documentos.',
    icone: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
  },
  {
    id: 'resultados', nome: 'Painel de resultados', exemplo: 'Metas para toda a equipe', local: 'Na sala do time comercial', plano: 'Plano Rede',
    dor: '“Quanto falta para a meta desta semana?”',
    uso: 'O resultado fica numa aba que quase ninguém abre. Leve seu painel de indicadores para a TV e mantenha a meta visível para o time.',
    como: 'Exiba seu painel do Power BI ou uma página web compatível na tela.',
    icone: <path d="M3 3v18h18M7 14l4-4 4 4 5-6" />,
  },
  {
    id: 'listas', nome: 'Notas e listas', exemplo: 'O turno bem alinhado', local: 'Na área interna da loja',
    dor: '“Achei que outra pessoa ia fazer isso.”',
    uso: 'Recados se perdem entre conversas e trocas de turno. Deixe as tarefas do dia e as orientações da equipe num quadro visível.',
    como: 'Monte a lista no editor e atualize os recados quando a rotina mudar.',
    icone: <path d="m3 6 2 2 3-4M11 6h10M3 13l2 2 3-4M11 13h10M11 20h10M4 20h2" />,
  },
];

function ExampleScreen({ bloco }) {
  const [paused, setPaused] = useState(false);
  const { frameRef, index } = useDemoCycle(2, paused);
  return (
    <div className="blocos__screen-wrap" ref={frameRef} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="blocos__scene-label"><span />{bloco.local}<small>Exemplo ilustrativo</small></div>
      <div className="demo-tv blocos__tv" role="group" aria-label={`Exemplo na TV: ${bloco.nome}`}>
        <div className="demo-tv__body">
          <div className="demo-tv__viewport" data-example={bloco.id} data-current-slide={index}>
            <BlockExample type={bloco.id} frame={index} />
          </div>
          <div className="demo-tv__bezel"><span className="demo-tv__sensor" /><span className="blocos__tv-wordmark"><span className="brand-lockup brand-lockup--white" style={{width:32,height:9}} /></span></div>
        </div>
        <div className="demo-tv__stand" />
      </div>
    </div>
  );
}

export default function Blocos() {
  const [active, setActive] = useState(1);
  const tabs = useRef([]);
  const bloco = BLOCOS[active];

  function navigate(event, index) {
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 };
    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = BLOCOS.length - 1;
    else if (event.key in moves) next = (index + moves[event.key] + BLOCOS.length) % BLOCOS.length;
    else return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section id="na-tela" className="secao blocos-secao" aria-labelledby="na-tela-titulo">
      <div className="secao__cabeca reveal blocos__heading">
        <span className="blocos__eyebrow">PEQUENAS SITUAÇÕES. NOVAS POSSIBILIDADES.</span>
        <h2 id="na-tela-titulo" className="h2">Seu cliente está aí.<br />O que ele ainda não está vendo?</h2>
        <p className="lead">Uma oferta, um horário, uma informação útil. Escolha um recurso e veja como ele pode fazer parte do seu negócio.</p>
      </div>
      <div className="blocos__workbench reveal">
        <div className="blocos__chooser">
          <p className="blocos__instruction"><span>01</span> Escolha o que mostrar</p>
          <div className="blocos__tabs" role="tablist" aria-label="Exemplos de conteúdo para a TV">
            {BLOCOS.map((item, index) => (
              <button type="button" role="tab" key={item.id} id={`bloco-tab-${item.id}`}
                className="blocos__tab" aria-selected={active === index} aria-controls="bloco-exemplo"
                tabIndex={active === index ? 0 : -1} ref={element => { tabs.current[index] = element; }}
                onClick={() => setActive(index)} onKeyDown={event => navigate(event, index)}>
                <span className="blocos__thumbnail" aria-hidden="true"><BlockExample type={item.id} frame={0} /></span><svg className="blocos__tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icone}</svg>
                <strong>{item.nome}</strong><small>{item.exemplo}</small>
              </button>
            ))}
          </div>
          <p className="blocos__hint">Use os ícones para explorar os 9 exemplos.<br />Na sua tela, você combina os blocos como quiser.</p>
        </div>
        <div id="bloco-exemplo" className="blocos__example" role="tabpanel" aria-labelledby={`bloco-tab-${bloco.id}`} tabIndex="0">
          <p className="blocos__instruction"><span>02</span> Veja na prática {bloco.plano && <small className="blocos__plan">{bloco.plano}</small>}</p>
          <ExampleScreen key={bloco.id} bloco={bloco} />
          <div className="blocos__story">
            <div className="blocos__pain"><span>JÁ OUVIU ALGO ASSIM?</span><h3>{bloco.dor}</h3></div>
            <div className="blocos__application"><span>COM A TV NO SEU NEGÓCIO</span><p>{bloco.uso}</p></div>
          </div>
          <p className="blocos__how"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>{bloco.como}</p>
        </div>
      </div>
      <CanvasDemo type={bloco.id} options={BLOCOS} onSelect={id => setActive(BLOCOS.findIndex(item => item.id === id))} />
      <p className="blocos__footnote">Conteúdos, preços de produtos, notícias e indicadores demonstrativos. Você define o que aparece e por quanto tempo.</p>
    </section>
  );
}
