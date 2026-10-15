"use client";

import { CalendarX, Loader2, Pencil, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { desagendar, publicarAgora, type ResultadoAcao } from "@/lib/acoes";
import type { StatusPost } from "@/lib/tipos";

export function AcoesPost({ id, status }: { id: string; status: StatusPost }) {
  const router = useRouter();
  const [rodando, iniciar] = useTransition();
  const [resultado, setResultado] = useState<ResultadoAcao | null>(null);
  const editavel = status === "rascunho" || status === "agendado";

  function executar(acao: () => Promise<ResultadoAcao>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;
    setResultado(null);
    iniciar(async () => {
      setResultado(await acao());
      router.refresh();
    });
  }

  if (!editavel) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link href={`/posts/${id}/editar`} className="botao-secundario">
          <Pencil className="size-4" /> Editar
        </Link>
        <button
          type="button"
          className="botao-primario"
          disabled={rodando}
          onClick={() => executar(() => publicarAgora(id), "Publicar agora em todas as redes deste post?")}
        >
          {rodando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Publicar agora
        </button>
        {status === "agendado" && (
          <button type="button" className="botao-secundario" disabled={rodando} onClick={() => executar(() => desagendar(id))}>
            <CalendarX className="size-4" /> Voltar para rascunho
          </button>
        )}
      </div>
      {resultado && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            resultado.ok ? "border-green-300 bg-green-50 text-green-900" : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          {resultado.mensagem}
          {resultado.erros && (
            <ul className="mt-1 list-disc pl-5">
              {resultado.erros.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function BotaoTentarDeNovo({ acao }: { acao: () => Promise<ResultadoAcao> }) {
  const router = useRouter();
  const [rodando, iniciar] = useTransition();
  const [mensagem, setMensagem] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <button
        type="button"
        className="botao-secundario min-h-9 px-3"
        disabled={rodando}
        onClick={() =>
          iniciar(async () => {
            const r = await acao();
            setMensagem(r.mensagem ?? null);
            router.refresh();
          })
        }
      >
        {rodando && <Loader2 className="size-4 animate-spin" />} Tentar de novo
      </button>
      {mensagem && <p className="text-xs text-zinc-600">{mensagem}</p>}
    </div>
  );
}
