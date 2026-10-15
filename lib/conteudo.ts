import { z } from "zod";
import padrao from "./config-padrao.json";
import { juntarTexto, renderizarModelo } from "./composicao";
import { CONFIG_REDES } from "./redes";
import type { Rede } from "./tipos";

// ---------------------------------------------------------------------
// Formato do JSON de configuração de conteúdo (editável em Ajustes)
// ---------------------------------------------------------------------

const esquemaModeloRede = z.looseObject({
  limite_caracteres: z.number().int().positive().optional(),
  max_hashtags: z.number().int().min(0).optional(),
  rodape: z.string().default(""),
  texto_alternativo: z.string().optional(),
  tipo_post: z.string().optional(),
  botao: z.object({ tipo: z.string(), url: z.string() }).optional(),
  proibido_no_texto: z.array(z.string()).optional(),
  variante_link_no_comentario: z
    .object({ trocar_linha: z.string(), por: z.string(), comentario: z.string() })
    .optional(),
});
export type ModeloRede = z.infer<typeof esquemaModeloRede>;

export const esquemaConfigConteudo = z.looseObject({
  versao: z.string().default(""),
  variaveis: z.record(z.string(), z.string()).default({}),
  fixos: z.record(z.string(), z.string()).default({}),
  redes: z.record(z.string(), esquemaModeloRede).default({}),
  checagem_termos: z
    .object({
      acao_recomendada: z.string().optional(),
      termos: z.array(z.object({ padroes: z.array(z.string()), motivo: z.string() })).default([]),
    })
    .default({ termos: [] }),
});
export type ConfigConteudo = z.infer<typeof esquemaConfigConteudo>;

export const CONFIG_PADRAO: ConfigConteudo = esquemaConfigConteudo.parse(padrao);

/** Lê o JSON salvo no banco; se estiver inválido, usa o padrão. */
export function lerConfig(dados: unknown): ConfigConteudo {
  const r = esquemaConfigConteudo.safeParse(dados);
  return r.success ? r.data : CONFIG_PADRAO;
}

// ---------------------------------------------------------------------
// Variáveis
// ---------------------------------------------------------------------

/** Variáveis extras que não estão na lista do JSON, mas aparecem em modelos. */
const DESCRICOES_EXTRAS: Record<string, string> = {
  descricao_imagem: "Descrição da imagem, para o texto alternativo (acessibilidade) do Instagram.",
};

/** Valor usado quando a variável fica em branco. */
export const VALORES_PADRAO: Record<string, string> = {
  hashtag_jogo: "games",
};

export interface VariavelPost {
  chave: string;
  descricao: string;
  multilinha: boolean;
}

/** Lista as variáveis que o formulário do post deve pedir. */
export function variaveisDoPost(config: ConfigConteudo): VariavelPost[] {
  const chaves = new Set(Object.keys(config.variaveis));
  const textos = Object.values(config.redes).flatMap((m) => [
    m.rodape,
    m.texto_alternativo ?? "",
    m.botao?.url ?? "",
    m.variante_link_no_comentario?.comentario ?? "",
  ]);
  for (const t of textos) {
    for (const [, chave] of t.matchAll(/\{(\w+)\}/g)) {
      if (!(chave in config.fixos)) chaves.add(chave);
    }
  }
  return [...chaves].map((chave) => ({
    chave,
    descricao: config.variaveis[chave] ?? DESCRICOES_EXTRAS[chave] ?? "",
    multilinha: chave === "capitulos" || chave === "fonte_legal",
  }));
}

function valoresParaModelo(config: ConfigConteudo, variaveis: Record<string, string>) {
  const valores: Record<string, string> = { ...config.fixos };
  for (const [chave, valor] of Object.entries(variaveis)) valores[chave] = valor;
  for (const [chave, padraoValor] of Object.entries(VALORES_PADRAO)) {
    if (!valores[chave]?.trim()) valores[chave] = padraoValor;
  }
  return valores;
}

// ---------------------------------------------------------------------
// Modelo de cada rede
// ---------------------------------------------------------------------

export type FormatoYoutube = "longo" | "shorts";

const CHAVES_JSON: Partial<Record<Rede, string[]>> = {
  google_business: ["google_perfil_empresa", "google_business", "google"],
};

export function chaveModelo(rede: Rede, formatoYoutube: FormatoYoutube): string[] {
  if (rede === "youtube") return [`youtube_${formatoYoutube}`, "youtube"];
  return CHAVES_JSON[rede] ?? [rede];
}

export function modeloDaRede(config: ConfigConteudo, rede: Rede, formatoYoutube: FormatoYoutube = "longo"): ModeloRede {
  for (const chave of chaveModelo(rede, formatoYoutube)) {
    const m = config.redes[chave];
    if (m) return m;
  }
  return { rodape: "" };
}

export function limiteDaRede(config: ConfigConteudo, rede: Rede, formato: FormatoYoutube): number | undefined {
  return modeloDaRede(config, rede, formato).limite_caracteres ?? CONFIG_REDES[rede].limiteTexto;
}

export function maxHashtagsDaRede(config: ConfigConteudo, rede: Rede, formato: FormatoYoutube): number {
  return modeloDaRede(config, rede, formato).max_hashtags ?? 5;
}

// ---------------------------------------------------------------------
// Montagem do texto final de um destino
// ---------------------------------------------------------------------

export interface EntradaDestino {
  rede: Rede;
  legenda_personalizada: string | null;
  rodape_personalizado: string | null;
  youtube_formato: FormatoYoutube;
  linkedin_link_no_comentario: boolean;
}

export interface DestinoCalculado {
  /** Rodapé gerado pelo modelo (antes de qualquer edição manual). */
  rodapeAutomatico: string;
  /** Rodapé efetivamente usado. */
  rodape: string;
  textoFinal: string;
  textoAlternativo: string | null;
  comentario: string | null;
  botao: { tipo: string; url: string } | null;
  tipoPostGoogle: string | null;
  /** Variáveis vazias que fizeram linhas sumirem. */
  vazias: string[];
}

export function calcularDestino(
  config: ConfigConteudo,
  post: { legenda_base: string; variaveis: Record<string, string> },
  d: EntradaDestino,
): DestinoCalculado {
  const modelo = modeloDaRede(config, d.rede, d.youtube_formato);
  const valores = valoresParaModelo(config, post.variaveis);

  let textoModelo = modelo.rodape;
  let comentario: string | null = null;
  const variante = modelo.variante_link_no_comentario;
  if (d.rede === "linkedin" && d.linkedin_link_no_comentario && variante) {
    textoModelo = textoModelo.replace(variante.trocar_linha, variante.por);
    comentario = renderizarModelo(variante.comentario, valores).texto || null;
  }

  const rodapeAuto = renderizarModelo(textoModelo, valores);
  const rodape = d.rodape_personalizado ?? rodapeAuto.texto;
  const legenda = d.legenda_personalizada ?? post.legenda_base;

  const alt = modelo.texto_alternativo ? renderizarModelo(modelo.texto_alternativo, valores).texto : "";
  const urlBotao = modelo.botao ? renderizarModelo(modelo.botao.url, valores).texto : "";

  return {
    rodapeAutomatico: rodapeAuto.texto,
    rodape,
    textoFinal: juntarTexto(legenda, rodape),
    textoAlternativo: alt || null,
    comentario,
    botao: modelo.botao && urlBotao ? { tipo: modelo.botao.tipo, url: urlBotao } : null,
    tipoPostGoogle: modelo.tipo_post ?? null,
    vazias: d.rodape_personalizado === null ? rodapeAuto.vazias : [],
  };
}

// ---------------------------------------------------------------------
// Checagem de termos (Provimento 205) — só avisa, não bloqueia
// ---------------------------------------------------------------------

export interface AlertaTermo {
  trecho: string;
  motivo: string;
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function checarTermos(config: ConfigConteudo, texto: string): AlertaTermo[] {
  const alertas: AlertaTermo[] = [];
  const vistos = new Set<string>();
  for (const { padroes, motivo } of config.checagem_termos.termos) {
    for (const padraoTermo of padroes) {
      if (!padraoTermo.trim()) continue;
      // Padrões que começam com letra precisam começar uma palavra
      // ("a melhor" não deve casar com "para melhorar").
      const inicio = /^[\p{L}\p{N}]/u.test(padraoTermo) ? "(?<![\\p{L}\\p{N}])" : "";
      const regex = new RegExp(`${inicio}${escaparRegex(padraoTermo)}[\\p{L}]*`, "giu");
      for (const achado of texto.matchAll(regex)) {
        const chave = `${achado[0].toLocaleLowerCase("pt-BR")}|${motivo}`;
        if (!vistos.has(chave)) {
          vistos.add(chave);
          alertas.push({ trecho: achado[0], motivo });
        }
      }
    }
  }
  return alertas;
}
