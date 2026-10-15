import type { Metadata } from "next";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = { title: "Entrar" };

const ERROS: Record<string, string> = {
  nao_autorizado: "Este e-mail não tem acesso ao painel.",
  link_invalido: "O link expirou ou já foi usado. Peça um novo.",
};

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Painel de Posts</h1>
      <p className="mb-8 text-sm text-zinc-600">Acesso restrito. Entre com o link enviado ao seu e-mail.</p>
      <FormularioLogin erroInicial={erro ? ERROS[erro] : undefined} />
    </main>
  );
}
