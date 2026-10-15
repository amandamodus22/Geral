// Edge Function "enviar-para-make"
//
// Chamada a cada 5 minutos pelo pg_cron e, sob demanda, pelo painel.
// Busca os posts vencidos, marca como "enviando" (sem duplicar) e faz POST
// no webhook do Make com URLs assinadas das mídias (válidas por 24h).
//
// Modos (corpo JSON):
//   { "modo": "cron" }                        → posts agendados e vencidos
//   { "modo": "post", "post_id": "..." }      → "Publicar agora"
//   { "modo": "destinos", "destino_ids": [] } → "Tentar de novo"
//   { "modo": "teste" }                       → payload de exemplo
//
// Segredos (Edge Functions → Secrets): MAKE_WEBHOOK_URL, PAINEL_SECRET,
// CRON_SECRET, PAINEL_URL. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já
// existem por padrão.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MAKE_WEBHOOK_URL = Deno.env.get("MAKE_WEBHOOK_URL") ?? "";
const PAINEL_SECRET = Deno.env.get("PAINEL_SECRET") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const PAINEL_URL = (Deno.env.get("PAINEL_URL") ?? "").replace(/\/+$/, "");

const BUCKET = "midias";
const VALIDADE_URL_SEGUNDOS = 24 * 60 * 60;
const REDES_TESTE = ["instagram", "facebook", "linkedin", "youtube", "google_business", "reddit"];

interface Post {
  id: string;
  titulo_interno: string;
  tipo: "imagem" | "carrossel" | "video";
  media_paths: string[];
  agendado_para: string | null;
}

interface Destino {
  id: string;
  post_id: string;
  rede: string;
  legenda_final: string;
  texto_alternativo: string | null;
  comentario: string | null;
  youtube_formato: string;
  youtube_titulo: string | null;
  google_tipo_post: string | null;
  google_botao_tipo: string | null;
  google_botao_url: string | null;
  reddit_subreddit: string | null;
  reddit_titulo: string | null;
}

function responder(status: number, corpo: Record<string, unknown>) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** Comparação em tempo constante (evita descobrir o segredo por tempo de resposta). */
function iguais(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let dif = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) dif |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return dif === 0;
}

function callbackUrl() {
  return `${PAINEL_URL}/api/make-callback`;
}

function destinoParaPayload(d: Destino) {
  return {
    destino_id: d.id,
    rede: d.rede,
    legenda: d.legenda_final,
    youtube_titulo: d.rede === "youtube" ? d.youtube_titulo : null,
    youtube_formato: d.rede === "youtube" ? d.youtube_formato : null,
    reddit_subreddit: d.rede === "reddit" ? d.reddit_subreddit : null,
    reddit_titulo: d.rede === "reddit" ? d.reddit_titulo : null,
    texto_alternativo: d.rede === "instagram" ? d.texto_alternativo : null,
    comentario: d.rede === "linkedin" ? d.comentario : null,
    google_tipo_post: d.rede === "google_business" ? d.google_tipo_post : null,
    google_botao:
      d.rede === "google_business" && d.google_botao_url
        ? { tipo: d.google_botao_tipo, url: d.google_botao_url }
        : null,
  };
}

async function urlsAssinadas(supabase: SupabaseClient, caminhos: string[]): Promise<string[]> {
  if (caminhos.length === 0) return [];
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(caminhos, VALIDADE_URL_SEGUNDOS);
  if (error) throw new Error(`Não consegui gerar as URLs das mídias: ${error.message}`);
  const mapa = new Map((data ?? []).map((i) => [i.path, i.signedUrl]));
  return caminhos.map((c) => {
    const url = mapa.get(c);
    if (!url) throw new Error(`Mídia não encontrada no Storage: ${c}`);
    return url;
  });
}

async function postarNoMake(payload: unknown): Promise<{ ok: boolean; status: number; texto: string }> {
  try {
    const r = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-painel-secret": PAINEL_SECRET },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
    const texto = (await r.text()).slice(0, 500);
    return { ok: r.ok, status: r.status, texto };
  } catch (erro) {
    return { ok: false, status: 0, texto: erro instanceof Error ? erro.message : String(erro) };
  }
}

/** Envia um post (com os destinos indicados) ao Make. Em caso de falha, marca os destinos como erro. */
async function enviarPost(supabase: SupabaseClient, post: Post, destinos: Destino[]) {
  const paraMake = destinos.filter((d) => d.rede !== "tiktok");
  if (paraMake.length === 0) return { post_id: post.id, ok: true, mensagem: "Só TikTok (manual)." };

  let falha: string | null = null;
  try {
    const payload = {
      teste: false,
      post_id: post.id,
      titulo_interno: post.titulo_interno,
      tipo: post.tipo,
      agendado_para: post.agendado_para,
      midias: await urlsAssinadas(supabase, post.media_paths),
      destinos: paraMake.map(destinoParaPayload),
      callback_url: callbackUrl(),
    };
    const r = await postarNoMake(payload);
    if (!r.ok) falha = `O Make recusou o envio (HTTP ${r.status || "sem resposta"}): ${r.texto}`;
  } catch (erro) {
    falha = erro instanceof Error ? erro.message : String(erro);
  }

  if (falha) {
    await supabase
      .from("post_destinos")
      .update({ status: "erro", mensagem_erro: falha })
      .in("id", paraMake.map((d) => d.id))
      .eq("status", "enviando");
    return { post_id: post.id, ok: false, mensagem: falha };
  }
  return { post_id: post.id, ok: true, mensagem: `Enviado ao Make (${paraMake.length} rede(s)).` };
}

async function destinosEnviando(supabase: SupabaseClient, postId: string): Promise<Destino[]> {
  const { data, error } = await supabase
    .from("post_destinos")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "enviando");
  if (error) throw new Error(error.message);
  return (data ?? []) as Destino[];
}

async function modoVencidos(supabase: SupabaseClient, postId: string | null) {
  if (!postId) await supabase.rpc("expirar_envios_sem_resposta");
  const { data, error } = await supabase.rpc("reivindicar_posts_vencidos", { p_post_id: postId });
  if (error) throw new Error(`Erro ao buscar posts vencidos: ${error.message}`);
  const posts = (data ?? []) as Post[];
  const resultados = [];
  for (const post of posts) {
    resultados.push(await enviarPost(supabase, post, await destinosEnviando(supabase, post.id)));
  }
  return resultados;
}

async function modoDestinos(supabase: SupabaseClient, ids: string[]) {
  const { data, error } = await supabase
    .from("post_destinos")
    .select("*")
    .in("id", ids)
    .eq("status", "enviando")
    .neq("rede", "tiktok");
  if (error) throw new Error(error.message);
  const destinos = (data ?? []) as Destino[];

  const resultados = [];
  for (const postId of new Set(destinos.map((d) => d.post_id))) {
    const { data: post } = await supabase.from("posts").select("*").eq("id", postId).single();
    if (post) {
      resultados.push(await enviarPost(supabase, post as Post, destinos.filter((d) => d.post_id === postId)));
    }
  }
  return resultados;
}

async function modoTeste() {
  const agora = new Date().toISOString();
  const payload = {
    teste: true,
    post_id: `teste-${Date.now()}`,
    titulo_interno: "Post de teste do painel",
    tipo: "imagem",
    agendado_para: agora,
    midias: [`${PAINEL_URL}/post-teste.jpg`],
    destinos: REDES_TESTE.map((rede) => ({
      destino_id: `teste-${rede}`,
      rede,
      legenda: "Post de teste enviado pelo Painel de Posts. Pode ignorar.\n\n#teste",
      youtube_titulo: rede === "youtube" ? "Vídeo de teste do painel" : null,
      youtube_formato: rede === "youtube" ? "longo" : null,
      reddit_subreddit: rede === "reddit" ? "test" : null,
      reddit_titulo: rede === "reddit" ? "Post de teste do painel" : null,
      texto_alternativo: rede === "instagram" ? "Imagem roxa com o texto POST DE TESTE." : null,
      comentario: rede === "linkedin" ? "https://exemplo.com/artigo" : null,
      google_tipo_post: rede === "google_business" ? "Novidade" : null,
      google_botao: rede === "google_business" ? { tipo: "Saiba mais", url: "https://exemplo.com/artigo" } : null,
    })),
    callback_url: callbackUrl(),
  };
  const r = await postarNoMake(payload);
  return {
    ok: r.ok,
    mensagem: r.ok
      ? `O Make recebeu o post de teste (HTTP ${r.status}). Resposta: ${r.texto || "(vazia)"}`
      : `O Make não aceitou o teste (HTTP ${r.status || "sem resposta"}): ${r.texto}`,
    payload,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return responder(405, { ok: false, mensagem: "Use POST." });

  if (!CRON_SECRET || !iguais(req.headers.get("x-cron-secret") ?? "", CRON_SECRET)) {
    return responder(401, { ok: false, mensagem: "Não autorizado." });
  }

  const faltando = [
    ["MAKE_WEBHOOK_URL", MAKE_WEBHOOK_URL],
    ["PAINEL_SECRET", PAINEL_SECRET],
    ["PAINEL_URL", PAINEL_URL],
  ]
    .filter(([, v]) => !v)
    .map(([n]) => n);
  if (faltando.length > 0) {
    return responder(500, { ok: false, mensagem: `Segredos não configurados na Edge Function: ${faltando.join(", ")}.` });
  }

  const corpo = (await req.json().catch(() => ({}))) as {
    modo?: string;
    post_id?: string;
    destino_ids?: string[];
  };
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    switch (corpo.modo ?? "cron") {
      case "teste": {
        const r = await modoTeste();
        return responder(r.ok ? 200 : 502, r);
      }
      case "destinos": {
        const ids = (corpo.destino_ids ?? []).filter((x) => typeof x === "string").slice(0, 20);
        const resultados = await modoDestinos(supabase, ids);
        const ok = resultados.every((r) => r.ok);
        return responder(ok ? 200 : 502, {
          ok,
          mensagem: resultados[0]?.mensagem ?? "Nada a reenviar.",
          resultados,
        });
      }
      case "post": {
        if (!corpo.post_id) return responder(400, { ok: false, mensagem: "post_id é obrigatório." });
        const resultados = await modoVencidos(supabase, corpo.post_id);
        const ok = resultados.every((r) => r.ok);
        return responder(ok ? 200 : 502, {
          ok,
          mensagem: resultados[0]?.mensagem ?? "Este post já estava sendo enviado.",
          resultados,
        });
      }
      default: {
        const resultados = await modoVencidos(supabase, null);
        return responder(200, { ok: true, mensagem: `${resultados.length} post(s) processado(s).`, resultados });
      }
    }
  } catch (erro) {
    console.error(erro);
    return responder(500, { ok: false, mensagem: erro instanceof Error ? erro.message : String(erro) });
  }
});
