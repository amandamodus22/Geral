import Link from "next/link";
import { NavPainel } from "@/components/NavPainel";
import { exigirDona } from "@/lib/auth";

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const { supabase } = await exigirDona();
  const { count } = await supabase
    .from("post_destinos")
    .select("id", { count: "exact", head: true })
    .eq("rede", "tiktok")
    .eq("status", "manual");

  return (
    <div className="min-h-dvh pb-24 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
          <Link href="/calendario" className="py-1.5 text-base font-semibold text-marca-700">
            Painel de Posts
          </Link>
          <div className="hidden md:block">
            <NavPainel pendentesManual={count ?? 0} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>
      <div className="md:hidden">
        <NavPainel pendentesManual={count ?? 0} />
      </div>
    </div>
  );
}
