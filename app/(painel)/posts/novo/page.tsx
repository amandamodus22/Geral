import type { Metadata } from "next";
import { FormularioPost } from "@/components/post-form/FormularioPost";
import { exigirDona } from "@/lib/auth";
import { buscarConfig } from "@/lib/dados";
import type { DadosPost } from "@/lib/validacao";

export const metadata: Metadata = { title: "Novo post" };

export default async function NovoPost({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { supabase } = await exigirDona();
  const config = await buscarConfig(supabase);
  const { data } = await searchParams;

  const inicial: DadosPost = {
    id: crypto.randomUUID(),
    titulo_interno: "",
    legenda_base: "",
    tipo: "imagem",
    media_paths: [],
    variaveis: {},
    data: data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : "",
    hora: data ? "10:00" : "",
    destinos: [],
  };

  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Novo post</h1>
      <FormularioPost inicial={inicial} config={config} urlsIniciais={{}} />
    </>
  );
}
