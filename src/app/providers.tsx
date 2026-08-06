"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProvedorDeTooltip } from "@/components/ui/tooltip";
import { useState } from "react";
import { ErroDaApi } from "@/services";

export function Providers({ children }: { children: React.ReactNode }) {
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            // Repetir só onde repetir resolve: 401/403 não melhoram com insistência.
            retry: (tentativa, erro) => {
              if (erro instanceof ErroDaApi && !erro.vaieAdiantarTentarDeNovo) return false;
              return tentativa < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={cliente}>
      <ProvedorDeTooltip delayDuration={150}>{children}</ProvedorDeTooltip>
    </QueryClientProvider>
  );
}
