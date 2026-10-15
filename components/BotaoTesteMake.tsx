"use client";

import { FlaskConical, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enviarPostTeste } from "@/lib/acoes";
import type { RespostaEnvio } from "@/lib/envio";

export function BotaoTesteMake() {
  const router = useRouter();
  const [rodando, iniciar] = useTransition();
  const [resultado, setResultado] = useState<RespostaEnvio | null>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="botao-primario w-full"
        disabled={rodando}
        onClick={() =>
          iniciar(async () => {
            setResultado(await enviarPostTeste());
            router.refresh();
          })
        }
      >
        {rodando ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
        Enviar post de teste
      </button>
      {resultado && (
        <div
          className={`space-y-2 rounded-lg border p-3 text-sm ${
            resultado.ok ? "border-green-300 bg-green-50 text-green-900" : "border-red-300 bg-red-50 text-red-900"
          }`}
        >
          <p>{resultado.mensagem}</p>
          {resultado.detalhes !== undefined && (
            <details>
              <summary className="cursor-pointer">Ver o que foi enviado</summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded bg-white/70 p-2 text-xs">
                {JSON.stringify((resultado.detalhes as { payload?: unknown })?.payload ?? resultado.detalhes, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
