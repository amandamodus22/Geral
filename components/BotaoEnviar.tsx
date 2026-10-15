"use client";

import { useFormStatus } from "react-dom";

/** Botão de formulário que mostra "aguarde" enquanto a ação roda. */
export function BotaoEnviar({
  children,
  pendente = "Aguarde…",
  className = "botao-primario",
  confirmar,
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendente?: string; confirmar?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      {...resto}
      className={className}
      disabled={pending || resto.disabled}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
        resto.onClick?.(e);
      }}
    >
      {pending ? pendente : children}
    </button>
  );
}
