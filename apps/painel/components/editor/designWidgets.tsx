/**
 * Render único dos widgets de desenho novos (ícone, forma, motion), usado pelo
 * Canvas e pelo Player. Devolve null para os demais tipos.
 */
import React from 'react';
import { WidgetType, type LayoutItem } from '../../types';
import { IconWidget } from '../widgets/IconWidget';
import { ShapeWidget } from '../widgets/ShapeWidget';
import { MotionWidget } from '../widgets/MotionWidget';

export function renderDesignWidget(w: LayoutItem, mode: 'editor' | 'player'): React.ReactNode | null {
  switch (w.type) {
    case WidgetType.ICON: return <IconWidget data={w.data} />;
    case WidgetType.SHAPE: return <ShapeWidget data={w.data} />;
    case WidgetType.MOTION: return <MotionWidget data={w.data} mode={mode} />;
    default: return null;
  }
}
