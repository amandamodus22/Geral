import { CONFIG_REDES } from "@/lib/redes";
import {
  COR_STATUS_DESTINO,
  COR_STATUS_POST,
  PONTO_STATUS_POST,
  ROTULO_STATUS_DESTINO,
  ROTULO_STATUS_POST,
} from "@/lib/status";
import type { Rede, StatusDestino, StatusPost } from "@/lib/tipos";

export function SeloStatusPost({ status }: { status: StatusPost }) {
  return (
    <span className={`selo ${COR_STATUS_POST[status]}`}>
      <span className={`size-1.5 rounded-full ${PONTO_STATUS_POST[status]}`} />
      {ROTULO_STATUS_POST[status]}
    </span>
  );
}

export function SeloStatusDestino({ status }: { status: StatusDestino }) {
  return <span className={`selo ${COR_STATUS_DESTINO[status]}`}>{ROTULO_STATUS_DESTINO[status]}</span>;
}

export function SeloRede({ rede, curto = false }: { rede: Rede; curto?: boolean }) {
  const cfg = CONFIG_REDES[rede];
  return (
    <span className={`selo ${cfg.cor}`} title={cfg.nome}>
      {curto ? SIGLAS[rede] : cfg.nome}
    </span>
  );
}

const SIGLAS: Record<Rede, string> = {
  instagram: "IG",
  facebook: "FB",
  linkedin: "IN",
  youtube: "YT",
  google_business: "GB",
  reddit: "RD",
  tiktok: "TT",
};

export function LegendaStatus() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
      {(Object.keys(ROTULO_STATUS_POST) as StatusPost[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <span className={`size-2 rounded-full ${PONTO_STATUS_POST[s]}`} />
          {ROTULO_STATUS_POST[s]}
        </span>
      ))}
    </div>
  );
}
