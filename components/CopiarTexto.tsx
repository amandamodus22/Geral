"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopiarTexto({ texto, rotulo = "Copiar legenda" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Navegadores antigos: seleciona num campo temporário.
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }
  return (
    <button type="button" onClick={copiar} className="botao-secundario">
      {copiado ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
      {copiado ? "Copiado!" : rotulo}
    </button>
  );
}
