"use client";

/**
 * Configurações — hoje, só autenticação.
 *
 * A tela existe para resolver um problema concreto de partida: sem ela, ligar o
 * Google exige acesso ao Coolify e um redeploy. Entrando com o usuário local, o
 * administrador configura daqui e o resto da equipe passa a entrar pelo domínio.
 *
 * O segredo do Google nunca é devolvido pelo servidor. O campo aparece vazio com
 * a marca "já configurado"; quem não digitar nada não apaga o que existe.
 */

import { useEffect, useState } from "react";
import { GuardaDeArea } from "@/components/layout/guarda-de-area";
import { Card, CardCabecalho, CardConteudo, CardDescricao, CardTitulo } from "@/components/ui/card";
import { EsqueletoDeBloco } from "@/components/dados/estados";
import { Badge } from "@/components/ui/badge";

interface Configuracao {
  googleClientId: string;
  temSegredo: boolean;
  dominioPermitido: string;
  urlPublica: string;
  travadasPeloAmbiente: string[];
}

export default function PaginaDeConfiguracoes() {
  return (
    <GuardaDeArea area="configuracoes">
      <Conteudo />
    </GuardaDeArea>
  );
}

function Conteudo() {
  const [config, definirConfig] = useState<Configuracao | null>(null);
  const [segredo, definirSegredo] = useState("");
  const [estado, definirEstado] = useState<"parado" | "salvando" | "salvo" | "erro">("parado");

  useEffect(() => {
    void fetch("/api/configuracao")
      .then((r) => (r.ok ? r.json() : null))
      .then(definirConfig)
      .catch(() => definirConfig(null));
  }, []);

  if (!config) return <EsqueletoDeBloco linhas={6} />;

  const travada = (chave: string) => config.travadasPeloAmbiente.includes(chave);
  const retorno = `${config.urlPublica || window.location.origin}/api/auth/retorno`;

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    definirEstado("salvando");
    const dados = new FormData(e.currentTarget);
    const resposta = await fetch("/api/configuracao", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        googleClientId: dados.get("googleClientId"),
        googleClientSecret: dados.get("googleClientSecret"),
        dominioPermitido: dados.get("dominioPermitido"),
        urlPublica: dados.get("urlPublica"),
      }),
    });
    if (resposta.ok) {
      definirConfig(await resposta.json());
      definirSegredo("");
      definirEstado("salvo");
    } else {
      definirEstado("erro");
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <header>
        <h1 className="text-texto text-lg font-semibold">Configurações</h1>
        <p className="text-texto-fraco mt-0.5 text-xs">Autenticação com o Google Workspace.</p>
      </header>

      <Card>
        <CardCabecalho>
          <div>
            <CardTitulo>Entrada pelo Google</CardTitulo>
            <CardDescricao>
              Crie um ID de cliente OAuth do tipo <strong>Aplicativo da Web</strong> no Google Cloud
              Console e cole os dados aqui.
            </CardDescricao>
          </div>
        </CardCabecalho>
        <CardConteudo>
          <div className="border-borda bg-fundo-sutil rounded-controle mb-4 border p-3">
            <p className="text-texto-fraco text-[11px]">
              URI de redirecionamento autorizado — cole exatamente isto no Google:
            </p>
            <code className="text-texto mt-1 block font-mono text-xs break-all">{retorno}</code>
          </div>

          <form onSubmit={salvar} className="space-y-3">
            <Campo
              nome="googleClientId"
              rotulo="ID do cliente"
              padrao={config.googleClientId}
              travada={travada("google_client_id")}
              dica="Termina em .apps.googleusercontent.com"
            />

            <label className="block">
              <span className="text-texto-fraco flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
                Segredo do cliente
                {config.temSegredo && <Badge variante="positivo">já configurado</Badge>}
                {travada("google_client_secret") && <Badge variante="neutro">do ambiente</Badge>}
              </span>
              <input
                type="password"
                name="googleClientSecret"
                value={segredo}
                onChange={(e) => definirSegredo(e.target.value)}
                disabled={travada("google_client_secret")}
                autoComplete="new-password"
                placeholder={config.temSegredo ? "deixe em branco para manter" : ""}
                className="border-borda bg-superficie text-texto rounded-controle mt-1 h-10 w-full border px-3 text-sm disabled:opacity-50"
              />
              <span className="text-texto-fraco mt-1 block text-[11px]">
                Guardado cifrado. Não é exibido de volta, nem para você.
              </span>
            </label>

            <Campo
              nome="dominioPermitido"
              rotulo="Domínio permitido"
              padrao={config.dominioPermitido}
              travada={travada("dominio_permitido")}
              dica="Só contas deste domínio conseguem entrar."
            />
            <Campo
              nome="urlPublica"
              rotulo="URL pública do painel"
              padrao={config.urlPublica}
              travada={travada("url_publica")}
              dica="Usada para montar o endereço de retorno. Sem barra no fim."
            />

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={estado === "salvando"}
                className="bg-marca hover:bg-marca-clara h-10 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {estado === "salvando" ? "Salvando…" : "Salvar"}
              </button>
              {estado === "salvo" && (
                <span className="text-xs text-emerald-300">
                  Salvo. Vale na próxima entrada — não é preciso reimplantar.
                </span>
              )}
              {estado === "erro" && (
                <span className="text-xs text-red-300">Não foi possível salvar.</span>
              )}
            </div>
          </form>
        </CardConteudo>
      </Card>
    </div>
  );
}

function Campo({
  nome,
  rotulo,
  padrao,
  travada,
  dica,
}: {
  nome: string;
  rotulo: string;
  padrao: string;
  travada: boolean;
  dica: string;
}) {
  return (
    <label className="block">
      <span className="text-texto-fraco flex items-center gap-2 text-[11px] font-medium tracking-wide uppercase">
        {rotulo}
        {travada && <Badge variante="neutro">do ambiente</Badge>}
      </span>
      <input
        type="text"
        name={nome}
        defaultValue={padrao}
        disabled={travada}
        spellCheck={false}
        className="border-borda bg-superficie text-texto rounded-controle mt-1 h-10 w-full border px-3 font-mono text-xs disabled:opacity-50"
      />
      <span className="text-texto-fraco mt-1 block text-[11px]">
        {travada ? "Definido por variável de ambiente — edite lá." : dica}
      </span>
    </label>
  );
}
