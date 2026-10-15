import "server-only";
import { exigirEnv, SUPABASE_URL } from "./env";

export type PedidoEnvio =
  | { modo: "post"; post_id: string }
  | { modo: "destinos"; destino_ids: string[] }
  | { modo: "teste" };

export interface RespostaEnvio {
  ok: boolean;
  mensagem: string;
  detalhes?: unknown;
}

/** Chama a Edge Function que envia para o Make (a URL do Make fica só lá). */
export async function chamarEnvio(pedido: PedidoEnvio): Promise<RespostaEnvio> {
  try {
    const resposta = await fetch(`${SUPABASE_URL}/functions/v1/enviar-para-make`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": exigirEnv("CRON_SECRET"),
      },
      body: JSON.stringify(pedido),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    const corpo = (await resposta.json().catch(() => null)) as { mensagem?: string } | null;
    if (!resposta.ok) {
      return {
        ok: false,
        mensagem: corpo?.mensagem ?? `A função de envio respondeu com erro (HTTP ${resposta.status}).`,
        detalhes: corpo,
      };
    }
    return { ok: true, mensagem: corpo?.mensagem ?? "Enviado.", detalhes: corpo };
  } catch (erro) {
    return {
      ok: false,
      mensagem: `Não consegui falar com a função de envio: ${erro instanceof Error ? erro.message : String(erro)}`,
    };
  }
}
