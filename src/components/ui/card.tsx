import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-borda bg-superficie rounded-lg border shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardCabecalho({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start justify-between gap-3 p-4 pb-0", className)} {...props} />
  );
}

export function CardTitulo({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-texto text-sm font-semibold", className)} {...props} />;
}

export function CardDescricao({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-texto-fraco text-xs", className)} {...props} />;
}

export function CardConteudo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
