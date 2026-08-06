"use client";

/**
 * Card de indicador.
 *
 * A classe da métrica (`medida` vs `inferida`) muda a apresentação: número
 * contado nas mensagens e número lido por IA não podem ter o mesmo peso visual.
 * O tooltip explica o que o indicador significa e — mais importante — o que ele
 * **não** afirma.
 */

import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatarPorFormato } from "@/lib/format";
import { ROTULO_CONFIANCA, type Indicador } from "@/types";

export function CartaoIndicador({ indicador, href }: { indicador: Indicador; href?: string }) {
  const inferida = indicador.classe === "inferida";

  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-texto-fraco text-xs leading-snug font-medium">
          {indicador.rotulo}
        </span>
        <Tooltip
          conteudo={
            <div className="space-y-1.5">
              <p className="font-semibold">
                {inferida ? "Indicador inferido pela análise" : "Indicador medido nas mensagens"}
              </p>
              <p className="text-texto-fraco">{indicador.explicacao}</p>
              {indicador.confiancaMedia && (
                <p className="text-texto-fraco">
                  Confiança predominante:{" "}
                  <strong>{ROTULO_CONFIANCA[indicador.confiancaMedia]}</strong>.
                </p>
              )}
            </div>
          }
        >
          <button
            type="button"
            className="text-texto-fraco hover:text-texto focus:ring-marca/40 rounded transition-colors focus:ring-2 focus:outline-none"
            aria-label={`O que significa ${indicador.rotulo}`}
          >
            <Info className="size-3.5" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      <p className="text-texto mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {formatarPorFormato(indicador.valor, indicador.formato)}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <Badge variante={inferida ? "atencao" : "positivo"}>
          {inferida ? "Inferido" : "Medido"}
        </Badge>
        {href && (
          <span className="text-marca inline-flex items-center gap-1 text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            Ver conversas
            <ArrowRight className="size-3" aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );

  if (!href) {
    return <Card className="group p-4">{conteudo}</Card>;
  }

  return (
    <Card className="group focus-within:ring-marca/40 transition-shadow focus-within:ring-2 hover:shadow-md">
      <Link
        href={href}
        className="block p-4 focus:outline-none"
        aria-label={`${indicador.rotulo}: ver conversas que compõem este número`}
      >
        {conteudo}
      </Link>
    </Card>
  );
}
