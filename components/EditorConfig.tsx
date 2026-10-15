"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { restaurarConfigPadrao, salvarConfigConteudo, type ResultadoAcao } from "@/lib/acoes";

export function EditorConfig({ inicial }: { inicial: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState(inicial);
  const [rodando, iniciar] = useTransition();
  const [resultado, setResultado] = useState<ResultadoAcao | null>(null);

  function executar(acao: () => Promise<ResultadoAcao>) {
    setResultado(null);
    iniciar(async () => {
      const r = await acao();
      setResultado(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        className="campo min-h-96 font-mono text-xs"
        spellCheck={false}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="botao-primario" disabled={rodando} onClick={() => executar(() => salvarConfigConteudo(texto))}>
          {rodando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar configuração
        </button>
        <button
          type="button"
          className="botao-secundario"
          disabled={rodando}
          onClick={() => {
            if (window.confirm("Substituir pela configuração padrão (a versão original de 15/10/2026)?")) {
              executar(async () => {
                const r = await restaurarConfigPadrao();
                if (r.ok) window.location.reload();
                return r;
              });
            }
          }}
        >
          <RotateCcw className="size-4" /> Restaurar padrão
        </button>
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
