import "server-only";
import { redirect } from "next/navigation";
import { ehEmailPermitido } from "@/lib/env";
import { clienteServidor } from "@/lib/supabase/servidor";

/** Garante que quem chama é a dona do painel. Redireciona para o login se não for. */
export async function exigirDona() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ehEmailPermitido(user.email)) {
    redirect("/login");
  }
  return { supabase, user };
}
