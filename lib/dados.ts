import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerConfig, type ConfigConteudo } from "./conteudo";
import { BUCKET_MIDIAS } from "./env";

export async function buscarConfig(supabase: SupabaseClient): Promise<ConfigConteudo> {
  const { data } = await supabase.from("config_conteudo").select("dados").eq("id", true).maybeSingle();
  return lerConfig(data?.dados);
}

/** URLs assinadas (temporárias) para exibir mídias privadas. */
export async function urlsAssinadas(
  supabase: SupabaseClient,
  caminhos: string[],
  segundos = 3600,
): Promise<Record<string, string>> {
  if (caminhos.length === 0) return {};
  const { data } = await supabase.storage.from(BUCKET_MIDIAS).createSignedUrls(caminhos, segundos);
  const mapa: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa[item.path] = item.signedUrl;
  }
  return mapa;
}
