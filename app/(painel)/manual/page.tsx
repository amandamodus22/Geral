import { CheckCircle2, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { CopiarTexto } from "@/components/CopiarTexto";
import { marcarTiktokPublicado } from "@/lib/acoes";
import { exigirDona } from "@/lib/auth";
import { formatarDataHora } from "@/lib/datas";
import { BUCKET_MIDIAS } from "@/lib/env";
import type { Post, PostDestino } from "@/lib/tipos";

export const metadata: Metadata = { title: "Postar manualmente" };

type Item = PostDestino & {
  posts: Pick<Post, "id" | "titulo_interno" | "agendado_para" | "status" | "media_paths">;
};

function nomeArquivo(titulo: string, caminho: string) {
  const base =
    titulo
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "video";
  return `${base}.${caminho.split(".").pop() ?? "mp4"}`;
}

export default async function PostarManualmente() {
  const { supabase } = await exigirDona();
  const { data } = await supabase
    .from("post_destinos")
    .select("*, posts!inner(id, titulo_interno, agendado_para, status, media_paths)")
    .eq("rede", "tiktok")
    .in("status", ["manual", "pendente"])
    .in("posts.status", ["agendado", "enviando", "concluido_com_erros"]);

  const agora = Date.now();
  const itens = ((data ?? []) as Item[]).sort((a, b) =>
    (a.posts.agendado_para ?? "").localeCompare(b.posts.agendado_para ?? ""),
  );
  const vencido = (i: Item) =>
    i.status === "manual" || (!!i.posts.agendado_para && new Date(i.posts.agendado_para).getTime() <= agora);
  const agoraLista = itens.filter(vencido);
  const proximos = itens.filter((i) => !vencido(i));

  // Links de download (válidos por 1 hora, já com nome de arquivo).
  const downloads: Record<string, string> = {};
  await Promise.all(
    agoraLista.map(async (i) => {
      const caminho = i.posts.media_paths[0];
      if (!caminho) return;
      const { data: assinada } = await supabase.storage
        .from(BUCKET_MIDIAS)
        .createSignedUrl(caminho, 3600, { download: nomeArquivo(i.posts.titulo_interno, caminho) });
      if (assinada?.signedUrl) downloads[i.id] = assinada.signedUrl;
    }),
  );

  return (
    <div className="space-y-6">
      <AtualizarSozinho segundos={60} />
      <div>
        <h1 className="text-xl font-semibold">Postar manualmente</h1>
        <p className="text-sm text-zinc-600">
          O TikTok não passa pelo Make. Baixe o vídeo, copie a legenda, publique no app e marque como publicado.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Para postar agora</h2>
        {agoraLista.length === 0 && <p className="text-sm text-zinc-400">Nada pendente. 🎉</p>}
        {agoraLista.map((i) => (
          <article key={i.id} className="cartao space-y-3 border-violet-300">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/posts/${i.posts.id}`} className="font-medium underline-offset-2 hover:underline">
                {i.posts.titulo_interno || "Sem título"}
              </Link>
              <span className="text-xs whitespace-nowrap text-zinc-500">{formatarDataHora(i.posts.agendado_para)}</span>
            </div>

            <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-50 p-3 font-sans text-sm whitespace-pre-wrap">
              {i.legenda_final}
            </pre>

            <div className="grid grid-cols-2 gap-2">
              {downloads[i.id] ? (
                <a href={downloads[i.id]} className="botao-primario" download>
                  <Download className="size-4" /> Baixar vídeo
                </a>
              ) : (
                <span className="botao-secundario opacity-50">Sem vídeo</span>
              )}
              <CopiarTexto texto={i.legenda_final} />
            </div>

            <form action={marcarTiktokPublicado.bind(null, i.id)} className="space-y-2 border-t border-zinc-100 pt-3">
              <label className="block">
                <span className="rotulo">Link do vídeo no TikTok (opcional)</span>
                <input name="url" type="url" inputMode="url" className="campo" placeholder="https://www.tiktok.com/@…" />
              </label>
              <BotaoEnviar className="botao-secundario w-full" pendente="Salvando…">
                <CheckCircle2 className="size-4 text-green-600" /> Marcar como publicado
              </BotaoEnviar>
            </form>
          </article>
        ))}
      </section>

      {proximos.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Próximos TikToks</h2>
          {proximos.map((i) => (
            <Link
              key={i.id}
              href={`/posts/${i.posts.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm"
            >
              <span className="truncate">{i.posts.titulo_interno || "Sem título"}</span>
              <span className="whitespace-nowrap text-zinc-500">{formatarDataHora(i.posts.agendado_para)}</span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
