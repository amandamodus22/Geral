import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormularioPost } from "@/components/post-form/FormularioPost";
import { exigirDona } from "@/lib/auth";
import { buscarConfig, urlsAssinadas } from "@/lib/dados";
import { partesSP } from "@/lib/datas";
import { REDES, type PostComDestinos } from "@/lib/tipos";
import { podeEditar } from "@/lib/status";
import type { DadosPost } from "@/lib/validacao";

export const metadata: Metadata = { title: "Editar post" };

export default async function EditarPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await exigirDona();
  const { data } = await supabase.from("posts").select("*, post_destinos(*)").eq("id", id).maybeSingle();
  const post = data as PostComDestinos | null;
  if (!post) notFound();
  if (!podeEditar(post.status)) redirect(`/posts/${id}`);

  const [config, urls] = await Promise.all([buscarConfig(supabase), urlsAssinadas(supabase, post.media_paths)]);
  const { data: dia, hora } = partesSP(post.agendado_para);
  const destinos = [...post.post_destinos].sort((a, b) => REDES.indexOf(a.rede) - REDES.indexOf(b.rede));

  const inicial: DadosPost = {
    id: post.id,
    titulo_interno: post.titulo_interno,
    legenda_base: post.legenda_base,
    tipo: post.tipo,
    media_paths: post.media_paths,
    variaveis: post.variaveis ?? {},
    data: dia,
    hora,
    destinos: destinos.map((d) => ({
      rede: d.rede,
      legenda_personalizada: d.legenda_personalizada,
      rodape_personalizado: d.rodape_personalizado,
      youtube_formato: d.youtube_formato,
      linkedin_link_no_comentario: d.linkedin_link_no_comentario,
      youtube_titulo: d.youtube_titulo ?? "",
      reddit_subreddit: d.reddit_subreddit ?? "",
      reddit_titulo: d.reddit_titulo ?? "",
    })),
  };

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Editar post</h1>
      <FormularioPost inicial={inicial} config={config} urlsIniciais={urls} />
    </>
  );
}
