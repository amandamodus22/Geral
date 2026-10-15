import Link from "next/link";
import { formatarSP } from "@/lib/datas";
import { PONTO_STATUS_POST } from "@/lib/status";
import { REDES, type Rede, type StatusPost } from "@/lib/tipos";
import { SeloRede, SeloStatusPost } from "./Selos";

export interface PostResumido {
  id: string;
  titulo_interno: string;
  status: StatusPost;
  agendado_para: string | null;
  post_destinos: { rede: Rede }[];
}

export function ResumoPost({ post, mostrarData = false }: { post: PostResumido; mostrarData?: boolean }) {
  const redes = REDES.filter((r) => post.post_destinos.some((d) => d.rede === r));
  return (
    <Link
      href={`/posts/${post.id}`}
      className="flex items-stretch gap-3 rounded-lg border border-zinc-200 bg-white p-3 hover:border-marca-600"
    >
      <span className={`w-1 shrink-0 rounded-full ${PONTO_STATUS_POST[post.status]}`} />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="flex items-start justify-between gap-2">
          <span className="truncate font-medium">{post.titulo_interno || "Sem título"}</span>
          <SeloStatusPost status={post.status} />
        </span>
        <span className="flex flex-wrap items-center gap-1 text-xs text-zinc-500">
          {post.agendado_para && (
            <span className="mr-1 tabular-nums">
              {formatarSP(post.agendado_para, mostrarData ? "dd/MM/yy HH:mm" : "HH:mm")}
            </span>
          )}
          {redes.map((r) => (
            <SeloRede key={r} rede={r} curto />
          ))}
        </span>
      </span>
    </Link>
  );
}
