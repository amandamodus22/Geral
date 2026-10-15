import "server-only";
import { createClient } from "@supabase/supabase-js";
import { exigirEnv, SUPABASE_URL } from "@/lib/env";

/**
 * Cliente com a chave secreta (service role). IGNORA a RLS.
 * Só pode ser usado no servidor (callback do Make e login).
 */
export function clienteAdmin() {
  return createClient(SUPABASE_URL, exigirEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
