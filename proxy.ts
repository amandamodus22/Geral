import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ehEmailPermitido, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Rotas que não exigem login. */
const PUBLICAS = ["/login", "/auth/", "/api/make-callback"];

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar, cabecalhos) {
        for (const { name, value } of cookiesParaGravar) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) {
          resposta.cookies.set(name, value, options);
        }
        for (const [chave, valor] of Object.entries(cabecalhos ?? {})) {
          resposta.headers.set(chave, valor);
        }
      },
    },
  });

  const caminho = request.nextUrl.pathname;
  if (PUBLICAS.some((p) => caminho.startsWith(p))) {
    return resposta;
  }

  // Renova a sessão (não remova esta chamada).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !ehEmailPermitido(user.email)) {
    if (user) await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = user ? "?erro=nao_autorizado" : "";
    const redirecionar = NextResponse.redirect(url);
    for (const c of resposta.cookies.getAll()) redirecionar.cookies.set(c);
    return redirecionar;
  }

  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|post-teste.jpg|.*\\.(?:png|jpg|jpeg|svg|webp)$).*)",
  ],
};
