import { signupUrl } from '../lib/funnel';
import { EVENT, track } from '../lib/tracking';
import './Passos.css';

// The pairing preview is illustrative and follows the current product identity.

const PASSOS = [
  {
    titulo: 'Crie a tela e escolha o formato',
    texto: 'Deitada (16:9) para a TV da parede, em pé (9:16) para totem ou vitrine.',
  },
  {
    titulo: 'Arraste o que quer mostrar',
    texto: 'Texto, foto, vídeo, relógio, clima, notícias, agenda, PDF. Aperte Salvar.',
  },
  {
    titulo: 'Vincule a TV pelo código',
    texto: 'Abra o endereço de exibição no navegador da TV. No painel, escolha Vincular TV e informe os 6 dígitos que aparecem no aparelho.',
  },
];

const ROTULO_CTA = 'Colocar minha 1ª tela no ar grátis';

export default function Passos({ startConversion }) {
  const converter = () => {
    track({ event: EVENT.CTA_CLICK, params: { cta_location: 'passos', plan: 'gratis' } });

    if (typeof startConversion === 'function') {
      startConversion('gratis', 'passos', ROTULO_CTA, 1);
      return;
    }

    // Plano B: o mesmo destino do funil, com a atribuição de campanha junto.
    window.location.href = signupUrl('gratis', 1);
  };

  return (
    <section
      id="como-funciona"
      className="secao passos"
      aria-labelledby="passos-titulo"
    >
      <div className="split split--midia">
        <div className="passos__texto reveal">
          <h2 id="passos-titulo" className="h2">
            Leva menos tempo que fazer um cartaz.
          </h2>

          <ol className="passos__lista">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="passo">
                <span className="passo__num" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="passo__corpo">
                  <h3 className="passo__titulo">{passo.titulo}</h3>
                  <p className="lead passo__texto">{passo.texto}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="lead passos__aviso">
            Se a tela cair, você recebe um e-mail antes de alguém reparar.
          </p>

          <button type="button" className="btn passos__cta" onClick={converter}>
            {ROTULO_CTA}
          </button>
        </div>

        <figure className="passos__midia reveal">
          <div className="shot pairing-preview"><div className="pairing-preview__brand"><span className="brand-lockup brand-lockup--white" role="img" aria-label="Tellas" /></div><span className="pairing-preview__eyebrow">SUA PRÓXIMA TELA COMEÇA AQUI</span><h3>Conecte sua TV.</h3><p>No painel, escolha Vincular TV e informe<br />o código exibido no seu aparelho.</p><div className="pairing-preview__code" aria-label="Código demonstrativo 000000">{[0,1,2,3,4,5].map(n=><span key={n}>0</span>)}</div><small><i /> Aguardando conexão · código demonstrativo</small></div>
          <figcaption className="cap passos__legenda">
            Simulação de pareamento com a identidade visual atual.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
