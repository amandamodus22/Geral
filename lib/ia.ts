"use server";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { exigirDona } from "./auth";
import { normalizarHashtag } from "./composicao";
import { buscarConfig, urlsAssinadas } from "./dados";
import { CONFIG_REDES, LIMITE_TITULO_REDDIT, LIMITE_TITULO_YOUTUBE } from "./redes";
import { REDES, TIPOS_POST } from "./tipos";
import { ehImagem } from "./validacao";

const MODELO = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

const esquemaEntrada = z.object({
  id: z.uuid(),
  titulo_interno: z.string().max(200),
  legenda_base: z.string().max(10000),
  tipo: z.enum(TIPOS_POST),
  media_paths: z.array(z.string()).max(20),
  redes: z.array(z.enum(REDES)),
});

const esquemaSugestao = z.object({
  palavra_chave: z.string().describe("O problema nas palavras do público, curto (até ~8 palavras)."),
  hashtag_tema: z.string().describe("Problema em hashtag, sem #, sem acento, sem espaço, minúsculas."),
  hashtag_jogo: z.string().describe("Jogo ou plataforma sem #, sem acento, sem espaço; 'games' se não houver."),
  descricao_imagem: z.string().describe("Descrição objetiva da imagem para acessibilidade; vazio se não houver imagem."),
  youtube_titulo: z.string().describe("Título para YouTube, até 100 caracteres; vazio se não for vídeo."),
  reddit_titulo: z.string().describe("Título para Reddit, informativo, até 300 caracteres."),
  observacoes: z.string().describe("Até 2 frases com alertas úteis (ex.: lembrar de preencher a fonte legal)."),
});
export type SugestaoIA = z.infer<typeof esquemaSugestao>;

export interface ResultadoIA {
  ok: boolean;
  sugestao?: SugestaoIA;
  mensagem?: string;
}

function montarInstrucoes(identidade: string, termos: string[]): string {
  return `Você ajuda a advogada brasileira descrita abaixo a otimizar posts de redes sociais para SEO (busca nas plataformas e no Google) e GEO (ser citada por buscadores com IA, como ChatGPT, Perplexity e Google AI Overviews).

Quem publica: ${identidade}

A partir do texto do post, sugira os campos pedidos no formato estruturado.

Regras:
- palavra_chave: o problema como o público digitaria na busca (ex.: "Conta banida no Free Fire"). Linguagem simples, sem juridiquês.
- hashtag_tema: a hashtag mais buscada e específica para o problema (ex.: contabanida). Prefira termos que pessoas realmente usam a termos técnicos.
- hashtag_jogo: o jogo ou plataforma citada (ex.: freefire). Se nenhuma for citada, use "games".
- youtube_titulo: comece pela palavra-chave, seja claro e informativo, sem caixa alta excessiva e sem clickbait.
- reddit_titulo: pergunta ou afirmação informativa, sem tom de propaganda.
- descricao_imagem: só se houver imagem anexada; descreva o que se vê, em uma frase, sem "imagem de".
- Não invente leis, artigos, números de processo nem links: isso é preenchido pela advogada.
- Respeite o Provimento 205/2021 da OAB: tom informativo e sóbrio, sem promessa de resultado, sem autopromoção, sem mencionar gratuidade ou valores, sem estimular litígio. Nunca use estes termos: ${termos.join(", ")}.
- Tudo em português do Brasil.`;
}

export async function sugerirComIA(entrada: unknown): Promise<ResultadoIA> {
  const { supabase } = await exigirDona();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, mensagem: "Configure a variável ANTHROPIC_API_KEY para usar a sugestão por IA." };
  }

  const analise = esquemaEntrada.safeParse(entrada);
  if (!analise.success) return { ok: false, mensagem: "Dados inválidos." };
  const dados = analise.data;
  if (!dados.legenda_base.trim() && !dados.titulo_interno.trim()) {
    return { ok: false, mensagem: "Escreva a legenda base primeiro." };
  }

  const config = await buscarConfig(supabase);
  const identidade = config.fixos.identidade_longa ?? "";
  const termos = config.checagem_termos.termos.flatMap((t) => t.padroes);

  const texto = [
    `Título interno: ${dados.titulo_interno || "(sem título)"}`,
    `Tipo de post: ${dados.tipo}`,
    `Redes: ${dados.redes.map((r) => CONFIG_REDES[r].nome).join(", ") || "(nenhuma escolhida)"}`,
    "",
    "Legenda base:",
    dados.legenda_base,
  ].join("\n");

  // Primeira imagem do post (se houver), para a descrição acessível.
  const imagem = dados.tipo !== "video" ? dados.media_paths.find((c) => c.startsWith(`${dados.id}/`) && ehImagem(c)) : undefined;
  const urlImagem = imagem ? (await urlsAssinadas(supabase, [imagem], 600))[imagem] : undefined;

  const client = new Anthropic();

  async function pedir(comImagem: boolean) {
    const conteudo: Anthropic.Beta.BetaContentBlockParam[] = [];
    if (comImagem && urlImagem) conteudo.push({ type: "image", source: { type: "url", url: urlImagem } });
    conteudo.push({ type: "text", text: texto });

    return client.beta.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(esquemaSugestao) },
      system: montarInstrucoes(identidade, termos),
      messages: [{ role: "user", content: conteudo }],
    });
  }

  try {
    let resposta;
    try {
      resposta = await pedir(true);
    } catch (erro) {
      // Se a imagem não puder ser lida, tenta só com o texto.
      if (urlImagem && erro instanceof Anthropic.BadRequestError) resposta = await pedir(false);
      else throw erro;
    }

    if (resposta.stop_reason === "refusal") {
      return { ok: false, mensagem: "A IA não conseguiu sugerir para este texto. Preencha manualmente." };
    }
    const s = resposta.parsed_output;
    if (!s) return { ok: false, mensagem: "A IA respondeu num formato inesperado. Tente de novo." };

    return {
      ok: true,
      sugestao: {
        ...s,
        hashtag_tema: normalizarHashtag(s.hashtag_tema),
        hashtag_jogo: normalizarHashtag(s.hashtag_jogo) || "games",
        descricao_imagem: urlImagem ? s.descricao_imagem.trim() : "",
        youtube_titulo: Array.from(s.youtube_titulo.trim()).slice(0, LIMITE_TITULO_YOUTUBE).join(""),
        reddit_titulo: Array.from(s.reddit_titulo.trim()).slice(0, LIMITE_TITULO_REDDIT).join(""),
      },
    };
  } catch (erro) {
    if (erro instanceof Anthropic.AuthenticationError) {
      return { ok: false, mensagem: "A chave ANTHROPIC_API_KEY é inválida." };
    }
    if (erro instanceof Anthropic.RateLimitError) {
      return { ok: false, mensagem: "Muitas sugestões em pouco tempo. Aguarde um minuto." };
    }
    if (erro instanceof Anthropic.APIError) {
      return { ok: false, mensagem: `Erro da IA (${erro.status ?? "rede"}): ${erro.message}` };
    }
    return { ok: false, mensagem: "Não consegui falar com a IA. Tente de novo." };
  }
}
