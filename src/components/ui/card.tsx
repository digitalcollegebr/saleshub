import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Raio 20px e separação por tom, não por borda forte: é assim que os
        // cards de formação do site se destacam do preto.
        "border-borda bg-superficie rounded-cartao border shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
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
