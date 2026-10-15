import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const FUSO = "America/Sao_Paulo";

/** Data/hora "agora" no fuso de São Paulo. */
export function agoraSP(): TZDate {
  return TZDate.tz(FUSO);
}

/** Converte um ISO (UTC) para uma data no fuso de São Paulo. */
export function emSP(iso: string | Date): TZDate {
  return new TZDate(typeof iso === "string" ? new Date(iso) : iso, FUSO);
}

/** Formata com padrão do date-fns, em pt-BR e no fuso de São Paulo. */
export function formatarSP(iso: string | Date, padrao: string): string {
  return format(emSP(iso), padrao, { locale: ptBR });
}

/** "15/10/2026 às 14:30" */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "Sem data";
  return formatarSP(iso, "dd/MM/yyyy 'às' HH:mm");
}

/** Separa um ISO em data (yyyy-MM-dd) e hora (HH:mm) de São Paulo. */
export function partesSP(iso: string | null | undefined): { data: string; hora: string } {
  if (!iso) return { data: "", hora: "" };
  const d = emSP(iso);
  return { data: format(d, "yyyy-MM-dd"), hora: format(d, "HH:mm") };
}

/** Junta data (yyyy-MM-dd) + hora (HH:mm) de São Paulo num ISO UTC. */
export function isoDeSP(data: string, hora: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  const h = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!m || !h) return null;
  const d = new TZDate(+m[1], +m[2] - 1, +m[3], +h[1], +h[2], 0, FUSO);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime()).toISOString();
}

/** yyyy-MM-dd do dia (em São Paulo) de um ISO. */
export function chaveDia(iso: string | Date): string {
  return format(emSP(iso), "yyyy-MM-dd");
}

/** Cria uma data de São Paulo a partir de "yyyy-MM-dd" (meia-noite). */
export function diaSP(chave: string | undefined | null): TZDate {
  const m = chave ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(chave) : null;
  if (!m) {
    const hoje = agoraSP();
    return new TZDate(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), FUSO);
  }
  return new TZDate(+m[1], +m[2] - 1, +m[3], FUSO);
}
