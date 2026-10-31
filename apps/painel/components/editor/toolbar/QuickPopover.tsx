/**
 * Popover da barra contextual (Radix via pacote `radix-ui`, o mesmo do shadcn
 * em components/ui). O conteúdo vai para um portal, então o estilo fica em
 * QuickToolbar.css com a classe `hub-pop`.
 */
import React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import '../QuickToolbar.css';

export interface QuickPopoverProps {
  /** Botão que abre o popover. Precisa aceitar ref (um <button> comum serve). */
  trigger: React.ReactElement;
  /** Nome acessível do painel aberto. */
  label: string;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function QuickPopover({ trigger, label, children, className, align = 'start' }: QuickPopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={`hub-pop ${className || ''}`}
          role="dialog"
          aria-label={label}
          align={align}
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          // Teclas e cliques dentro do painel não chegam ao canvas/editor.
          onKeyDown={event => event.stopPropagation()}
          onPointerDown={event => event.stopPropagation()}
        >
          <p className="hub-pop__title">{label}</p>
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
