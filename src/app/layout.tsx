import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";
import { MARCA } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${MARCA.produto} · ${MARCA.organizacao}`,
  description: `${MARCA.descricao}. ${MARCA.assinatura}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
