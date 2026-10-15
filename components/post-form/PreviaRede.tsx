"use client";

import { Heart, MessageCircle, Send, ThumbsUp } from "lucide-react";
import { useState } from "react";
import type { Rede } from "@/lib/tipos";
import { ehVideo } from "@/lib/validacao";

export interface DadosPrevia {
  rede: Rede;
  nome: string;
  texto: string;
  midias: { caminho: string; url?: string }[];
  youtubeTitulo?: string;
  youtubeShorts?: boolean;
  subreddit?: string;
  redditTitulo?: string;
  comentario?: string | null;
  botao?: { tipo: string; url: string } | null;
  textoAlternativo?: string | null;
}

/** Texto cortado como a rede mostra antes do "mais". */
function TextoCortado({ texto, limite, rotulo = "mais" }: { texto: string; limite: number; rotulo?: string }) {
  const [aberto, setAberto] = useState(false);
  const caracteres = Array.from(texto);
  if (aberto || caracteres.length <= limite) {
    return <p className="text-sm whitespace-pre-wrap break-words">{texto}</p>;
  }
  return (
    <p className="text-sm whitespace-pre-wrap break-words">
      {caracteres.slice(0, limite).join("")}…{" "}
      <button type="button" className="text-zinc-500" onClick={() => setAberto(true)}>
        {rotulo}
      </button>
    </p>
  );
}

function Midia({ midias, proporcao, alt }: { midias: DadosPrevia["midias"]; proporcao: string; alt?: string | null }) {
  const primeira = midias[0];
  if (!primeira) {
    return <div className={`${proporcao} grid w-full place-items-center bg-zinc-100 text-xs text-zinc-400`}>sem mídia</div>;
  }
  return (
    <div className={`${proporcao} relative w-full overflow-hidden bg-black`}>
      {ehVideo(primeira.caminho) ? (
        <video src={primeira.url} className="size-full object-cover" muted preload="metadata" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={primeira.url} alt={alt ?? ""} className="size-full object-cover" />
      )}
      {midias.length > 1 && (
        <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 text-xs text-white">1/{midias.length}</span>
      )}
    </div>
  );
}

function Avatar({ nome }: { nome: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-marca-600 text-xs font-bold text-white">
      {nome.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function PreviaRede(p: DadosPrevia) {
  const moldura = "mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white";

  switch (p.rede) {
    case "instagram":
      return (
        <div className={moldura}>
          <div className="flex items-center gap-2 p-2.5"><Avatar nome={p.nome} /><b className="text-sm">{p.nome}</b></div>
          <Midia midias={p.midias} proporcao="aspect-[4/5]" alt={p.textoAlternativo} />
          <div className="flex gap-3 p-2.5"><Heart className="size-5" /><MessageCircle className="size-5" /><Send className="size-5" /></div>
          <div className="px-2.5 pb-3"><TextoCortado texto={p.texto} limite={125} /></div>
        </div>
      );
    case "tiktok":
      return (
        <div className={`${moldura} max-w-[16rem]`}>
          <div className="relative">
            <Midia midias={p.midias} proporcao="aspect-[9/16]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3 text-white">
              <b className="text-sm">@{p.nome.toLowerCase().replace(/\s+/g, "")}</b>
              <div className="max-h-28 overflow-hidden"><TextoCortado texto={p.texto} limite={90} /></div>
            </div>
          </div>
        </div>
      );
    case "youtube":
      return (
        <div className={p.youtubeShorts ? `${moldura} max-w-[16rem]` : moldura}>
          <Midia midias={p.midias} proporcao={p.youtubeShorts ? "aspect-[9/16]" : "aspect-video"} />
          <div className="space-y-2 p-3">
            <b className="block text-base leading-snug">{p.youtubeTitulo || "Título do vídeo"}</b>
            <div className="rounded-lg bg-zinc-100 p-2"><TextoCortado texto={p.texto} limite={160} rotulo="...mais" /></div>
          </div>
        </div>
      );
    case "linkedin":
      return (
        <div className={moldura}>
          <div className="flex items-center gap-2 p-3"><Avatar nome={p.nome} /><b className="text-sm">{p.nome}</b></div>
          <div className="px-3 pb-3"><TextoCortado texto={p.texto} limite={210} rotulo="…ver mais" /></div>
          {p.midias.length > 0 && <Midia midias={p.midias} proporcao="aspect-square" />}
          <div className="flex gap-4 border-t p-2.5 text-xs text-zinc-600"><span className="flex items-center gap-1"><ThumbsUp className="size-4" />Gostei</span><span>Comentar</span></div>
          {p.comentario && (
            <div className="border-t bg-zinc-50 p-3 text-xs"><b>1º comentário:</b> {p.comentario}</div>
          )}
        </div>
      );
    case "facebook":
      return (
        <div className={moldura}>
          <div className="flex items-center gap-2 p-3"><Avatar nome={p.nome} /><b className="text-sm">{p.nome}</b></div>
          <div className="px-3 pb-3"><TextoCortado texto={p.texto} limite={240} rotulo="Ver mais" /></div>
          {p.midias.length > 0 && <Midia midias={p.midias} proporcao="aspect-square" />}
        </div>
      );
    case "google_business":
      return (
        <div className={moldura}>
          {p.midias.length > 0 && <Midia midias={p.midias} proporcao="aspect-[4/3]" />}
          <div className="space-y-3 p-3">
            <TextoCortado texto={p.texto} limite={300} rotulo="Mais" />
            {p.botao && (
              <span className="inline-block rounded-full border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-700">
                {p.botao.tipo}
              </span>
            )}
          </div>
        </div>
      );
    case "reddit":
      return (
        <div className={moldura}>
          <div className="space-y-2 p-3">
            <span className="text-xs text-zinc-500">r/{p.subreddit || "subreddit"}</span>
            <b className="block text-base leading-snug">{p.redditTitulo || "Título do post"}</b>
          </div>
          {p.midias.length > 0 && <Midia midias={p.midias} proporcao="aspect-video" />}
          {p.texto && <div className="p-3"><TextoCortado texto={p.texto} limite={300} rotulo="Ler mais" /></div>}
        </div>
      );
  }
}
