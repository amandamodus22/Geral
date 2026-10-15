import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FiltrosPosts } from "@/components/FiltrosPosts";
import { ResumoPost, type PostResumido } from "@/components/ResumoPost";
import { exigirDona } from "@/lib/auth";
import { REDES, STATUS_POST, type Rede, type StatusPost } from "@/lib/tipos";

export const metadata: Metadata = { title: "Posts" };

export default async function ListaPosts({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; rede?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUS_POST.includes(sp.status as StatusPost) ? (sp.status as StatusPost) : null;
  const rede = REDES.includes(sp.rede as Rede) ? (sp.rede as Rede) : null;

  const { supabase } = await exigirDona();
  const campos = "id, titulo_interno, status, agendado_para, post_destinos(rede)";
  let consulta = supabase
    .from("posts")
    .select(rede ? `${campos}, filtro:post_destinos!inner(rede)` : campos)
    .order("agendado_para", { ascending: false, nullsFirst: true })
    .limit(200);
  if (status) consulta = consulta.eq("status", status);
  if (rede) consulta = consulta.eq("filtro.rede", rede);
  const { data, error } = await consulta;
  const posts = (data ?? []) as unknown as PostResumido[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Posts</h1>
        <Link href="/posts/novo" className="botao-primario">
          Novo post
        </Link>
      </div>
      <Suspense>
        <FiltrosPosts />
      </Suspense>
      {error && <p className="text-sm text-red-700">Erro ao carregar: {error.message}</p>}
      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">Nenhum post encontrado.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <ResumoPost key={p.id} post={p} mostrarData />
          ))}
        </div>
      )}
    </div>
  );
}
