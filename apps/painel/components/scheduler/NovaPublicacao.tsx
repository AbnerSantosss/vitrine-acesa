import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, Check, FilePlus2, Lock, Monitor, MonitorCheck,
  MonitorSmartphone, Tv, Zap,
} from 'lucide-react';
import type { Device, Display } from '../../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { MODELOS_DE_AVISO, buscarModelo } from './modelosDeAviso';
import { MiniaturaModelo } from './MiniaturaModelo';
import { EscolherTelas } from './EscolherTelas';
import { dividirPorOrientacao, paraDataHoraLocal, validarJanela } from './regrasDePublicacao';

export type OndePublicar = 'todas' | 'escolher' | 'uma';

export type QuandoPublicar =
  | { tipo: 'agora' }
  | { tipo: 'janela'; inicio: string; fim: string };

export interface ResultadoNovaPublicacao {
  nome: string;
  /** `null` = "Em branco". */
  modeloId: string | null;
  displayIds: string[];
  quando: QuandoPublicar;
}

export interface NovaPublicacaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displays: Display[];
  devices: Device[];
  /** Plano com `agendamento-avancado` (Loja para cima). Sem ele, a janela de horário aparece com cadeado. */
  podeAgendar: boolean;
  /** Botão "Todas as telas" abre já com esse alvo e o modelo "Aviso urgente". */
  ondeInicial?: OndePublicar;
  onConfirmar: (resultado: ResultadoNovaPublicacao) => void;
  onVerPlanos: () => void;
  onConectarTv: () => void;
}

const EM_BRANCO = 'em-branco';
const PASSOS = ['Modelo', 'Onde', 'Quando'] as const;

/** Classe comum dos cartões de escolha grandes (passos 2 e 3). */
const cartaoDeEscolha = (marcado: boolean, bloqueado = false) =>
  `w-full min-h-16 flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${
    bloqueado
      ? 'border-borda bg-papel-2 cursor-not-allowed'
      : marcado
        ? 'border-marca bg-marca-fundo cursor-pointer'
        : 'border-borda bg-papel hover:border-borda-3 cursor-pointer'
  }`;

/**
 * Assistente "Nova publicação": Modelo, Onde e Quando. Ao confirmar, o Scheduler abre o editor
 * com o modelo aplicado; quem publica é o botão "Publicar" do editor.
 */
export const NovaPublicacao: React.FC<NovaPublicacaoProps> = ({
  open, onOpenChange, displays, devices, podeAgendar, ondeInicial, onConfirmar, onVerPlanos, onConectarTv,
}) => {
  const [passo, setPasso] = useState(0);
  const [modeloId, setModeloId] = useState<string | null>(null);
  const [onde, setOnde] = useState<OndePublicar>('todas');
  const [escolhidas, setEscolhidas] = useState<string[]>([]);
  const [tipoQuando, setTipoQuando] = useState<'agora' | 'janela'>('agora');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [nome, setNome] = useState('');
  const [nomeEditado, setNomeEditado] = useState(false);

  // Toda abertura começa do zero; o botão "Todas as telas" já chega com alvo e modelo.
  useEffect(() => {
    if (!open) return;
    setPasso(0);
    setModeloId(ondeInicial === 'todas' ? 'aviso-urgente' : null);
    setOnde(ondeInicial ?? 'todas');
    setEscolhidas([]);
    setTipoQuando('agora');
    const agora = Date.now();
    setInicio(paraDataHoraLocal(agora));
    setFim(paraDataHoraLocal(agora + 24 * 3600000));
    setNome('');
    setNomeEditado(false);
  }, [open, ondeInicial]);

  // Nome sugerido pelo modelo até o cliente digitar o dele.
  useEffect(() => {
    if (nomeEditado) return;
    const modelo = buscarModelo(modeloId);
    setNome(modelo ? modelo.titulo : 'Nova publicação');
  }, [modeloId, nomeEditado]);

  // Miniaturas na orientação da maioria das telas da conta.
  const orientacaoDasMiniaturas = useMemo<'horizontal' | 'vertical'>(() => {
    const emPe = displays.filter(d => d.orientation === 'vertical').length;
    return displays.length > 0 && emPe > displays.length / 2 ? 'vertical' : 'horizontal';
  }, [displays]);

  const idsDoAlvo = useMemo(() => {
    if (onde === 'todas') return displays.map(d => d.id);
    const validos = new Set(displays.map(d => d.id));
    const ids = escolhidas.filter(id => validos.has(id));
    return onde === 'uma' ? ids.slice(0, 1) : ids;
  }, [onde, escolhidas, displays]);

  const grupos = useMemo(
    () => dividirPorOrientacao(displays.filter(d => idsDoAlvo.includes(d.id))),
    [displays, idsDoAlvo],
  );
  const misturado = grupos.length > 1;
  const erroDaJanela = tipoQuando === 'janela' ? validarJanela(inicio, fim) : null;

  const podeAvancar =
    passo === 0 ? modeloId !== null
    : passo === 1 ? idsDoAlvo.length > 0
    : nome.trim().length > 0 && (tipoQuando === 'agora' || (podeAgendar && !erroDaJanela));

  const trocarOnde = (novo: OndePublicar) => {
    setOnde(novo);
    if (novo === 'uma') setEscolhidas(prev => prev.slice(0, 1));
  };

  const confirmar = () => {
    if (!podeAvancar) return;
    onConfirmar({
      nome: nome.trim(),
      modeloId: modeloId === EM_BRANCO ? null : modeloId,
      displayIds: idsDoAlvo,
      quando: tipoQuando === 'janela' ? { tipo: 'janela', inicio, fim } : { tipo: 'agora' },
    });
  };

  const semTelas = displays.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-papel border-borda text-tinta p-5 md:p-6 shadow-modal">
        <DialogHeader className="pr-10">
          <DialogTitle className="text-xl font-bold text-tinta">Nova publicação</DialogTitle>
          <DialogDescription className="text-base md:text-sm text-tinta-3">
            {passo === 0 && 'Escolha um modelo pronto ou comece em branco. Tudo pode ser editado depois.'}
            {passo === 1 && 'Escolha em quais telas a publicação vai aparecer.'}
            {passo === 2 && 'Dê um nome e escolha quando ela entra no ar.'}
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-4 flex items-center gap-2" aria-label="Passos">
          {PASSOS.map((rotulo, i) => (
            <li key={rotulo} className="flex items-center gap-2 flex-1 min-w-0">
              <span
                aria-current={i === passo ? 'step' : undefined}
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < passo ? 'bg-ok text-white' : i === passo ? 'bg-marca text-white' : 'bg-papel-3 text-tinta-3'
                }`}
              >
                {i < passo ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`truncate text-sm font-bold ${i === passo ? 'text-tinta' : 'text-tinta-3'}`}>{rotulo}</span>
              {i < PASSOS.length - 1 && <span aria-hidden className="hidden sm:block flex-1 h-px bg-borda" />}
            </li>
          ))}
        </ol>

        <div className="mt-5">
          {/* PASSO 1: MODELO */}
          {passo === 0 && (
            <div role="radiogroup" aria-label="Modelos" className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MODELOS_DE_AVISO.map(modelo => {
                const marcado = modeloId === modelo.id;
                return (
                  <button
                    key={modelo.id}
                    type="button"
                    role="radio"
                    aria-checked={marcado}
                    onClick={() => setModeloId(modelo.id)}
                    onDoubleClick={() => { setModeloId(modelo.id); setPasso(1); }}
                    className={`flex flex-col gap-2 p-2 rounded-2xl border-2 text-left transition-colors cursor-pointer ${
                      marcado ? 'border-marca bg-marca-fundo' : 'border-borda bg-papel hover:border-borda-3'
                    }`}
                  >
                    <MiniaturaModelo
                      itens={orientacaoDasMiniaturas === 'vertical' ? modelo.vertical : modelo.horizontal}
                      orientation={orientacaoDasMiniaturas}
                      className={orientacaoDasMiniaturas === 'vertical' ? 'w-1/2 mx-auto' : 'w-full'}
                    />
                    <span className="px-1">
                      <span className="block text-base md:text-sm font-bold text-tinta leading-tight">{modelo.titulo}</span>
                      <span className="block text-sm md:text-xs text-tinta-3 leading-snug mt-0.5">{modelo.descricao}</span>
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                role="radio"
                aria-checked={modeloId === EM_BRANCO}
                onClick={() => setModeloId(EM_BRANCO)}
                onDoubleClick={() => { setModeloId(EM_BRANCO); setPasso(1); }}
                className={`flex flex-col gap-2 p-2 rounded-2xl border-2 border-dashed text-left transition-colors cursor-pointer ${
                  modeloId === EM_BRANCO ? 'border-marca bg-marca-fundo' : 'border-borda-3 bg-papel hover:border-marca'
                }`}
              >
                <span
                  className={`flex items-center justify-center rounded-lg bg-papel-2 text-tinta-3 ${orientacaoDasMiniaturas === 'vertical' ? 'w-1/2 mx-auto' : 'w-full'}`}
                  style={{ aspectRatio: orientacaoDasMiniaturas === 'vertical' ? '9 / 16' : '16 / 9' }}
                >
                  <FilePlus2 size={28} aria-hidden />
                </span>
                <span className="px-1">
                  <span className="block text-base md:text-sm font-bold text-tinta leading-tight">Em branco</span>
                  <span className="block text-sm md:text-xs text-tinta-3 leading-snug mt-0.5">Monte do seu jeito no editor</span>
                </span>
              </button>
            </div>
          )}

          {/* PASSO 2: ONDE */}
          {passo === 1 && (
            semTelas ? (
              <div className="py-8 px-4 text-center border-2 border-dashed border-borda rounded-2xl bg-papel-2">
                <Tv size={40} className="mx-auto text-tinta-3 mb-3" aria-hidden />
                <p className="text-base font-bold text-tinta">Você ainda não tem nenhuma tela conectada</p>
                <p className="text-base md:text-sm text-tinta-3 mt-1 mb-5">Conecte uma TV para escolher onde a publicação vai aparecer.</p>
                <button
                  type="button"
                  onClick={onConectarTv}
                  className="min-h-11 px-5 rounded-xl bg-marca hover:bg-marca-hover text-white font-bold cursor-pointer"
                >
                  Conectar uma TV
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div role="radiogroup" aria-label="Onde publicar" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { id: 'todas', titulo: 'Todas as telas', texto: `As ${displays.length} telas da conta`, Icone: MonitorCheck },
                    { id: 'escolher', titulo: 'Escolher telas', texto: 'Marque uma ou mais', Icone: MonitorSmartphone },
                    { id: 'uma', titulo: 'Uma tela', texto: 'Só em uma tela', Icone: Monitor },
                  ] as const).map(({ id, titulo, texto, Icone }) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={onde === id}
                      onClick={() => trocarOnde(id)}
                      className={cartaoDeEscolha(onde === id)}
                    >
                      <Icone size={22} className={onde === id ? 'text-marca shrink-0' : 'text-tinta-3 shrink-0'} aria-hidden />
                      <span>
                        <span className="block text-base font-bold text-tinta">{titulo}</span>
                        <span className="block text-sm text-tinta-3">{texto}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {onde !== 'todas' && (
                  <EscolherTelas
                    displays={displays}
                    devices={devices}
                    modo={onde === 'uma' ? 'uma' : 'varias'}
                    selecionadas={escolhidas}
                    onChange={setEscolhidas}
                  />
                )}
              </div>
            )
          )}

          {/* PASSO 3: QUANDO */}
          {passo === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="nome-publicacao" className="block text-sm font-bold text-tinta-2 mb-1.5">Nome da publicação</label>
                <input
                  id="nome-publicacao"
                  type="text"
                  value={nome}
                  onChange={e => { setNome(e.target.value); setNomeEditado(true); }}
                  placeholder="Ex.: Aviso do caixa 3"
                  className="w-full h-11 bg-papel-2 border border-borda rounded-xl px-3 text-base md:text-sm text-tinta placeholder:text-tinta-3 focus:border-marca outline-none"
                />
                <p className="text-sm md:text-xs text-tinta-3 mt-1">Só você vê esse nome, na lista de publicações.</p>
              </div>

              <div role="radiogroup" aria-label="Quando publicar" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  role="radio"
                  aria-checked={tipoQuando === 'agora'}
                  onClick={() => setTipoQuando('agora')}
                  className={cartaoDeEscolha(tipoQuando === 'agora')}
                >
                  <Zap size={22} className={tipoQuando === 'agora' ? 'text-marca shrink-0' : 'text-tinta-3 shrink-0'} aria-hidden />
                  <span>
                    <span className="block text-base font-bold text-tinta">Agora, até eu tirar</span>
                    <span className="block text-sm text-tinta-3">Entra no ar quando você publicar e fica até você tirar.</span>
                  </span>
                </button>

                <div className={cartaoDeEscolha(tipoQuando === 'janela', !podeAgendar)}>
                  {podeAgendar ? (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={tipoQuando === 'janela'}
                      onClick={() => setTipoQuando('janela')}
                      className="flex items-start gap-3 text-left w-full cursor-pointer"
                    >
                      <CalendarClock size={22} className={tipoQuando === 'janela' ? 'text-marca shrink-0' : 'text-tinta-3 shrink-0'} aria-hidden />
                      <span>
                        <span className="block text-base font-bold text-tinta">Em data e hora marcadas</span>
                        <span className="block text-sm text-tinta-3">Escolha quando começa e quando termina.</span>
                      </span>
                    </button>
                  ) : (
                    <div role="radio" aria-checked={false} aria-disabled className="flex items-start gap-3 w-full">
                      <Lock size={22} className="text-tinta-3 shrink-0" aria-hidden />
                      <span className="flex-1">
                        <span className="block text-base font-bold text-tinta-2">Em data e hora marcadas</span>
                        <span className="block text-sm text-tinta-3">Disponível no plano Loja. No seu plano, a publicação entra agora e fica até você tirar.</span>
                        <button
                          type="button"
                          onClick={onVerPlanos}
                          className="mt-2 min-h-11 px-4 rounded-xl border border-marca text-marca hover:bg-marca-fundo font-bold text-sm cursor-pointer"
                        >
                          Ver o plano Loja
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {tipoQuando === 'janela' && podeAgendar && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="inicio-publicacao" className="block text-sm font-bold text-tinta-2 mb-1.5">Começa</label>
                    <input
                      id="inicio-publicacao"
                      type="datetime-local"
                      value={inicio}
                      onChange={e => setInicio(e.target.value)}
                      className="w-full h-11 bg-papel-2 border border-borda rounded-xl px-3 text-base md:text-sm text-tinta focus:border-marca outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="fim-publicacao" className="block text-sm font-bold text-tinta-2 mb-1.5">Termina</label>
                    <input
                      id="fim-publicacao"
                      type="datetime-local"
                      value={fim}
                      onChange={e => setFim(e.target.value)}
                      className="w-full h-11 bg-papel-2 border border-borda rounded-xl px-3 text-base md:text-sm text-tinta focus:border-marca outline-none"
                    />
                  </div>
                  {erroDaJanela && <p role="alert" className="sm:col-span-2 text-sm text-danger font-bold">{erroDaJanela}</p>}
                </div>
              )}
            </div>
          )}

          {/* Telas deitadas e em pé na mesma escolha: avisa nos passos 2 e 3, antes de confirmar. */}
          {misturado && passo >= 1 && !semTelas && (
            <div className="mt-4 bg-warn-fundo border border-warn/30 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-warn-tinta mt-0.5 shrink-0" aria-hidden />
              <p className="text-base md:text-sm text-warn-tinta leading-relaxed">
                Você escolheu telas deitadas e em pé. Vamos criar <strong>duas publicações</strong> com o mesmo modelo:
                uma 16:9 para {grupos[0].displayIds.length} {grupos[0].displayIds.length === 1 ? 'tela' : 'telas'} e
                uma 9:16 para {grupos[1].displayIds.length} {grupos[1].displayIds.length === 1 ? 'tela' : 'telas'}.
                Você ajusta e publica uma de cada vez no editor.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => (passo === 0 ? onOpenChange(false) : setPasso(passo - 1))}
            className="min-h-11 px-5 rounded-xl bg-papel-3 hover:bg-borda text-tinta font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            {passo === 0 ? 'Cancelar' : <><ArrowLeft size={18} aria-hidden /> Voltar</>}
          </button>
          <button
            type="button"
            disabled={!podeAvancar || (passo === 1 && semTelas)}
            onClick={() => (passo < 2 ? setPasso(passo + 1) : confirmar())}
            className="min-h-11 px-6 rounded-xl bg-marca hover:bg-marca-hover text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {passo < 2 ? <>Continuar <ArrowRight size={18} aria-hidden /></> : <>Abrir no editor <ArrowRight size={18} aria-hidden /></>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NovaPublicacao;
