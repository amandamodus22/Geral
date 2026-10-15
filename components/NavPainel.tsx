"use client";

import { CalendarDays, Hand, List, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/calendario", rotulo: "Calendário", Icone: CalendarDays },
  { href: "/posts", rotulo: "Posts", Icone: List },
  { href: "/posts/novo", rotulo: "Novo", Icone: Plus, destaque: true },
  { href: "/manual", rotulo: "Manual", Icone: Hand },
  { href: "/ajustes", rotulo: "Ajustes", Icone: Settings },
];

function ativo(caminho: string, href: string) {
  if (href === "/posts") return caminho === "/posts" || (caminho.startsWith("/posts/") && caminho !== "/posts/novo");
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function NavPainel({ pendentesManual }: { pendentesManual: number }) {
  const caminho = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:static md:border-0 md:bg-transparent md:pb-0">
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around md:justify-end md:gap-1">
        {ITENS.map(({ href, rotulo, Icone, destaque }) => {
          const eAtivo = ativo(caminho, href);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-2 text-[11px] font-medium md:flex-row md:gap-1.5 md:rounded-lg md:px-3 md:text-sm ${
                  eAtivo ? "text-marca-600" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span
                  className={
                    destaque
                      ? "grid size-9 place-items-center rounded-full bg-marca-600 text-white md:size-6"
                      : ""
                  }
                >
                  <Icone className={destaque ? "size-5 md:size-4" : "size-6 md:size-4"} aria-hidden />
                </span>
                {rotulo}
                {href === "/manual" && pendentesManual > 0 && (
                  <span className="absolute top-1 right-[calc(50%-22px)] min-w-4 rounded-full bg-violet-600 px-1 text-center text-[10px] leading-4 text-white md:static">
                    {pendentesManual}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
