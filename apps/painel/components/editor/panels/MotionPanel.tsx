import React from 'react';
import { Play } from 'lucide-react';
import { WidgetType, type WidgetData } from '../../../types';
import { MOTION_PRESETS, getMotionDefaults } from '../presets/motionPresets';
import { PanelHeader } from './panelKit';

interface MotionPanelProps {
  addWidget: (type: WidgetType, data?: Partial<WidgetData>) => void;
  onClose?: () => void;
}

const stretch = { fillContainer: true, contentAlignment: 'stretch' as const, transparentBackground: true };

/** Lista de animações prontas. A amostra é estática; a animação roda só na cena. */
export const MotionPanel: React.FC<MotionPanelProps> = ({ addWidget, onClose }) => (
  <div className="hub-panel">
    <PanelHeader title="Motion" subtitle="Animações com textos e cores editáveis. Toque para adicionar." onClose={onClose} />
    <div className="hub-panel__body">
      <div className="grid grid-cols-1 gap-2.5">
        {MOTION_PRESETS.map(p => {
          const defaults = getMotionDefaults(p.id);
          const colors = defaults.colors;
          const bg = colors.fundo || colors.faixa || colors.selo || Object.values(colors)[0] || '#334155';
          const accent = colors.destaque || colors.numero || colors.marca || colors.borda || colors.detalhe || Object.values(colors)[1] || '#fde047';
          const fg = colors.texto || '#ffffff';
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => addWidget(WidgetType.MOTION, { ...stretch, motionConfig: { presetId: p.id, ...defaults, speed: 1 } })}
              aria-label={`Adicionar animação ${p.title}`}
              className="flex items-stretch gap-3 text-left bg-papel-3 border border-borda rounded-lg p-2 min-h-[64px] hover:border-marca hover:bg-marca-fundo transition-colors"
            >
              <span className="relative flex-none w-20 rounded-md overflow-hidden flex items-center justify-center" style={{ background: bg, color: fg }} aria-hidden="true">
                <Play size={20} fill={accent} color={accent} />
                <span className="absolute left-0 right-0 bottom-0 h-1.5" style={{ background: accent }} />
              </span>
              <span className="min-w-0 flex-1 py-0.5">
                <span className="block text-sm md:text-xs font-black text-tinta leading-tight">{p.title}</span>
                <span className="block text-xs md:text-[10px] text-tinta-3 leading-snug mt-0.5">{p.description || 'Animação com textos e cores editáveis'}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
