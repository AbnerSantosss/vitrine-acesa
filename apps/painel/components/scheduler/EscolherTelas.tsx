import React, { useMemo, useState } from 'react';
import { Check, Monitor, Search, Smartphone } from 'lucide-react';
import type { Device, Display } from '../../types';
import { telaEstaOnline } from './regrasDePublicacao';

export interface EscolherTelasProps {
  displays: Display[];
  devices: Device[];
  /** "varias" = caixas de seleção; "uma" = escolha única. */
  modo: 'varias' | 'uma';
  selecionadas: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Lista de telas do passo "Onde" do assistente. Cada linha mostra nome, orientação e se a
 * TV está ligada agora. Linha inteira clicável, com pelo menos 48 px de altura.
 */
export const EscolherTelas: React.FC<EscolherTelasProps> = ({ displays, devices, modo, selecionadas, onChange }) => {
  const [busca, setBusca] = useState('');
  const agora = Date.now();

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return displays;
    return displays.filter(d => d.name.toLocaleLowerCase('pt-BR').includes(termo));
  }, [busca, displays]);

  const alternar = (id: string) => {
    if (modo === 'uma') {
      onChange([id]);
      return;
    }
    onChange(selecionadas.includes(id) ? selecionadas.filter(s => s !== id) : [...selecionadas, id]);
  };

  return (
    <div className="flex flex-col gap-3">
      {displays.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-3" size={18} aria-hidden />
          <input
            type="search"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar tela pelo nome"
            aria-label="Buscar tela pelo nome"
            className="w-full h-11 bg-papel-2 border border-borda rounded-xl pl-10 pr-3 text-base md:text-sm text-tinta placeholder:text-tinta-3 focus:border-marca outline-none"
          />
        </div>
      )}

      {modo === 'varias' && displays.length > 1 && (
        <div className="flex items-center justify-between text-sm text-tinta-3">
          <span>{selecionadas.length} de {displays.length} escolhidas</span>
          <button
            type="button"
            onClick={() => onChange(selecionadas.length === displays.length ? [] : displays.map(d => d.id))}
            className="min-h-11 px-3 font-bold text-marca hover:text-marca-hover cursor-pointer"
          >
            {selecionadas.length === displays.length ? 'Limpar' : 'Marcar todas'}
          </button>
        </div>
      )}

      <ul
        role={modo === 'uma' ? 'radiogroup' : 'group'}
        aria-label="Telas"
        className="flex flex-col gap-2 max-h-[38vh] overflow-y-auto pr-1"
      >
        {filtradas.map(display => {
          const marcada = selecionadas.includes(display.id);
          const online = telaEstaOnline(display.id, devices, agora);
          const vertical = display.orientation === 'vertical';
          return (
            <li key={display.id}>
              <button
                type="button"
                role={modo === 'uma' ? 'radio' : 'checkbox'}
                aria-checked={marcada}
                onClick={() => alternar(display.id)}
                className={`w-full min-h-12 flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                  marcada ? 'bg-marca-fundo border-marca text-tinta' : 'bg-papel-2 border-borda text-tinta-2 hover:border-borda-3'
                }`}
              >
                <span
                  aria-hidden
                  className={`shrink-0 w-6 h-6 flex items-center justify-center border-2 ${modo === 'uma' ? 'rounded-full' : 'rounded-md'} ${
                    marcada ? 'bg-marca border-marca text-white' : 'border-borda-3 bg-papel'
                  }`}
                >
                  {marcada && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-base md:text-sm font-bold">{display.name}</span>
                  <span className="flex items-center gap-1.5 text-sm md:text-xs text-tinta-3">
                    {vertical ? <Smartphone size={13} aria-hidden /> : <Monitor size={13} aria-hidden />}
                    {vertical ? 'Em pé (9:16)' : 'Deitada (16:9)'}
                  </span>
                </span>
                <span className={`shrink-0 flex items-center gap-1.5 text-sm md:text-xs font-bold ${online ? 'text-ok' : 'text-tinta-3'}`}>
                  <span aria-hidden className={`w-2 h-2 rounded-full ${online ? 'bg-ok' : 'bg-borda-3'}`} />
                  {online ? 'Ligada' : 'Desligada'}
                </span>
              </button>
            </li>
          );
        })}
        {filtradas.length === 0 && (
          <li className="py-6 text-center text-base md:text-sm text-tinta-3">Nenhuma tela com esse nome.</li>
        )}
      </ul>
    </div>
  );
};

export default EscolherTelas;
