import { cn } from "@/lib/utils";

const VARIANTES = {
  neutro: "bg-fundo-sutil text-texto-fraco border-borda",
  positivo:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
  atencao:
    "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  critico:
    "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900",
  marca: "bg-marca-suave text-marca border-marca/20",
} as const;

export type VarianteDoBadge = keyof typeof VARIANTES;

export function Badge({
  variante = "neutro",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variante?: VarianteDoBadge }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-tight font-medium whitespace-nowrap",
        VARIANTES[variante],
        className,
      )}
      {...props}
    />
  );
}
