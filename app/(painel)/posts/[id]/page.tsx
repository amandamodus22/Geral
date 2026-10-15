import { Copy, ExternalLink, Film, Hand, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcoesPost, BotaoTentarDeNovo } from "@/components/AcoesPost";
import { AtualizarSozinho } from "@/components/AtualizarSozinho";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { CopiarTexto } from "@/components/CopiarTexto";
import { SeloRede, SeloStatusDestino, SeloStatusPost } from "@/components/Selos";
import { duplicarPost, excluirPost, tentarDeNovo } from "@/lib/acoes";
import { exigirDona } from "@/lib/auth";
import { urlsAssinadas } from "@/lib/dados";
import { formatarDataHora } from "@/lib/datas";
import { NOMES_TIPO } from "@/lib/redes";
import { REDES, type PostComDestinos } from "@/lib/tipos";
import { ehVideo } from "@/lib/validacao";

export const metadata: Metadata = { title: "Detalhe do post" };

export default async function DetalhePost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await exigirDona();
  const { data } = await supabase.from("posts").select("*, post_destinos(*)").eq("id", id).maybeSingle();
  const post = data as PostComDestinos | null;
  if (!post) notFound();

  const urls = await urlsAssinadas(supabase, post.media_paths);
  const destinos = [...post.post_destinos].sort((a, b) => REDES.indexOf(a.rede) - REDES.indexOf(b.rede));
  const aguardando = post.status === "enviando" || destinos.some((d) => d.status === "enviando");

  return (
    <div className="space-y-4">
      {aguardando && <AtualizarSozinho segundos={15} />}

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-semibold">{post.titulo_interno || "Sem título"}</h1>
          <SeloStatusPost status={post.status} />
        </div>
        <p className="text-sm text-zinc-600">
          {NOMES_TIPO[post.tipo]} · {formatarDataHora(post.agendado_para)}
        </p>
      </div>

      <AcoesPost id={post.id} status={post.status} />

      {post.media_paths.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {post.media_paths.map((c, i) =>
            ehVideo(c) ? (
              urls[c] ? (
                <video key={c} src={urls[c]} controls preload="metadata" className="max-h-80 rounded-lg bg-black" />
              ) : (
                <Film key={c} />
              )
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={c} src={urls[c]} alt={`Mídia ${i + 1}`} className="h-40 rounded-lg object-cover" />
            ),
          )}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">Redes</h2>
        {destinos.length === 0 && <p className="text-sm text-zinc-500">Nenhuma rede escolhida.</p>}
        {destinos.map((d) => (
          <article key={d.id} className="cartao space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SeloRede rede={d.rede} />
              <SeloStatusDestino status={d.status} />
            </div>

            {d.status === "publicado" && (
              <p className="text-sm text-zinc-600">
                Publicado {d.publicado_em ? `em ${formatarDataHora(d.publicado_em)}` : ""}
                {d.url_publicada && (
                  <a
                    href={d.url_publicada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 font-medium text-marca-700 underline"
                  >
                    Ver publicação <ExternalLink className="size-3.5" />
                  </a>
                )}
              </p>
            )}

            {d.status === "erro" && (
              <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-900">{d.mensagem_erro || "Erro sem mensagem do Make."}</p>
                {d.rede !== "tiktok" && <BotaoTentarDeNovo acao={tentarDeNovo.bind(null, d.id)} />}
              </div>
            )}

            {d.status === "manual" && (
              <Link href="/manual" className="botao-secundario">
                <Hand className="size-4" /> Ir para “Postar manualmente”
              </Link>
            )}

            {d.status === "enviando" && (
              <p className="text-sm text-amber-800">Aguardando o resultado do Make… (a página atualiza sozinha)</p>
            )}

            {(d.youtube_titulo || d.reddit_titulo) && (
              <p className="text-sm">
                <b>Título:</b> {d.youtube_titulo ?? d.reddit_titulo}
                {d.reddit_subreddit && <span className="text-zinc-500"> · r/{d.reddit_subreddit}</span>}
                {d.rede === "youtube" && <span className="text-zinc-500"> · {d.youtube_formato === "shorts" ? "Shorts" : "Vídeo longo"}</span>}
              </p>
            )}

            <details className="text-sm">
              <summary className="cursor-pointer text-zinc-600">Texto enviado</summary>
              <pre className="mt-2 rounded-lg bg-zinc-50 p-3 font-sans whitespace-pre-wrap">{d.legenda_final || "(sem texto)"}</pre>
              {d.comentario && (
                <p className="mt-2">
                  <b>1º comentário:</b> {d.comentario}
                </p>
              )}
              {d.texto_alternativo && (
                <p className="mt-2">
                  <b>Texto alternativo:</b> {d.texto_alternativo}
                </p>
              )}
              <div className="mt-2">
                <CopiarTexto texto={d.legenda_final} rotulo="Copiar texto" />
              </div>
            </details>
          </article>
        ))}
      </section>

      <section className="flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
        <form action={duplicarPost.bind(null, post.id)}>
          <BotaoEnviar className="botao-secundario" pendente="Duplicando…">
            <Copy className="size-4" /> Duplicar post
          </BotaoEnviar>
        </form>
        {post.status !== "enviando" && (
          <form action={excluirPost.bind(null, post.id)}>
            <BotaoEnviar
              className="botao-perigo"
              pendente="Excluindo…"
              confirmar="Excluir este post e as mídias dele? Isso não apaga o que já foi publicado nas redes."
            >
              <Trash2 className="size-4" /> Excluir
            </BotaoEnviar>
          </form>
        )}
      </section>
    </div>
  );
}
