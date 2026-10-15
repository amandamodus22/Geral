import type { StatusDestino, StatusPost } from "./tipos";

export const ROTULO_STATUS_POST: Record<StatusPost, string> = {
  rascunho: "Rascunho",
  agendado: "Agendado",
  enviando: "Enviando",
  concluido: "Concluído",
  concluido_com_erros: "Concluído com erros",
};

/** Classes do selo (badge) de status. */
export const COR_STATUS_POST: Record<StatusPost, string> = {
  rascunho: "bg-zinc-100 text-zinc-700 border-zinc-300",
  agendado: "bg-blue-100 text-blue-800 border-blue-300",
  enviando: "bg-amber-100 text-amber-800 border-amber-300",
  concluido: "bg-green-100 text-green-800 border-green-300",
  concluido_com_erros: "bg-red-100 text-red-800 border-red-300",
};

/** Cor sólida (bolinha / barra lateral no calendário). */
export const PONTO_STATUS_POST: Record<StatusPost, string> = {
  rascunho: "bg-zinc-400",
  agendado: "bg-blue-500",
  enviando: "bg-amber-500",
  concluido: "bg-green-600",
  concluido_com_erros: "bg-red-600",
};

export const ROTULO_STATUS_DESTINO: Record<StatusDestino, string> = {
  pendente: "Pendente",
  enviando: "Enviando",
  publicado: "Publicado",
  erro: "Erro",
  manual: "Postar manualmente",
};

export const COR_STATUS_DESTINO: Record<StatusDestino, string> = {
  pendente: "bg-zinc-100 text-zinc-700 border-zinc-300",
  enviando: "bg-amber-100 text-amber-800 border-amber-300",
  publicado: "bg-green-100 text-green-800 border-green-300",
  erro: "bg-red-100 text-red-800 border-red-300",
  manual: "bg-violet-100 text-violet-800 border-violet-300",
};

/** Posts que ainda podem ser editados. */
export function podeEditar(status: StatusPost): boolean {
  return status === "rascunho" || status === "agendado";
}
