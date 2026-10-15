"use client";

import { useActionState } from "react";
import { enviarLink, verificarCodigo, type EstadoLogin } from "./acoes";

const inicial: EstadoLogin = { etapa: "email", email: "" };

export function FormularioLogin({ erroInicial }: { erroInicial?: string }) {
  const [estadoEmail, acaoEmail, enviandoEmail] = useActionState(enviarLink, inicial);
  const [estadoCodigo, acaoCodigo, enviandoCodigo] = useActionState(verificarCodigo, inicial);

  if (estadoEmail.etapa === "codigo") {
    return (
      <form action={acaoCodigo} className="space-y-4">
        <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{estadoEmail.mensagem}</p>
        <p className="text-sm text-zinc-600">
          Clique no link do e-mail <strong>ou</strong> digite aqui o código que veio nele:
        </p>
        <input type="hidden" name="email" value={estadoEmail.email} />
        <input
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="Código do e-mail"
          className="campo text-center text-2xl tracking-[0.4em]"
          maxLength={10}
          required
        />
        {estadoCodigo.erro && <p className="text-sm text-red-700">{estadoCodigo.erro}</p>}
        <button className="botao-primario w-full" disabled={enviandoCodigo}>
          {enviandoCodigo ? "Entrando…" : "Entrar"}
        </button>
      </form>
    );
  }

  return (
    <form action={acaoEmail} className="space-y-4">
      <label className="block">
        <span className="rotulo">Seu e-mail</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          defaultValue={estadoEmail.email}
          className="campo"
          placeholder="voce@exemplo.com"
        />
      </label>
      {(estadoEmail.erro || erroInicial) && (
        <p className="text-sm text-red-700">{estadoEmail.erro ?? erroInicial}</p>
      )}
      <button className="botao-primario w-full" disabled={enviandoEmail}>
        {enviandoEmail ? "Enviando…" : "Receber link de acesso"}
      </button>
    </form>
  );
}
