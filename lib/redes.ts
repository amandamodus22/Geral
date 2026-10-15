import type { Rede, TipoPost } from "./tipos";

export interface ConfigRede {
  nome: string;
  /** Classe Tailwind para o "chip" da rede. */
  cor: string;
  /** Limite de caracteres do texto final (legenda + finalização + hashtags). */
  limiteTexto?: number;
  /** Tipos de post aceitos pela rede. */
  tiposAceitos: TipoPost[];
  /** Publicação manual (não vai para o Make). */
  manual?: boolean;
  /** Texto final é opcional (ex.: Reddit pode ter só título). */
  textoOpcional?: boolean;
}

export const CONFIG_REDES: Record<Rede, ConfigRede> = {
  instagram: {
    nome: "Instagram",
    cor: "bg-pink-100 text-pink-800 border-pink-300",
    limiteTexto: 2200,
    tiposAceitos: ["imagem", "carrossel", "video"],
  },
  facebook: {
    nome: "Facebook",
    cor: "bg-blue-100 text-blue-800 border-blue-300",
    tiposAceitos: ["imagem", "carrossel", "video"],
  },
  linkedin: {
    nome: "LinkedIn",
    cor: "bg-sky-100 text-sky-800 border-sky-300",
    limiteTexto: 3000,
    tiposAceitos: ["imagem", "carrossel", "video"],
  },
  youtube: {
    nome: "YouTube",
    cor: "bg-red-100 text-red-800 border-red-300",
    // Limite da descrição do YouTube.
    limiteTexto: 5000,
    tiposAceitos: ["video"],
  },
  google_business: {
    nome: "Google Business",
    cor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    limiteTexto: 1500,
    tiposAceitos: ["imagem", "carrossel", "video"],
  },
  reddit: {
    nome: "Reddit",
    cor: "bg-orange-100 text-orange-800 border-orange-300",
    tiposAceitos: ["imagem", "carrossel", "video"],
    textoOpcional: true,
  },
  tiktok: {
    nome: "TikTok",
    cor: "bg-zinc-200 text-zinc-900 border-zinc-400",
    limiteTexto: 4000,
    tiposAceitos: ["video"],
    manual: true,
  },
};

export const LIMITE_TITULO_YOUTUBE = 100;
export const LIMITE_TITULO_REDDIT = 300;
export const MAX_CARROSSEL_INSTAGRAM = 10;
export const MAX_CARROSSEL = 20;

export const NOMES_TIPO: Record<TipoPost, string> = {
  imagem: "Imagem",
  carrossel: "Carrossel",
  video: "Vídeo",
};
