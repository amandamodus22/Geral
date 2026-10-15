/** Conta caracteres como as redes contam (emoji = 1). */
export function contarCaracteres(texto: string): number {
  return Array.from(texto).length;
}

/** Hashtags encontradas num texto (inclusive as digitadas na legenda). */
export function hashtagsNoTexto(texto: string): string[] {
  const achadas = texto.match(/(?:^|[\s(])#[\p{L}\p{N}_]+/gu) ?? [];
  return achadas.map((h) => h.trim().replace(/^\(/, ""));
}

/** "Conta Banida!" → "contabanida" (sem acento, sem espaço, minúsculas). */
export function normalizarHashtag(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .toLowerCase();
}

export interface ResultadoModelo {
  texto: string;
  /** Variáveis usadas no modelo que estavam vazias (linhas omitidas). */
  vazias: string[];
}

const VARIAVEL = /\{(\w+)\}/g;

/**
 * Preenche um modelo de rodapé:
 *  - `#{variavel}` vira hashtag normalizada; se vazia, some (só ela).
 *  - Linha com alguma `{variavel}` vazia é omitida.
 *  - Bloco que perdeu linhas e ficou só com título ("Capítulos:") é omitido.
 */
export function renderizarModelo(modelo: string, valores: Record<string, string>): ResultadoModelo {
  const vazias = new Set<string>();
  const valor = (chave: string) => (valores[chave] ?? "").trim();

  const comHashtags = modelo.replace(/#\{(\w+)\}/g, (_original, chave: string) => {
    const h = normalizarHashtag(valor(chave));
    if (!h) vazias.add(chave);
    return h ? `#${h}` : "";
  });

  const blocos = comHashtags.split(/\n[ \t]*\n/).flatMap((bloco) => {
    let perdeuLinha = false;
    const linhas = bloco.split("\n").flatMap((linha) => {
      let faltou = false;
      const preenchida = linha.replace(VARIAVEL, (_original, chave: string) => {
        const v = valor(chave);
        if (!v) {
          faltou = true;
          vazias.add(chave);
        }
        return v;
      });
      if (faltou) {
        perdeuLinha = true;
        return [];
      }
      const limpa = preenchida.replace(/[ \t]{2,}/g, " ").trim();
      // Linha que só tinha hashtags vazias.
      if (!limpa.trim() && linha.trim()) return [];
      return [limpa];
    });
    const comConteudo = linhas.filter((l) => l.trim());
    if (comConteudo.length === 0) return [];
    if (perdeuLinha && comConteudo.every((l) => l.trim().endsWith(":"))) return [];
    return [linhas.join("\n").trim()];
  });

  return { texto: blocos.join("\n\n").trim(), vazias: [...vazias] };
}

/** Legenda + rodapé, separados por uma linha em branco. */
export function juntarTexto(legenda: string, rodape: string): string {
  return [legenda.trim(), rodape.trim()].filter(Boolean).join("\n\n");
}

const REGEX_URL = /\bhttps?:\/\/\S+|\bwww\.\S+|\b[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)*\.(com|br|net|org|adv|io|me|app|link|ly)(\.br)?\b(\/\S*)?/iu;
const REGEX_TELEFONE = /(\+?55[\s-]?)?\(?\b\d{2}\)?[\s-]?9?\d{4}[\s.-]?\d{4}\b/;

/** Verifica as proibições de texto (ex.: Google: telefone, URL, hashtags). */
export function verificarProibicoes(texto: string, proibicoes: string[]): string[] {
  const problemas: string[] = [];
  for (const p of proibicoes.map((x) => x.toLowerCase())) {
    if (p === "telefone" && REGEX_TELEFONE.test(texto)) problemas.push("O texto não pode ter telefone.");
    if (p === "url" && REGEX_URL.test(texto)) problemas.push("O texto não pode ter link/URL (use o botão).");
    if (p === "hashtags" && hashtagsNoTexto(texto).length > 0) problemas.push("O texto não pode ter hashtags.");
  }
  return problemas;
}
