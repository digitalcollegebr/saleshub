import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";
import { MARCA } from "@/lib/brand";

/**
 * Montserrat é a tipografia da Digital College — o site carrega os pesos 300 a
 * 800. Aqui entram só os quatro que a interface usa; cada peso é um arquivo, e
 * pesar o painel com variantes que ninguém aplica é custo sem contrapartida.
 *
 * Via `next/font`: os arquivos são servidos do próprio domínio, sem requisição
 * ao Google, e o `font-display: swap` evita o texto invisível no primeiro paint.
 */
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fonte-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${MARCA.produto} · ${MARCA.organizacao}`,
  description: `${MARCA.descricao}. ${MARCA.assinatura}.`,
  // Reforça o robots.txt no próprio HTML — alguns rastreadores só leem a meta tag.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={montserrat.variable}>
      <body className="antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
