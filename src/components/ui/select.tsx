"use client";

import { cn } from "@/lib/utils";

/**
 * Select nativo, de propósito.
 *
 * O filtro do painel é operado por gestor, com teclado, muitas vezes no notebook
 * em reunião. O `<select>` do sistema traz busca por digitação, rolagem por
 * teclado e comportamento familiar de graça — um combobox customizado precisaria
 * reimplementar tudo isso para ficar no mesmo lugar.
 */
export function Select({
  rotulo,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { rotulo: string }) {
  return (
    <label className="flex min-w-[9rem] flex-col gap-1">
      <span className="text-texto-fraco text-[11px] font-medium tracking-wide uppercase">
        {rotulo}
      </span>
      <select
        className={cn(
          "border-borda bg-superficie text-texto h-9 rounded-md border px-2.5 text-sm",
          "focus:border-marca focus:ring-marca/30 focus:ring-2 focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
