import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ResumoPost, type PostResumido } from "@/components/ResumoPost";
import { LegendaStatus } from "@/components/Selos";
import { exigirDona } from "@/lib/auth";
import { agoraSP, chaveDia, diaSP, FUSO } from "@/lib/datas";
import { PONTO_STATUS_POST } from "@/lib/status";

export const metadata: Metadata = { title: "Calendário" };

type Visao = "mes" | "semana";
const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function chave(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default async function Calendario({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string; data?: string; dia?: string }>;
}) {
  const sp = await searchParams;
  const visao: Visao = sp.visao === "semana" ? "semana" : "mes";
  const referencia = diaSP(sp.data);
  const hoje = chave(agoraSP());
  const diaSelecionado = sp.dia ?? (sp.data ? chave(referencia) : hoje);

  const inicio =
    visao === "mes"
      ? startOfWeek(startOfMonth(referencia), { weekStartsOn: 0 })
      : startOfWeek(referencia, { weekStartsOn: 0 });
  const fim =
    visao === "mes"
      ? endOfWeek(endOfMonth(referencia), { weekStartsOn: 0 })
      : endOfWeek(referencia, { weekStartsOn: 0 });
  const dias = eachDayOfInterval({ start: inicio, end: fim }).map((d) => new TZDate(d, FUSO));

  const { supabase } = await exigirDona();
  const [{ data }, { count: rascunhosSemData }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, titulo_interno, status, agendado_para, post_destinos(rede)")
      .gte("agendado_para", new Date(inicio.getTime()).toISOString())
      .lt("agendado_para", new Date(addDays(fim, 1).getTime()).toISOString())
      .order("agendado_para"),
    supabase.from("posts").select("id", { count: "exact", head: true }).is("agendado_para", null),
  ]);
  const posts = (data ?? []) as PostResumido[];

  const porDia = new Map<string, PostResumido[]>();
  for (const p of posts) {
    if (!p.agendado_para) continue;
    const k = chaveDia(p.agendado_para);
    porDia.set(k, [...(porDia.get(k) ?? []), p]);
  }

  const anterior = chave(visao === "mes" ? addMonths(referencia, -1) : addWeeks(referencia, -1));
  const proximo = chave(visao === "mes" ? addMonths(referencia, 1) : addWeeks(referencia, 1));
  const titulo =
    visao === "mes"
      ? format(referencia, "MMMM 'de' yyyy", { locale: ptBR })
      : `${format(inicio, "d MMM", { locale: ptBR })} – ${format(fim, "d MMM yyyy", { locale: ptBR })}`;
  const link = (params: Record<string, string>) => `/calendario?${new URLSearchParams({ visao, ...params })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link href={link({ data: anterior })} className="botao-secundario px-2" aria-label="Anterior">
            <ChevronLeft className="size-5" />
          </Link>
          <Link href={link({ data: proximo })} className="botao-secundario px-2" aria-label="Próximo">
            <ChevronRight className="size-5" />
          </Link>
          <h1 className="ml-2 text-lg font-semibold capitalize">{titulo}</h1>
        </div>
        <Link href={link({ data: hoje, dia: hoje })} className="text-sm font-medium text-marca-700">
          Hoje
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 text-sm">
        {(["mes", "semana"] as const).map((v) => (
          <Link
            key={v}
            href={`/calendario?${new URLSearchParams({ visao: v, data: chave(referencia) })}`}
            className={`rounded-md py-1.5 text-center font-medium ${visao === v ? "bg-white shadow-sm" : "text-zinc-600"}`}
          >
            {v === "mes" ? "Mês" : "Semana"}
          </Link>
        ))}
      </div>

      <LegendaStatus />

      {visao === "mes" ? (
        <>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200">
            {DIAS_SEMANA.map((d, i) => (
              <div key={i} className="bg-zinc-50 py-1 text-center text-xs font-medium text-zinc-500">
                {d}
              </div>
            ))}
            {dias.map((d) => {
              const k = chave(d);
              const doDia = porDia.get(k) ?? [];
              const selecionado = k === diaSelecionado;
              return (
                <Link
                  key={k}
                  href={link({ data: chave(referencia), dia: k })}
                  className={`flex min-h-16 flex-col gap-1 p-1 md:min-h-24 ${
                    selecionado ? "bg-marca-50 ring-2 ring-marca-600 ring-inset" : "bg-white"
                  } ${isSameMonth(d, referencia) ? "" : "opacity-40"}`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full text-xs ${
                      k === hoje ? "bg-marca-600 font-bold text-white" : "text-zinc-700"
                    }`}
                  >
                    {format(d, "d")}
                  </span>
                  <span className="flex flex-wrap gap-0.5 md:hidden">
                    {doDia.slice(0, 6).map((p) => (
                      <span key={p.id} className={`size-2 rounded-full ${PONTO_STATUS_POST[p.status]}`} />
                    ))}
                  </span>
                  <span className="hidden space-y-0.5 md:block">
                    {doDia.slice(0, 3).map((p) => (
                      <span key={p.id} className="flex items-center gap-1 truncate text-[11px] text-zinc-700">
                        <span className={`size-1.5 shrink-0 rounded-full ${PONTO_STATUS_POST[p.status]}`} />
                        <span className="truncate">{p.titulo_interno}</span>
                      </span>
                    ))}
                    {doDia.length > 3 && <span className="text-[11px] text-zinc-500">+{doDia.length - 3}</span>}
                  </span>
                </Link>
              );
            })}
          </div>

          <ListaDoDia chaveDia={diaSelecionado} posts={porDia.get(diaSelecionado) ?? []} />
        </>
      ) : (
        <div className="space-y-4">
          {dias.map((d) => (
            <ListaDoDia key={chave(d)} chaveDia={chave(d)} posts={porDia.get(chave(d)) ?? []} hoje={chave(d) === hoje} />
          ))}
        </div>
      )}

      {(rascunhosSemData ?? 0) > 0 && (
        <Link href="/posts?status=rascunho" className="block text-sm text-zinc-600 underline">
          {rascunhosSemData} rascunho(s) sem data
        </Link>
      )}
    </div>
  );
}

function ListaDoDia({ chaveDia: k, posts, hoje }: { chaveDia: string; posts: PostResumido[]; hoje?: boolean }) {
  const d = diaSP(k);
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-semibold capitalize ${hoje ? "text-marca-700" : "text-zinc-700"}`}>
          {format(d, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h2>
        <Link href={`/posts/novo?data=${k}`} className="flex items-center gap-1 text-sm text-marca-700">
          <Plus className="size-4" /> Post
        </Link>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhum post.</p>
      ) : (
        posts.map((p) => <ResumoPost key={p.id} post={p} />)
      )}
    </section>
  );
}
