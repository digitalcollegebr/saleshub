"use client";

/**
 * Quem pode entrar, e no quê.
 *
 * A lista se preenche sozinha: toda pessoa que autentica pelo Google aparece
 * aqui na primeira tentativa, com nenhuma caixa marcada. Não há "convidar" nem
 * cadastro manual — quem nunca tentou entrar não tem por que estar na lista, e
 * digitar e-mail à mão é como se concede acesso a quem não deveria.
 *
 * A gravação é imediata ao clicar na caixa, sem botão de salvar. É uma decisão
 * de uma marcação só, e um "Salvar" esquecido é acesso que a pessoa acha que deu
 * e não deu.
 */

import { GuardaDeArea } from "@/components/layout/guarda-de-area";
import { Card, CardConteudo } from "@/components/ui/card";
import { EsqueletoDeBloco, EstadoDeErro, EstadoVazio } from "@/components/dados/estados";
import { useDefinirPermissoes, useUsuariosDoPainel } from "@/hooks/use-dados";
import { formatarDataHora } from "@/lib/format";
import {
  EXPLICACAO_PERMISSAO,
  PERMISSOES,
  ROTULO_PERMISSAO,
  type Permissao,
  type UsuarioDoPainel,
} from "@/types";

export default function PaginaDeUsuarios() {
  return (
    <GuardaDeArea area="usuarios">
      <Conteudo />
    </GuardaDeArea>
  );
}

function Conteudo() {
  const consulta = useUsuariosDoPainel();
  const definir = useDefinirPermissoes();

  if (consulta.isError) {
    return <EstadoDeErro erro={consulta.error} aoTentarNovamente={() => consulta.refetch()} />;
  }
  if (consulta.isPending) return <EsqueletoDeBloco linhas={6} />;

  const itens = consulta.data.itens;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-texto text-lg font-semibold">Usuários</h1>
        <p className="text-texto-fraco mt-0.5 max-w-3xl text-xs leading-relaxed">
          Quem entra com uma conta @{"digitalcollege.com.br"} aparece aqui automaticamente, sem
          nenhuma permissão. Marque o que cada pessoa pode ver — vale na próxima tela que ela abrir,
          sem precisar sair e entrar.
        </p>
      </header>

      <Card>
        <CardConteudo className="p-0">
          {itens.length === 0 ? (
            <div className="p-4">
              <EstadoVazio
                titulo="Ninguém entrou ainda"
                descricao="A lista se preenche quando alguém autentica pela primeira vez."
              />
            </div>
          ) : (
            <ul className="divide-borda divide-y">
              {itens.map((u) => (
                <Linha
                  key={u.email}
                  usuario={u}
                  salvando={definir.isPending && definir.variables?.email === u.email}
                  aoAlternar={(permissao, marcada) =>
                    definir.mutate({
                      email: u.email,
                      permissoes: marcada
                        ? [...u.permissoes, permissao]
                        : u.permissoes.filter((p) => p !== permissao),
                    })
                  }
                />
              ))}
            </ul>
          )}
        </CardConteudo>
      </Card>
    </div>
  );
}

function Linha({
  usuario,
  salvando,
  aoAlternar,
}: {
  usuario: UsuarioDoPainel;
  salvando: boolean;
  aoAlternar: (permissao: Permissao, marcada: boolean) => void;
}) {
  const semNada = usuario.permissoes.length === 0;

  return (
    <li className={`p-4 transition-opacity ${salvando ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="text-texto truncate text-sm font-medium">{usuario.nome ?? usuario.email}</p>
          <p className="text-texto-fraco truncate text-xs">{usuario.email}</p>
        </div>
        <p className="text-texto-fraco text-[11px] whitespace-nowrap">
          {usuario.ultimoAcessoEm
            ? `último acesso ${formatarDataHora(usuario.ultimoAcessoEm)}`
            : "nunca entrou"}
        </p>
      </div>

      {semNada && (
        <p className="mt-2 text-[11px] text-amber-200">
          Sem nenhuma permissão — esta pessoa vê apenas o aviso para procurar o administrador.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {PERMISSOES.map((p) => {
          const marcada = usuario.permissoes.includes(p);
          return (
            <label
              key={p}
              title={EXPLICACAO_PERMISSAO[p]}
              className="text-texto flex cursor-pointer items-center gap-2 text-xs"
            >
              <input
                type="checkbox"
                checked={marcada}
                disabled={salvando}
                onChange={(e) => aoAlternar(p, e.target.checked)}
                className="accent-marca size-4"
              />
              {ROTULO_PERMISSAO[p]}
            </label>
          );
        })}
      </div>
    </li>
  );
}
