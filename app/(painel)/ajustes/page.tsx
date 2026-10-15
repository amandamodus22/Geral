import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { BotaoTesteMake } from "@/components/BotaoTesteMake";
import { EditorConfig } from "@/components/EditorConfig";
import { sair } from "@/app/login/acoes";
import { exigirDona } from "@/lib/auth";
import { lerConfig } from "@/lib/conteudo";
import { formatarDataHora } from "@/lib/datas";
import type { RetornoMake } from "@/lib/tipos";

export const metadata: Metadata = { title: "Ajustes" };

export default async function Ajustes() {
  const { supabase, user } = await exigirDona();
  const [{ data: config }, { data: retornos }] = await Promise.all([
    supabase.from("config_conteudo").select("dados, atualizado_em").eq("id", true).maybeSingle(),
    supabase.from("retornos_make").select("*").order("recebido_em", { ascending: false }).limit(10),
  ]);
  const dados = lerConfig(config?.dados);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Ajustes</h1>

      <section className="cartao space-y-3">
        <h2 className="font-semibold">Testar a integração com o Make</h2>
        <p className="text-sm text-zinc-600">
          Envia um payload de exemplo (com <code>&quot;teste&quot;: true</code>) para o webhook do Make. Use para
          configurar o cenário e conferir se a conexão funciona. Nada é gravado nos seus posts.
        </p>
        <BotaoTesteMake />
      </section>

      <section className="cartao space-y-3">
        <h2 className="font-semibold">Últimos retornos do Make</h2>
        <p className="text-sm text-zinc-600">
          Tudo o que o Make devolveu para <code>/api/make-callback</code>, inclusive os retornos do post de teste.
        </p>
        {(retornos ?? []).length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhum retorno recebido ainda.</p>
        ) : (
          <ul className="space-y-2">
            {(retornos as RetornoMake[]).map((r) => (
              <li key={r.id} className="rounded-lg border border-zinc-200 p-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{r.resultado}</span>
                  <span className="text-zinc-500">{formatarDataHora(r.recebido_em)}</span>
                </div>
                <details>
                  <summary className="cursor-pointer text-zinc-500">corpo recebido</summary>
                  <pre className="mt-1 overflow-auto">{JSON.stringify(r.corpo, null, 2)}</pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cartao space-y-3">
        <h2 className="font-semibold">Rodapés e regras de conteúdo (JSON)</h2>
        <p className="text-sm text-zinc-600">
          Versão <b>{dados.versao || "—"}</b>
          {config?.atualizado_em && <> · salva em {formatarDataHora(config.atualizado_em)}</>}. Aqui ficam os rodapés de
          cada rede, os textos fixos, as variáveis do post e a checagem de termos. Variáveis entre chaves, como{" "}
          <code>{"{palavra_chave}"}</code>, são preenchidas em cada post. Linhas com variável vazia são omitidas.
        </p>
        <EditorConfig inicial={JSON.stringify(config?.dados ?? dados, null, 2)} />
      </section>

      <section className="cartao flex items-center justify-between gap-3">
        <span className="truncate text-sm text-zinc-600">{user.email}</span>
        <form action={sair}>
          <button className="botao-secundario">
            <LogOut className="size-4" /> Sair
          </button>
        </form>
      </section>
    </div>
  );
}
