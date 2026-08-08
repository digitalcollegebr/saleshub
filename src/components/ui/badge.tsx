import { cn } from "@/lib/utils";

// Um tom só por variante: com tema escuro fixo (ver globals.css), a variante
// `dark:` do Tailwind seguiria o sistema operacional e devolveria os tons claros
// a quem usa o computador em modo claro — texto vermelho-escuro sobre preto.
const VARIANTES = {
  neutro: "bg-fundo-sutil text-texto-fraco border-borda",
  positivo: "bg-emerald-950 text-emerald-200 border-emerald-900",
  atencao: "bg-amber-950 text-amber-200 border-amber-900",
  critico: "bg-red-950 text-red-200 border-red-900",
  marca: "bg-marca-suave text-marca border-marca/30",
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
