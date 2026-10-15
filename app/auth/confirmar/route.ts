import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ehEmailPermitido } from "@/lib/env";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Destino do link mágico. Aceita os dois formatos do Supabase:
 *  - ?token_hash=...&type=email  (recomendado: funciona em qualquer navegador)
 *  - ?code=...                   (padrão do Supabase; precisa ser o mesmo navegador)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = (searchParams.get("type") ?? "email") as EmailOtpType;
  const code = searchParams.get("code");

  const supabase = await clienteServidor();
  let erro = true;

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
    erro = !!error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    erro = !!error;
  }

  if (erro) return NextResponse.redirect(`${origin}/login?erro=link_invalido`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!ehEmailPermitido(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=nao_autorizado`);
  }

  return NextResponse.redirect(`${origin}/`);
}
