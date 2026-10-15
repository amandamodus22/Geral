import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizarHashtag, renderizarModelo, verificarProibicoes } from "../lib/composicao";
import { calcularDestino, checarTermos, CONFIG_PADRAO } from "../lib/conteudo";
import { destinoVazio, validarPost, type DadosPost } from "../lib/validacao";

const variaveis = {
  palavra_chave: "Conta banida no Free Fire",
  fonte_legal: "CDC, art. 6º, III; STJ, REsp 2.123.587",
  link_artigo: "https://modusadvocacia.com.br/conta-banida",
  hashtag_tema: "Conta Banida",
  hashtag_jogo: "",
  capitulos: "",
};
const post = { legenda_base: "Sua conta foi banida sem explicação?", variaveis };

test("hashtag é normalizada e hashtag_jogo vazia vira #games", () => {
  assert.equal(normalizarHashtag("Conta Banida!"), "contabanida");
  const r = calcularDestino(CONFIG_PADRAO, post, destinoVazio("instagram"));
  assert.match(r.textoFinal, /#contabanida #games #direitogamer #direitodigital #amandamodus$/);
  assert.ok(r.textoFinal.startsWith("Sua conta foi banida sem explicação?\n\n—\n📌 Conta banida no Free Fire:"));
});

test("bloco 'Capítulos:' some quando capitulos está vazio", () => {
  const r = calcularDestino(CONFIG_PADRAO, post, { ...destinoVazio("youtube"), youtube_formato: "longo" });
  assert.ok(!r.textoFinal.includes("Capítulos"));
  assert.ok(r.textoFinal.includes("Base legal citada no vídeo:\nCDC, art. 6º, III"));
  const com = calcularDestino(
    CONFIG_PADRAO,
    { ...post, variaveis: { ...variaveis, capitulos: "00:00 Introdução\n01:20 O que diz o CDC" } },
    { ...destinoVazio("youtube"), youtube_formato: "longo" },
  );
  assert.ok(com.textoFinal.includes("Capítulos:\n00:00 Introdução\n01:20 O que diz o CDC"));
});

test("linha com variável vazia é omitida e reportada", () => {
  const r = renderizarModelo("A: {x}\nB: {y}\n#{h} #fixa", { x: "1", y: "", h: "" });
  assert.equal(r.texto, "A: 1\n#fixa");
  assert.deepEqual(r.vazias.sort(), ["h", "y"]);
});

test("LinkedIn com link no comentário", () => {
  const r = calcularDestino(CONFIG_PADRAO, post, { ...destinoVazio("linkedin"), linkedin_link_no_comentario: true });
  assert.ok(r.textoFinal.includes("Link do guia completo no primeiro comentário."));
  assert.ok(!r.textoFinal.includes("https://"));
  assert.equal(r.comentario, variaveis.link_artigo);
});

test("Google: botão, tipo de post e proibições", () => {
  const r = calcularDestino(CONFIG_PADRAO, post, destinoVazio("google_business"));
  assert.deepEqual(r.botao, { tipo: "Saiba mais", url: variaveis.link_artigo });
  assert.equal(r.tipoPostGoogle, "Novidade");
  assert.deepEqual(verificarProibicoes(r.textoFinal, ["telefone", "URL", "hashtags"]), []);
  assert.equal(verificarProibicoes("Ligue (41) 99999-1234", ["telefone"]).length, 1);
  assert.equal(verificarProibicoes("veja modusadvocacia.com.br", ["URL"]).length, 1);
  assert.equal(verificarProibicoes("texto #tag", ["hashtags"]).length, 1);
});

test("Instagram: texto alternativo", () => {
  const sem = calcularDestino(CONFIG_PADRAO, post, destinoVazio("instagram"));
  assert.equal(sem.textoAlternativo, null);
  const com = calcularDestino(
    CONFIG_PADRAO,
    { ...post, variaveis: { ...variaveis, descricao_imagem: "Celular com aviso de conta banida" } },
    destinoVazio("instagram"),
  );
  assert.equal(com.textoAlternativo, "Celular com aviso de conta banida. Post de Amanda Modus, advogada, sobre Conta banida no Free Fire.");
});

test("checagem de termos do Provimento 205", () => {
  const alertas = checarTermos(CONFIG_PADRAO, "Sou especialista, consulta grátis, 90% dos casos revertemos. Para melhorar.");
  const trechos = alertas.map((a) => a.trecho.toLowerCase());
  assert.ok(trechos.includes("especialista"));
  assert.ok(trechos.includes("grátis"));
  assert.ok(trechos.includes("% dos casos"));
  assert.ok(trechos.includes("revertemos"));
  assert.ok(!trechos.some((t) => t.includes("melhor")), "'para melhorar' não é 'a melhor'");
});

test("validação: limites de hashtags, YouTube só vídeo, Reddit obrigatório", () => {
  const base: DadosPost = {
    id: "8b1f4d0e-3a8b-4c39-9a0e-1f2a3b4c5d6e",
    titulo_interno: "Teste",
    legenda_base: "Legenda #extra",
    tipo: "imagem",
    media_paths: ["a/b.jpg"],
    variaveis,
    data: "2099-01-01",
    hora: "10:00",
    destinos: [destinoVazio("instagram"), destinoVazio("youtube"), destinoVazio("reddit"), destinoVazio("google_business")],
  };
  const r = validarPost(CONFIG_PADRAO, base, { exigirDataFutura: true });
  assert.equal(r.ok, false);
  assert.ok(r.porRede.instagram!.erros.some((e) => e.includes("6 hashtags")));
  assert.ok(r.porRede.youtube!.erros.some((e) => e.includes("só aceita vídeo")));
  assert.ok(r.porRede.reddit!.erros.some((e) => e.includes("subreddit")));
  assert.ok(r.porRede.google_business!.erros.some((e) => e.includes("hashtags")));

  const ok = validarPost(
    CONFIG_PADRAO,
    { ...base, legenda_base: "Legenda", destinos: [destinoVazio("instagram")] },
    { exigirDataFutura: true },
  );
  assert.equal(ok.ok, true, JSON.stringify(ok.porRede.instagram?.erros));
});
