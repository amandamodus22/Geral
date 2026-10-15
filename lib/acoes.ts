"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirDona } from "./auth";
import padrao from "./config-padrao.json";
import { calcularDestino, esquemaConfigConteudo } from "./conteudo";
import { buscarConfig } from "./dados";
import { isoDeSP, partesSP } from "./datas";
import { chamarEnvio, type RespostaEnvio } from "./envio";
import { BUCKET_MIDIAS } from "./env";
import { podeEditar } from "./status";
import type { Post, PostDestino } from "./tipos";
import { esquemaPost, limparSubreddit, validarPost, type DadosPost } from "./validacao";

export interface ResultadoAcao {
  ok: boolean;
  mensagem?: string;
  erros?: string[];
  id?: string;
}

function atualizarTelas() {
  revalidatePath("/", "layout");
}

function vazioParaNulo(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

/** Converte um post salvo de volta para o formato do formulário. */
function paraDados(post: Post, destinos: PostDestino[]): DadosPost {
  const { data, hora } = partesSP(post.agendado_para);
  return {
    id: post.id,
    titulo_interno: post.titulo_interno,
    legenda_base: post.legenda_base,
    tipo: post.tipo,
    media_paths: post.media_paths,
    variaveis: post.variaveis ?? {},
    data,
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
}

function listarErros(resultado: ReturnType<typeof validarPost>): string[] {
  const lista = [...resultado.erros];
  for (const [rede, analise] of Object.entries(resultado.porRede)) {
    for (const e of analise?.erros ?? []) lista.push(`${rede}: ${e}`);
  }
  return lista;
}

// ---------------------------------------------------------------------
// Salvar / agendar / publicar agora
// ---------------------------------------------------------------------

export type AcaoSalvar = "rascunho" | "agendar" | "publicar_agora";

export async function salvarPost(entrada: unknown, acao: AcaoSalvar): Promise<ResultadoAcao> {
  const { supabase } = await exigirDona();

  const analise = esquemaPost.safeParse(entrada);
  if (!analise.success) return { ok: false, erros: ["Dados do formulário inválidos. Recarregue a página."] };
  const dados = analise.data;

  if (dados.media_paths.some((c) => !c.startsWith(`${dados.id}/`))) {
    return { ok: false, erros: ["Mídia inválida para este post."] };
  }

  const { data: existente } = await supabase.from("posts").select("status").eq("id", dados.id).maybeSingle();
  if (existente && !podeEditar(existente.status)) {
    return { ok: false, erros: ["Este post já foi enviado e não pode mais ser editado. Use “Duplicar”."] };
  }

  const config = await buscarConfig(supabase);
  if (acao !== "rascunho") {
    const resultado = validarPost(config, dados, { exigirDataFutura: acao === "agendar" });
    if (!resultado.ok) return { ok: false, erros: listarErros(resultado) };
  }

  const variaveis = Object.fromEntries(
    Object.entries(dados.variaveis)
      .map(([k, v]) => [k, v.trim()] as const)
      .filter(([, v]) => v),
  );

  const agendadoPara =
    acao === "publicar_agora" ? new Date().toISOString() : isoDeSP(dados.data, dados.hora);

  const { error: erroPost } = await supabase.from("posts").upsert({
    id: dados.id,
    titulo_interno: dados.titulo_interno.trim() || "Sem título",
    legenda_base: dados.legenda_base,
    tipo: dados.tipo,
    media_paths: dados.media_paths,
    variaveis,
    agendado_para: agendadoPara,
    status: acao === "rascunho" ? "rascunho" : "agendado",
  });
  if (erroPost) return { ok: false, erros: [`Erro ao salvar: ${erroPost.message}`] };

  // Destinos: grava/atualiza os escolhidos e apaga os que saíram.
  const linhas = dados.destinos.map((d) => {
    const calc = calcularDestino(config, { legenda_base: dados.legenda_base, variaveis }, d);
    return {
      post_id: dados.id,
      rede: d.rede,
      legenda_personalizada: d.legenda_personalizada,
      rodape_personalizado: d.rodape_personalizado,
      legenda_final: calc.textoFinal,
      texto_alternativo: d.rede === "instagram" ? calc.textoAlternativo : null,
      comentario: d.rede === "linkedin" ? calc.comentario : null,
      linkedin_link_no_comentario: d.rede === "linkedin" && d.linkedin_link_no_comentario,
      youtube_formato: d.youtube_formato,
      youtube_titulo: d.rede === "youtube" ? vazioParaNulo(d.youtube_titulo) : null,
      google_tipo_post: d.rede === "google_business" ? calc.tipoPostGoogle : null,
      google_botao_tipo: d.rede === "google_business" ? (calc.botao?.tipo ?? null) : null,
      google_botao_url: d.rede === "google_business" ? (calc.botao?.url ?? null) : null,
      reddit_subreddit: d.rede === "reddit" ? vazioParaNulo(limparSubreddit(d.reddit_subreddit)) : null,
      reddit_titulo: d.rede === "reddit" ? vazioParaNulo(d.reddit_titulo) : null,
      status: "pendente" as const,
      url_publicada: null,
      mensagem_erro: null,
      enviado_em: null,
      publicado_em: null,
    };
  });

  const redes = dados.destinos.map((d) => d.rede);
  let remover = supabase.from("post_destinos").delete().eq("post_id", dados.id);
  if (redes.length > 0) remover = remover.not("rede", "in", `(${redes.join(",")})`);
  const { error: erroRemover } = await remover;
  if (erroRemover) return { ok: false, erros: [`Erro ao atualizar redes: ${erroRemover.message}`] };

  if (linhas.length > 0) {
    const { error } = await supabase.from("post_destinos").upsert(linhas, { onConflict: "post_id,rede" });
    if (error) return { ok: false, erros: [`Erro ao salvar redes: ${error.message}`] };
  }

  await limparMidiasOrfas(supabase, dados.id, dados.media_paths);
  atualizarTelas();

  if (acao === "publicar_agora") {
    const envio = await chamarEnvio({ modo: "post", post_id: dados.id });
    if (!envio.ok) {
      return {
        ok: true,
        id: dados.id,
        mensagem: `Post salvo e agendado, mas o envio imediato falhou: ${envio.mensagem} Ele será enviado na próxima rodada automática (até 5 minutos).`,
      };
    }
  }
  return { ok: true, id: dados.id };
}

async function limparMidiasOrfas(
  supabase: Awaited<ReturnType<typeof exigirDona>>["supabase"],
  postId: string,
  manter: string[],
) {
  const { data } = await supabase.storage.from(BUCKET_MIDIAS).list(postId, { limit: 100 });
  const orfas = (data ?? []).map((f) => `${postId}/${f.name}`).filter((c) => !manter.includes(c));
  if (orfas.length > 0) await supabase.storage.from(BUCKET_MIDIAS).remove(orfas);
}

// ---------------------------------------------------------------------
// Ações da tela de detalhe
// ---------------------------------------------------------------------

async function carregarPost(supabase: Awaited<ReturnType<typeof exigirDona>>["supabase"], id: string) {
  const { data } = await supabase.from("posts").select("*, post_destinos(*)").eq("id", id).maybeSingle();
  return data as (Post & { post_destinos: PostDestino[] }) | null;
}

export async function publicarAgora(id: string): Promise<ResultadoAcao> {
  const { supabase } = await exigirDona();
  const post = await carregarPost(supabase, id);
  if (!post) return { ok: false, mensagem: "Post não encontrado." };
  if (!podeEditar(post.status)) return { ok: false, mensagem: "Este post já foi enviado." };

  const config = await buscarConfig(supabase);
  const resultado = validarPost(config, paraDados(post, post.post_destinos), { exigirDataFutura: false });
  if (!resultado.ok) {
    return { ok: false, mensagem: "Corrija o post antes de publicar.", erros: listarErros(resultado) };
  }

  const { error } = await supabase
    .from("posts")
    .update({ agendado_para: new Date().toISOString(), status: "agendado" })
    .eq("id", id)
    .in("status", ["rascunho", "agendado"]);
  if (error) return { ok: false, mensagem: error.message };

  const envio = await chamarEnvio({ modo: "post", post_id: id });
  atualizarTelas();
  return envio.ok
    ? { ok: true, mensagem: "Enviado para publicação." }
    : { ok: false, mensagem: `${envio.mensagem} O post continua agendado e sai na próxima rodada automática.` };
}

export async function desagendar(id: string): Promise<ResultadoAcao> {
  const { supabase } = await exigirDona();
  const { error } = await supabase.from("posts").update({ status: "rascunho" }).eq("id", id).eq("status", "agendado");
  atualizarTelas();
  return error ? { ok: false, mensagem: error.message } : { ok: true, mensagem: "Voltou para rascunho." };
}

export async function duplicarPost(id: string): Promise<void> {
  const { supabase } = await exigirDona();
  const post = await carregarPost(supabase, id);
  if (!post) redirect("/posts");

  const novoId = crypto.randomUUID();
  const novasMidias: string[] = [];
  for (const caminho of post.media_paths) {
    const destino = `${novoId}/${caminho.split("/").pop()}`;
    const { error } = await supabase.storage.from(BUCKET_MIDIAS).copy(caminho, destino);
    if (!error) novasMidias.push(destino);
  }

  const { error } = await supabase.from("posts").insert({
    id: novoId,
    titulo_interno: `${post.titulo_interno} (cópia)`,
    legenda_base: post.legenda_base,
    tipo: post.tipo,
    media_paths: novasMidias,
    variaveis: post.variaveis,
    agendado_para: null,
    status: "rascunho",
  });
  if (error) throw new Error(`Não consegui duplicar: ${error.message}`);

  if (post.post_destinos.length > 0) {
    await supabase.from("post_destinos").insert(
      post.post_destinos.map((d) => ({
        post_id: novoId,
        rede: d.rede,
        legenda_personalizada: d.legenda_personalizada,
        rodape_personalizado: d.rodape_personalizado,
        legenda_final: d.legenda_final,
        texto_alternativo: d.texto_alternativo,
        comentario: d.comentario,
        linkedin_link_no_comentario: d.linkedin_link_no_comentario,
        youtube_formato: d.youtube_formato,
        youtube_titulo: d.youtube_titulo,
        google_tipo_post: d.google_tipo_post,
        google_botao_tipo: d.google_botao_tipo,
        google_botao_url: d.google_botao_url,
        reddit_subreddit: d.reddit_subreddit,
        reddit_titulo: d.reddit_titulo,
      })),
    );
  }

  atualizarTelas();
  redirect(`/posts/${novoId}/editar`);
}

export async function excluirPost(id: string): Promise<void> {
  const { supabase } = await exigirDona();
  const post = await carregarPost(supabase, id);
  if (post && post.status !== "enviando") {
    if (post.media_paths.length > 0) await supabase.storage.from(BUCKET_MIDIAS).remove(post.media_paths);
    await supabase.from("posts").delete().eq("id", id);
  }
  atualizarTelas();
  redirect("/posts");
}

export async function tentarDeNovo(destinoId: string): Promise<ResultadoAcao> {
  const { supabase } = await exigirDona();
  const { data, error } = await supabase
    .from("post_destinos")
    .update({ status: "enviando", mensagem_erro: null, enviado_em: new Date().toISOString() })
    .eq("id", destinoId)
    .eq("status", "erro")
    .neq("rede", "tiktok")
    .select("id");
  if (error) return { ok: false, mensagem: error.message };
  if (!data || data.length === 0) return { ok: false, mensagem: "Esta rede não está com erro." };

  const envio = await chamarEnvio({ modo: "destinos", destino_ids: [destinoId] });
  if (!envio.ok) {
    await supabase
      .from("post_destinos")
      .update({ status: "erro", mensagem_erro: envio.mensagem })
      .eq("id", destinoId);
  }
  atualizarTelas();
  return envio.ok ? { ok: true, mensagem: "Reenviado ao Make." } : { ok: false, mensagem: envio.mensagem };
}

// ---------------------------------------------------------------------
// TikTok manual
// ---------------------------------------------------------------------

export async function marcarTiktokPublicado(destinoId: string, form: FormData): Promise<void> {
  const { supabase } = await exigirDona();
  const url = String(form.get("url") ?? "").trim();
  await supabase
    .from("post_destinos")
    .update({
      status: "publicado",
      url_publicada: /^https?:\/\//i.test(url) ? url : null,
      publicado_em: new Date().toISOString(),
      mensagem_erro: null,
    })
    .eq("id", destinoId)
    .eq("rede", "tiktok")
    .in("status", ["manual", "pendente"]);
  atualizarTelas();
}

// ---------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------

export async function enviarPostTeste(): Promise<RespostaEnvio> {
  await exigirDona();
  return chamarEnvio({ modo: "teste" });
}

export async function salvarConfigConteudo(texto: string): Promise<ResultadoAcao> {
  const { supabase } = await exigirDona();
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch (erro) {
    return { ok: false, mensagem: `JSON inválido: ${erro instanceof Error ? erro.message : ""}` };
  }
  const analise = esquemaConfigConteudo.safeParse(json);
  if (!analise.success) {
    const problemas = analise.error.issues.slice(0, 5).map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`);
    return { ok: false, mensagem: "O JSON não está no formato esperado.", erros: problemas };
  }
  const { error } = await supabase.from("config_conteudo").update({ dados: json }).eq("id", true);
  if (error) return { ok: false, mensagem: error.message };
  atualizarTelas();
  return { ok: true, mensagem: "Configuração salva." };
}

export async function restaurarConfigPadrao(): Promise<ResultadoAcao> {
  return salvarConfigConteudo(JSON.stringify(padrao));
}
