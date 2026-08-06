"use client";

import * as TooltipPrimitivo from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const ProvedorDeTooltip = TooltipPrimitivo.Provider;

/**
 * Tooltip acessível: abre no hover E no foco por teclado, e o conteúdo é lido
 * por leitor de tela. Explicação de indicador não pode depender de mouse.
 */
export function Tooltip({
  conteudo,
  children,
  larguraMaxima = "max-w-xs",
}: {
  conteudo: React.ReactNode;
  children: React.ReactNode;
  larguraMaxima?: string;
}) {
  return (
    <TooltipPrimitivo.Root delayDuration={150}>
      <TooltipPrimitivo.Trigger asChild>{children}</TooltipPrimitivo.Trigger>
      <TooltipPrimitivo.Portal>
        <TooltipPrimitivo.Content
          side="top"
          align="center"
          sideOffset={6}
          className={cn(
            "border-borda bg-superficie text-texto z-50 rounded-md border px-3 py-2 text-xs leading-relaxed shadow-lg",
            larguraMaxima,
          )}
        >
          {conteudo}
          <TooltipPrimitivo.Arrow className="fill-superficie" />
        </TooltipPrimitivo.Content>
      </TooltipPrimitivo.Portal>
    </TooltipPrimitivo.Root>
  );
}
