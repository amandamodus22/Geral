import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clienteAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Recebe do Make o resultado de cada rede:
 *   { "destino_id": "...", "status": "publicado" | "erro", "url_publicada": "...", "mensagem_erro": "..." }
 * Aceita também uma lista com vários resultados.
 * Exige o cabeçalho x-painel-secret igual a PAINEL_SECRET.
 */

const textoOpcional = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" && v.trim() ? v.trim() : null));

const esquemaResultado = z.object({
  destino_id: z.string().min(1).max(100),
  status: z.string().transform((s) => s.trim().toLowerCase()).pipe(z.enum(["publicado", "erro"])),
  url_publicada: textoOpcional,
  mensagem_erro: textoOpcional,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function segredoValido(recebido: string | null): boolean {
  const esperado = process.env.PAINEL_SECRET;
  if (!esperado || !recebido) return false;
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!segredoValido(request.headers.get("x-painel-secret"))) {
    return NextResponse.json({ ok: false, mensagem: "Não autorizado." }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, mensagem: "JSON inválido." }, { status: 400 });
  }

  const itens = (Array.isArray(corpo) ? corpo : [corpo]).slice(0, 20);
  const admin = clienteAdmin();
  const resultados: { destino_id: string | null; resultado: string }[] = [];

  for (const item of itens) {
    const analise = esquemaResultado.safeParse(item);
    let destinoId: string | null =
      item && typeof item === "object" && "destino_id" in item ? String((item as { destino_id: unknown }).destino_id) : null;
    let resultado: string;

    if (!analise.success) {
      resultado = "recusado: formato inválido (status deve ser 'publicado' ou 'erro')";
    } else {
      const r = analise.data;
      destinoId = r.destino_id;
      resultado = await aplicar(admin, r);
    }

    resultados.push({ destino_id: destinoId, resultado });
    await admin.from("retornos_make").insert({ destino_id: destinoId, corpo: item ?? null, resultado });
  }

  // Mantém só os últimos 30 dias de registros.
  await admin
    .from("retornos_make")
    .delete()
    .lt("recebido_em", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const algumRecusado = resultados.some((r) => r.resultado.startsWith("recusado"));
  return NextResponse.json({ ok: !algumRecusado, resultados }, { status: algumRecusado ? 400 : 200 });
}

async function aplicar(admin: ReturnType<typeof clienteAdmin>, r: z.infer<typeof esquemaResultado>): Promise<string> {
  if (!UUID.test(r.destino_id)) {
    return r.destino_id.startsWith("teste-") ? `teste recebido: ${r.status}` : "ignorado: destino_id desconhecido";
  }

  const { data: destino } = await admin
    .from("post_destinos")
    .select("id, rede, status")
    .eq("id", r.destino_id)
    .maybeSingle();
  if (!destino) return "ignorado: destino não encontrado";
  if (destino.rede === "tiktok") return "ignorado: TikTok é manual";
  if (destino.status === "publicado" && r.status === "erro") return "ignorado: já estava publicado";

  const urlValida = r.url_publicada && /^https?:\/\//i.test(r.url_publicada) ? r.url_publicada : null;
  const { error } = await admin
    .from("post_destinos")
    .update(
      r.status === "publicado"
        ? { status: "publicado", url_publicada: urlValida, mensagem_erro: null, publicado_em: new Date().toISOString() }
        : { status: "erro", mensagem_erro: r.mensagem_erro ?? "O Make informou erro, sem mensagem." },
    )
    .eq("id", r.destino_id);

  return error ? `erro ao gravar: ${error.message}` : `atualizado: ${r.status}`;
}
