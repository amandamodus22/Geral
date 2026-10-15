/** Lê uma variável de ambiente obrigatória, com mensagem clara se faltar. */
export function exigirEnv(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não configurada. Veja o README e o .env.example.`);
  }
  return valor;
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Limite (MB) usado no aviso de upload. Plano gratuito do Supabase: 50 MB. */
export const LIMITE_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_LIMITE_UPLOAD_MB ?? "50") || 50;

export const BUCKET_MIDIAS = "midias";

export function emailPermitido(): string {
  return exigirEnv("EMAIL_PERMITIDO").trim().toLowerCase();
}

export function ehEmailPermitido(email: string | null | undefined): boolean {
  const permitido = process.env.EMAIL_PERMITIDO?.trim().toLowerCase();
  return !!permitido && !!email && email.trim().toLowerCase() === permitido;
}
