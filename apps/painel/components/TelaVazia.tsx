import React from 'react';

/**
 * Arte padrão de uma tela sem conteúdo definido. Substitui a foto de padaria
 * ("arte-cafe.jpg") que aparecia no cartão da tela e na cena vazia do editor.
 * É um esquema neutro de layout de TV, desenhado em SVG com as cores da marca,
 * para servir a qualquer comércio (padaria, loja, shopping, clínica).
 * Horizontal: 16:9. Vertical: 9:16. Preenche o quadro como `object-fit: cover`.
 */
export const TelaVazia: React.FC<{ vertical?: boolean; className?: string }> = ({ vertical = false, className }) => {
  const w = vertical ? 360 : 640;
  const h = vertical ? 640 : 360;
  const id = vertical ? 'tela-vazia-v' : 'tela-vazia-h';
  const blocks = vertical
    ? [
        // destaque grande, dois blocos menores, faixa de rodapé
        { x: 28, y: 110, w: 304, h: 250, r: 14, big: true },
        { x: 28, y: 384, w: 146, h: 120, r: 12 },
        { x: 186, y: 384, w: 146, h: 120, r: 12 },
        { x: 28, y: 528, w: 304, h: 56, r: 12, strip: true },
      ]
    : [
        { x: 36, y: 86, w: 372, h: 228, r: 14, big: true },
        { x: 428, y: 86, w: 176, h: 108, r: 12 },
        { x: 428, y: 206, w: 176, h: 108, r: 12 },
        { x: 36, y: 20, w: 568, h: 48, r: 12, strip: true },
      ];
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Tela ainda sem conteúdo definido."
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-fundo`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--noite-2, #0c1e36)" />
          <stop offset="1" stopColor="var(--noite, #071426)" />
        </linearGradient>
        <pattern id={`${id}-grade`} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="var(--luz, #38bdf8)" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-fundo)`} />
      <rect width={w} height={h} fill={`url(#${id}-grade)`} />
      {blocks.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r}
            fill="var(--luz, #38bdf8)" fillOpacity={b.big ? 0.1 : 0.06}
            stroke="var(--luz, #38bdf8)" strokeOpacity={b.big ? 0.55 : 0.35}
            strokeWidth="1.5" strokeDasharray={b.big ? undefined : '6 6'}
          />
          {b.big && (
            <>
              {/* ícone de imagem: moldura com sol e montanha */}
              <rect x={b.x + b.w / 2 - 26} y={b.y + b.h / 2 - 22} width="52" height="44" rx="8" fill="none" stroke="var(--luz, #38bdf8)" strokeOpacity="0.8" strokeWidth="2" />
              <circle cx={b.x + b.w / 2 - 10} cy={b.y + b.h / 2 - 8} r="5" fill="var(--luz, #38bdf8)" fillOpacity="0.8" />
              <path d={`M${b.x + b.w / 2 - 24} ${b.y + b.h / 2 + 18} l16 -16 l10 10 l8 -8 l14 14`} fill="none" stroke="var(--luz, #38bdf8)" strokeOpacity="0.8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}
          {!b.big && !b.strip && (
            <>
              {/* linhas de texto: título curto e preço */}
              <rect x={b.x + 16} y={b.y + 22} width={b.w * 0.55} height="10" rx="5" fill="var(--noite-texto, #c5d3e6)" fillOpacity="0.45" />
              <rect x={b.x + 16} y={b.y + 44} width={b.w * 0.35} height="8" rx="4" fill="var(--noite-texto, #c5d3e6)" fillOpacity="0.25" />
              <rect x={b.x + 16} y={b.y + b.h - 36} width={b.w * 0.42} height="18" rx="9" fill="var(--luz, #38bdf8)" fillOpacity="0.5" />
            </>
          )}
          {b.strip && (
            <>
              {/* faixa de rodapé: relógio e clima */}
              <circle cx={b.x + 30} cy={b.y + b.h / 2} r="11" fill="none" stroke="var(--noite-texto, #c5d3e6)" strokeOpacity="0.5" strokeWidth="2" />
              <path d={`M${b.x + 30} ${b.y + b.h / 2 - 6} v6 h5`} fill="none" stroke="var(--noite-texto, #c5d3e6)" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
              <rect x={b.x + 54} y={b.y + b.h / 2 - 5} width={b.w * 0.28} height="10" rx="5" fill="var(--noite-texto, #c5d3e6)" fillOpacity="0.35" />
              <rect x={b.x + b.w - 16 - b.w * 0.18} y={b.y + b.h / 2 - 5} width={b.w * 0.18} height="10" rx="5" fill="var(--noite-texto, #c5d3e6)" fillOpacity="0.35" />
            </>
          )}
        </g>
      ))}
    </svg>
  );
};
