import React, { useMemo } from 'react';
import type { WidgetData } from '../../types';
import { buildMotionHtml } from '../editor/presets/motionPresets';

/**
 * Motion design em HTML/CSS/JS isolado num iframe sem acesso ao painel
 * (sandbox só com scripts, sem mesma origem).
 */
export const MotionWidget: React.FC<{ data: WidgetData; mode?: 'editor' | 'player' }> = ({ data }) => {
  const html = useMemo(() => buildMotionHtml(data.motionConfig), [data.motionConfig]);
  return (
    <iframe
      title="Motion design"
      srcDoc={html}
      sandbox="allow-scripts"
      className="w-full h-full border-0 pointer-events-none block"
      style={{ background: 'transparent' }}
    />
  );
};
