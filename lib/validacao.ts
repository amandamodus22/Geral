import { z } from "zod";
import { contarCaracteres, hashtagsNoTexto, verificarProibicoes } from "./composicao";
import {
  calcularDestino,
  checarTermos,
  limiteDaRede,
  maxHashtagsDaRede,
  modeloDaRede,
  type AlertaTermo,
  type ConfigConteudo,
  type DestinoCalculado,
} from "./conteudo";
import { isoDeSP } from "./datas";
import {
  CONFIG_REDES,
  LIMITE_TITULO_REDDIT,
  LIMITE_TITULO_YOUTUBE,
  MAX_CARROSSEL,
  MAX_CARROSSEL_INSTAGRAM,
} from "./redes";
import { REDES, TIPOS_POST, type Rede } from "./tipos";

// ---------------------------------------------------------------------
// Formato dos dados do formulário (usado no navegador e no servidor)
// ---------------------------------------------------------------------

export const esquemaDestino = z.object({
  rede: z.enum(REDES),
  legenda_personalizada: z.string().max(10000).nullable(),
  rodape_personalizado: z.string().max(10000).nullable(),
  youtube_formato: z.enum(["longo", "shorts"]),
  linkedin_link_no_comentario: z.boolean(),
  youtube_titulo: z.string().max(500),
  reddit_subreddit: z.string().max(100),
  reddit_titulo: z.string().max(1000),
});
export type DadosDestino = z.infer<typeof esquemaDestino>;

export const esquemaPost = z.object({
  id: z.uuid(),
  titulo_interno: z.string().max(200),
  legenda_base: z.string().max(10000),
  tipo: z.enum(TIPOS_POST),
  media_paths: z.array(z.string().min(1).max(500)).max(MAX_CARROSSEL),
  variaveis: z.record(z.string().max(60), z.string().max(5000)),
  data: z.string().max(10),
  hora: z.string().max(5),
  destinos: z.array(esquemaDestino).max(REDES.length),
});
export type DadosPost = z.infer<typeof esquemaPost>;

export function destinoVazio(rede: Rede): DadosDestino {
  return {
    rede,
    legenda_personalizada: null,
    rodape_personalizado: null,
    youtube_formato: "longo",
    linkedin_link_no_comentario: false,
    youtube_titulo: "",
    reddit_subreddit: "",
    reddit_titulo: "",
  };
}

// ---------------------------------------------------------------------
// Tipos de arquivo
// ---------------------------------------------------------------------

const EXT_VIDEO = ["mp4", "mov", "m4v", "webm"];
const EXT_IMAGEM = ["jpg", "jpeg", "png", "webp", "gif"];

export function extensao(caminho: string): string {
  return caminho.split(".").pop()?.toLowerCase() ?? "";
}
export function ehVideo(caminho: string): boolean {
  return EXT_VIDEO.includes(extensao(caminho));
}
export function ehImagem(caminho: string): boolean {
  return EXT_IMAGEM.includes(extensao(caminho));
}

export const ACCEPT_VIDEO = "video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm";
export const ACCEPT_IMAGEM = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

/** Normaliza "r/Direito" → "Direito". */
export function limparSubreddit(valor: string): string {
  return valor.trim().replace(/^\/?r\//i, "");
}

// ---------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------

export interface AnaliseRede {
  calculado: DestinoCalculado;
  tamanho: number;
  limite?: number;
  hashtags: number;
  maxHashtags: number;
  /** Bloqueiam o agendamento. */
  erros: string[];
  /** Não bloqueiam. */
  avisos: string[];
  /** Termos sensíveis (Provimento 205) — só avisam. */
  termos: AlertaTermo[];
}

export interface ResultadoValidacao {
  erros: string[];
  porRede: Partial<Record<Rede, AnaliseRede>>;
  ok: boolean;
}

export interface OpcoesValidacao {
  /** Exige data/hora no futuro (agendar). Falso para "Publicar agora". */
  exigirDataFutura: boolean;
  agora?: Date;
}

const ROTULO_VARIAVEL = (chave: string) => `{${chave}}`;

export function validarPost(
  config: ConfigConteudo,
  dados: DadosPost,
  opcoes: OpcoesValidacao,
): ResultadoValidacao {
  const erros: string[] = [];
  const porRede: Partial<Record<Rede, AnaliseRede>> = {};
  const qtdMidias = dados.media_paths.length;

  // Gerais -------------------------------------------------------------
  if (dados.destinos.length === 0) erros.push("Escolha pelo menos uma rede.");

  if (dados.tipo === "imagem" && qtdMidias > 1) {
    erros.push("Post do tipo imagem aceita só 1 arquivo. Para várias imagens, use carrossel.");
  }
  if (dados.tipo === "carrossel" && qtdMidias === 1) erros.push("Carrossel precisa de pelo menos 2 imagens.");
  if (dados.tipo === "video" && qtdMidias > 1) erros.push("Post de vídeo aceita só 1 arquivo.");

  if (dados.tipo === "video" && dados.media_paths.some((c) => !ehVideo(c))) {
    erros.push("Post de vídeo só aceita arquivos de vídeo (MP4, MOV, WEBM).");
  }
  if (dados.tipo !== "video" && dados.media_paths.some((c) => !ehImagem(c))) {
    erros.push("Posts de imagem e carrossel só aceitam imagens.");
  }

  if (opcoes.exigirDataFutura) {
    const iso = isoDeSP(dados.data, dados.hora);
    if (!iso) {
      erros.push("Escolha a data e a hora da publicação.");
    } else if (new Date(iso).getTime() < (opcoes.agora ?? new Date()).getTime() - 60_000) {
      erros.push("A data e a hora precisam estar no futuro (horário de Brasília).");
    }
  }

  // Por rede -----------------------------------------------------------
  for (const d of dados.destinos) {
    const cfg = CONFIG_REDES[d.rede];
    const modelo = modeloDaRede(config, d.rede, d.youtube_formato);
    const calculado = calcularDestino(config, dados, d);
    const texto = calculado.textoFinal;
    const tamanho = contarCaracteres(texto);
    const limite = limiteDaRede(config, d.rede, d.youtube_formato);
    const hashtags = hashtagsNoTexto(texto).length;
    const maxHashtags = maxHashtagsDaRede(config, d.rede, d.youtube_formato);
    const e: string[] = [];
    const a: string[] = [];

    if (!cfg.tiposAceitos.includes(dados.tipo)) e.push(`${cfg.nome} só aceita vídeo.`);
    if ((d.rede === "youtube" || d.rede === "tiktok") && qtdMidias === 0) e.push("Envie o vídeo.");

    if (d.rede === "instagram") {
      if (qtdMidias < 1) e.push("O Instagram precisa de pelo menos 1 mídia.");
      if (dados.tipo === "carrossel" && qtdMidias > MAX_CARROSSEL_INSTAGRAM) {
        e.push(`Carrossel no Instagram aceita até ${MAX_CARROSSEL_INSTAGRAM} itens.`);
      }
      if (dados.media_paths.some((c) => ehImagem(c) && !["jpg", "jpeg"].includes(extensao(c)))) {
        a.push("Pela API, o Instagram só aceita imagens JPEG. Prefira arquivos .jpg.");
      }
    }

    if (limite && tamanho > limite) {
      e.push(`Texto com ${tamanho.toLocaleString("pt-BR")} caracteres; o limite é ${limite.toLocaleString("pt-BR")}.`);
    }
    if (!cfg.textoOpcional && tamanho === 0) e.push("Escreva a legenda.");

    if (hashtags > maxHashtags) {
      e.push(
        maxHashtags === 0
          ? "Esta rede não pode ter hashtags no texto."
          : `O texto tem ${hashtags} hashtags (contando as da legenda). O máximo aqui é ${maxHashtags}.`,
      );
    }

    for (const problema of verificarProibicoes(texto, modelo.proibido_no_texto ?? [])) {
      if (!e.includes(problema)) e.push(problema);
    }

    if (d.rede === "youtube") {
      const t = d.youtube_titulo.trim();
      if (!t) e.push("Escreva o título do vídeo.");
      if (contarCaracteres(t) > LIMITE_TITULO_YOUTUBE) e.push(`O título passa de ${LIMITE_TITULO_YOUTUBE} caracteres.`);
    }

    if (d.rede === "reddit") {
      const sub = limparSubreddit(d.reddit_subreddit);
      if (!sub) e.push("Informe o subreddit.");
      else if (!/^[A-Za-z0-9_]{2,21}$/.test(sub)) e.push("Subreddit inválido. Use só o nome, ex.: direito");
      const t = d.reddit_titulo.trim();
      if (!t) e.push("Escreva o título do post no Reddit.");
      if (contarCaracteres(t) > LIMITE_TITULO_REDDIT) e.push(`O título passa de ${LIMITE_TITULO_REDDIT} caracteres.`);
    }

    if (d.rede === "google_business") {
      if (dados.tipo !== "imagem") a.push("O Google funciona melhor com 1 imagem. Vídeo/carrossel podem falhar no Make.");
      if (modelo.botao && !calculado.botao) a.push("Sem {link_artigo}, o post vai sem o botão “Saiba mais”.");
    }

    if (d.rede === "linkedin" && d.linkedin_link_no_comentario && !calculado.comentario) {
      a.push("Link no comentário ligado, mas {link_artigo} está vazio.");
    }

    const vazias = calculado.vazias.filter((v) => v !== "capitulos");
    if (vazias.length > 0) {
      a.push(`Variáveis vazias (as linhas delas foram omitidas): ${vazias.map(ROTULO_VARIAVEL).join(", ")}.`);
    }

    porRede[d.rede] = {
      calculado,
      tamanho,
      limite,
      hashtags,
      maxHashtags,
      erros: e,
      avisos: a,
      termos: checarTermos(config, [texto, d.youtube_titulo, d.reddit_titulo].join("\n")),
    };
  }

  const ok = erros.length === 0 && Object.values(porRede).every((r) => !r || r.erros.length === 0);
  return { erros, porRede, ok };
}
