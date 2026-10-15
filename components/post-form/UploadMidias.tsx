"use client";

import { ArrowDown, ArrowUp, Film, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { BUCKET_MIDIAS, LIMITE_UPLOAD_MB } from "@/lib/env";
import { MAX_CARROSSEL } from "@/lib/redes";
import { clienteNavegador } from "@/lib/supabase/navegador";
import type { TipoPost } from "@/lib/tipos";
import { ACCEPT_IMAGEM, ACCEPT_VIDEO, ehImagem, ehVideo, extensao } from "@/lib/validacao";

interface Props {
  postId: string;
  tipo: TipoPost;
  caminhos: string[];
  urls: Record<string, string>;
  aoMudar: (caminhos: string[]) => void;
  aoMudarUrls: (urls: Record<string, string>) => void;
}

function tamanhoMB(bytes: number) {
  return (bytes / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

export function UploadMidias({ postId, tipo, caminhos, urls, aoMudar, aoMudarUrls }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const multiplo = tipo === "carrossel";

  async function aoEscolher(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    const supabase = clienteNavegador();
    const novosAvisos: string[] = [];
    let lista = multiplo ? [...caminhos] : [];
    const novasUrls = { ...urls };

    const selecionados = Array.from(arquivos).slice(0, multiplo ? MAX_CARROSSEL - caminhos.length : 1);
    for (const arquivo of selecionados) {
      const ext = extensao(arquivo.name);
      const nomeTeste = `x.${ext}`;
      if (tipo === "video" ? !ehVideo(nomeTeste) : !ehImagem(nomeTeste)) {
        novosAvisos.push(`“${arquivo.name}”: formato não aceito para ${tipo === "video" ? "vídeo" : "imagem"}.`);
        continue;
      }
      if (arquivo.size > LIMITE_UPLOAD_MB * 1024 * 1024) {
        novosAvisos.push(
          `“${arquivo.name}” tem ${tamanhoMB(arquivo.size)} MB e passa do limite de upload do Supabase (${LIMITE_UPLOAD_MB} MB). Comprima o arquivo antes de enviar.`,
        );
        continue;
      }

      const caminho = `${postId}/${crypto.randomUUID()}.${ext}`;
      setEnviando((e) => [...e, arquivo.name]);
      const { error } = await supabase.storage.from(BUCKET_MIDIAS).upload(caminho, arquivo, {
        contentType: arquivo.type || undefined,
        upsert: false,
      });
      setEnviando((e) => e.filter((n) => n !== arquivo.name));

      if (error) {
        const grande = /exceeded|too large|maximum/i.test(error.message);
        novosAvisos.push(
          grande
            ? `“${arquivo.name}” passa do limite de upload do Supabase (${LIMITE_UPLOAD_MB} MB).`
            : `Falha ao enviar “${arquivo.name}”: ${error.message}`,
        );
        continue;
      }
      novasUrls[caminho] = URL.createObjectURL(arquivo);
      lista = multiplo ? [...lista, caminho] : [caminho];
    }

    setAvisos(novosAvisos);
    aoMudarUrls(novasUrls);
    aoMudar(lista);
    if (entrada.current) entrada.current.value = "";
  }

  function mover(indice: number, delta: number) {
    const lista = [...caminhos];
    const alvo = indice + delta;
    if (alvo < 0 || alvo >= lista.length) return;
    [lista[indice], lista[alvo]] = [lista[alvo], lista[indice]];
    aoMudar(lista);
  }

  const podeAdicionar = multiplo ? caminhos.length < MAX_CARROSSEL : true;

  return (
    <div className="space-y-3">
      {caminhos.length > 0 && (
        <ul className={multiplo ? "grid grid-cols-3 gap-2 sm:grid-cols-4" : "grid grid-cols-1"}>
          {caminhos.map((caminho, i) => (
            <li key={caminho} className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
              {ehVideo(caminho) ? (
                urls[caminho] ? (
                  <video src={urls[caminho]} className="max-h-72 w-full bg-black object-contain" controls muted preload="metadata" />
                ) : (
                  <div className="grid h-40 place-items-center text-zinc-500"><Film /></div>
                )
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[caminho]}
                  alt={`Mídia ${i + 1}`}
                  className={multiplo ? "aspect-square w-full object-cover" : "max-h-72 w-full object-contain"}
                />
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                {multiplo && (
                  <>
                    <span className="rounded bg-black/60 px-1.5 text-xs leading-6 text-white">{i + 1}</span>
                    <button type="button" onClick={() => mover(i, -1)} className="rounded bg-white/90 p-1" aria-label="Mover para antes">
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => mover(i, 1)} className="rounded bg-white/90 p-1" aria-label="Mover para depois">
                      <ArrowDown className="size-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => aoMudar(caminhos.filter((c) => c !== caminho))}
                  className="rounded bg-white/90 p-1 text-red-700"
                  aria-label="Remover mídia"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {enviando.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-zinc-600">
          <Loader2 className="size-4 animate-spin" /> Enviando {enviando.join(", ")}…
        </p>
      )}

      {podeAdicionar && (
        <>
          <input
            ref={entrada}
            type="file"
            className="hidden"
            accept={tipo === "video" ? ACCEPT_VIDEO : ACCEPT_IMAGEM}
            multiple={multiplo}
            onChange={(e) => aoEscolher(e.target.files)}
          />
          <button
            type="button"
            className="botao-secundario w-full border-dashed"
            onClick={() => entrada.current?.click()}
            disabled={enviando.length > 0}
          >
            <ImagePlus className="size-5" />
            {caminhos.length === 0
              ? tipo === "video"
                ? "Escolher vídeo"
                : tipo === "carrossel"
                  ? "Escolher imagens"
                  : "Escolher imagem"
              : multiplo
                ? "Adicionar mais imagens"
                : "Trocar arquivo"}
          </button>
          <p className="text-xs text-zinc-500">Limite por arquivo: {LIMITE_UPLOAD_MB} MB.</p>
        </>
      )}

      {avisos.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {avisos.map((a) => (
            <li key={a}>⚠️ {a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
