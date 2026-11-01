import React from 'react';
import { WidgetType } from '../../types';
import type { ItemDeModelo } from './modelosDeAviso';

/**
 * Miniatura estática de um modelo de aviso, desenhada a partir do próprio layout.
 * Não usa os widgets reais (motion em iframe, fontes do editor): é só uma prévia leve
 * para a grade do assistente. O texto usa `cqw` relativo à miniatura, igual à cena da TV.
 */
export interface MiniaturaModeloProps {
  itens: ItemDeModelo[];
  orientation: 'horizontal' | 'vertical';
  className?: string;
}

const RAIO: Record<string, string> = { rounded: '6%', pill: '9999px', circle: '50%' };

export const MiniaturaModelo: React.FC<MiniaturaModeloProps> = ({ itens, orientation, className }) => {
  const vertical = orientation === 'vertical';
  const cols = vertical ? 27 : 48;
  const rows = vertical ? 48 : 27;
  const textoMotion = vertical ? '5cqw' : '2.6cqw';

  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-lg bg-papel-3 ${className ?? ''}`}
      style={{ aspectRatio: vertical ? '9 / 16' : '16 / 9', containerType: 'inline-size' }}
    >
      {itens.map((item, index) => {
        const caixa: React.CSSProperties = {
          position: 'absolute',
          left: `${(item.x / cols) * 100}%`,
          top: `${(item.y / rows) * 100}%`,
          width: `${(item.w / cols) * 100}%`,
          height: `${(item.h / rows) * 100}%`,
          opacity: item.data.opacity,
        };
        const d = item.data;

        if (item.type === WidgetType.SHAPE) {
          const kind = d.shapeConfig?.kind ?? 'rect';
          return <div key={index} style={{ ...caixa, background: d.shapeConfig?.fill, borderRadius: RAIO[kind] ?? 0 }} />;
        }

        if (item.type === WidgetType.TEXT) {
          const align = d.textConfig?.textAlign ?? 'center';
          return (
            <div
              key={index}
              style={{
                ...caixa,
                display: 'flex',
                alignItems: 'center',
                justifyContent: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
                textAlign: align,
                color: d.color,
                fontSize: d.textConfig?.fontSize,
                fontWeight: d.textConfig?.fontWeight as React.CSSProperties['fontWeight'],
                lineHeight: d.textConfig?.lineHeight ?? 1.15,
                letterSpacing: d.textConfig?.letterSpacing ? `${d.textConfig.letterSpacing}em` : undefined,
                overflow: 'hidden',
              }}
            >
              <span>{d.content}</span>
            </div>
          );
        }

        if (item.type === WidgetType.ICON) {
          return (
            <div key={index} style={{ ...caixa, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ height: '70%', aspectRatio: '1', borderRadius: '50%', border: `2px solid ${d.iconConfig?.color ?? '#fff'}` }} />
            </div>
          );
        }

        if (item.type === WidgetType.IMAGE) {
          return (
            <div
              key={index}
              style={{ ...caixa, border: '1px dashed #94a3b8', background: 'rgba(148,163,184,0.25)', borderRadius: 4 }}
            />
          );
        }

        if (item.type === WidgetType.MOTION) {
          const m = d.motionConfig;
          const cores = m?.colors ?? {};
          const campos = m?.fields ?? {};
          const selo = m?.presetId === 'selo-girando';
          const botao = m?.presetId === 'chamada-brilho';
          const fundo = selo ? cores.selo : botao ? cores.botao : cores.fundo;
          const destaque = cores.destaque ?? cores.numero ?? cores.hora ?? cores.texto ?? '#ffffff';
          const principal = campos.titulo ?? campos.texto ?? campos.rotulo ?? '';
          const segundo = campos.preco ?? campos.hora ?? campos.sub ?? '';
          return (
            <div
              key={index}
              style={{
                ...caixa,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2em',
                background: fundo ?? '#334155',
                borderRadius: selo ? '50%' : botao ? '9999px' : '4%',
                color: '#ffffff',
                fontSize: textoMotion,
                fontWeight: 800,
                textAlign: 'center',
                lineHeight: 1.1,
                overflow: 'hidden',
                padding: '0 4%',
              }}
            >
              <span>{principal}</span>
              {segundo && <span style={{ color: destaque, fontSize: '1.3em' }}>{segundo}</span>}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default MiniaturaModelo;
