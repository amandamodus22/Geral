"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ehEmailPermitido, emailPermitido } from "@/lib/env";
import { clienteAdmin } from "@/lib/supabase/admin";
import { clienteServidor } from "@/lib/supabase/servidor";

export interface EstadoLogin {
  etapa: "email" | "codigo";
  email: string;
  mensagem?: string;
  erro?: string;
}

async function origem(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/** Registra no banco qual é o e-mail da dona (usado pela RLS). */
async function registrarDona(admin: ReturnType<typeof clienteAdmin>) {
  const { error } = await admin
    .from("config_painel")
    .upsert({ id: true, email_dona: emailPermitido() });
  if (error) throw new Error(`Não consegui gravar config_painel: ${error.message}`);
}

export async function enviarLink(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const respostaPadrao: EstadoLogin = {
    etapa: "codigo",
    email,
    mensagem: "Se este e-mail tiver acesso, você vai receber um link e um código para entrar.",
  };

  if (!email) return { etapa: "email", email, erro: "Digite seu e-mail." };
  // Não revela se o e-mail tem ou não acesso.
  if (!ehEmailPermitido(email)) return respostaPadrao;

  const admin = clienteAdmin();
  await registrarDona(admin);

  const supabase = await clienteServidor();
  const opcoes = { shouldCreateUser: false, emailRedirectTo: `${await origem()}/auth/confirmar` };
  let { error } = await supabase.auth.signInWithOtp({ email, options: opcoes });

  if (error) {
    // Primeiro acesso: cria a usuária (o cadastro público fica desligado).
    const criacao = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (!criacao.error) {
      ({ error } = await supabase.auth.signInWithOtp({ email, options: opcoes }));
    }
  }

  if (error) {
    return {
      etapa: "email",
      email,
      erro: `Não consegui enviar o e-mail: ${error.message}. Aguarde alguns minutos e tente de novo.`,
    };
  }
  return respostaPadrao;
}

export async function verificarCodigo(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const codigo = String(form.get("codigo") ?? "").replace(/\D/g, "");

  if (!ehEmailPermitido(email) || codigo.length < 6) {
    return { etapa: "codigo", email, erro: "Código inválido ou expirado." };
  }

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });
  if (error) return { etapa: "codigo", email, erro: "Código inválido ou expirado." };

  redirect("/");
}

export async function sair() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
