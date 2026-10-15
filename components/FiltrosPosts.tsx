"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CONFIG_REDES } from "@/lib/redes";
import { ROTULO_STATUS_POST } from "@/lib/status";
import { REDES, STATUS_POST } from "@/lib/tipos";

export function FiltrosPosts() {
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();

  function mudar(chave: string, valor: string) {
    const novos = new URLSearchParams(params);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    router.replace(`${caminho}?${novos}`);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <label>
        <span className="sr-only">Status</span>
        <select className="campo" value={params.get("status") ?? ""} onChange={(e) => mudar("status", e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_POST.map((s) => (
            <option key={s} value={s}>
              {ROTULO_STATUS_POST[s]}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Rede</span>
        <select className="campo" value={params.get("rede") ?? ""} onChange={(e) => mudar("rede", e.target.value)}>
          <option value="">Todas as redes</option>
          {REDES.map((r) => (
            <option key={r} value={r}>
              {CONFIG_REDES[r].nome}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
