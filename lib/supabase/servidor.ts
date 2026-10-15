import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Cliente do Supabase no servidor, com a sessão da usuária (respeita a RLS). */
export async function clienteServidor() {
  const loja = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return loja.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesParaGravar) {
            loja.set(name, value, options);
          }
        } catch {
          // Chamado de um Server Component: o proxy.ts renova a sessão.
        }
      },
    },
  });
}
