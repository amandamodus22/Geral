export const REDES = [
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "google_business",
  "reddit",
  "tiktok",
] as const;
export type Rede = (typeof REDES)[number];

export const TIPOS_POST = ["imagem", "carrossel", "video"] as const;
export type TipoPost = (typeof TIPOS_POST)[number];

export const STATUS_POST = [
  "rascunho",
  "agendado",
  "enviando",
  "concluido",
  "concluido_com_erros",
] as const;
export type StatusPost = (typeof STATUS_POST)[number];

export const STATUS_DESTINO = ["pendente", "enviando", "publicado", "erro", "manual"] as const;
export type StatusDestino = (typeof STATUS_DESTINO)[number];

export interface Post {
  id: string;
  titulo_interno: string;
  legenda_base: string;
  tipo: TipoPost;
  media_paths: string[];
  variaveis: Record<string, string>;
  agendado_para: string | null;
  status: StatusPost;
  criado_em: string;
  atualizado_em: string;
}

export interface PostDestino {
  id: string;
  post_id: string;
  rede: Rede;
  legenda_personalizada: string | null;
  rodape_personalizado: string | null;
  legenda_final: string;
  texto_alternativo: string | null;
  comentario: string | null;
  linkedin_link_no_comentario: boolean;
  youtube_formato: "longo" | "shorts";
  youtube_titulo: string | null;
  google_tipo_post: string | null;
  google_botao_tipo: string | null;
  google_botao_url: string | null;
  reddit_subreddit: string | null;
  reddit_titulo: string | null;
  status: StatusDestino;
  url_publicada: string | null;
  mensagem_erro: string | null;
  enviado_em: string | null;
  publicado_em: string | null;
  atualizado_em: string;
}

export type PostComDestinos = Post & { post_destinos: PostDestino[] };

export interface RetornoMake {
  id: number;
  recebido_em: string;
  destino_id: string | null;
  corpo: unknown;
  resultado: string;
}
