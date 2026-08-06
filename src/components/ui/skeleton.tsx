import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-fundo-sutil animate-pulse rounded motion-reduce:animate-none", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
