"use client";

import { AlertTriangle, CalendarClock, Loader2, Save, Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { salvarPost, type AcaoSalvar } from "@/lib/acoes";
import { contarCaracteres } from "@/lib/composicao";
import { variaveisDoPost, type ConfigConteudo } from "@/lib/conteudo";
import { sugerirComIA } from "@/lib/ia";
import { CONFIG_REDES, LIMITE_TITULO_REDDIT, LIMITE_TITULO_YOUTUBE, NOMES_TIPO } from "@/lib/redes";
import { REDES, TIPOS_POST, type Rede } from "@/lib/tipos";
import { destinoVazio, validarPost, type DadosDestino, type DadosPost } from "@/lib/validacao";
import { PreviaRede } from "./PreviaRede";
import { UploadMidias } from "./UploadMidias";

interface Props {
  inicial: DadosPost;
  config: ConfigConteudo;
  urlsIniciais: Record<string, string>;
}

function Contador({ atual, limite }: { atual: number; limite?: number }) {
  const passou = limite !== undefined && atual > limite;
  return (
    <span className={`text-xs tabular-nums ${passou ? "font-semibold text-red-700" : "text-zinc-500"}`}>
      {atual.toLocaleString("pt-BR")}
      {limite !== undefined && ` / ${limite.toLocaleString("pt-BR")}`}
    </span>
  );
}

function ListaMensagens({ itens, tipo }: { itens: string[]; tipo: "erro" | "aviso" }) {
  if (itens.length === 0) return null;
  const cor = tipo === "erro" ? "border-red-300 bg-red-50 text-red-900" : "border-amber-300 bg-amber-50 text-amber-900";
  return (
    <ul className={`space-y-1 rounded-lg border p-3 text-sm ${cor}`}>
      {itens.map((m) => (
        <li key={m}>{tipo === "erro" ? "⛔" : "⚠️"} {m}</li>
      ))}
    </ul>
  );
}

export function FormularioPost({ inicial, config, urlsIniciais }: Props) {
  const router = useRouter();
  const [dados, setDados] = useState<DadosPost>(inicial);
  const [urls, setUrls] = useState(urlsIniciais);
  const [aba, setAba] = useState<Rede | null>(inicial.destinos[0]?.rede ?? null);
  const [errosServidor, setErrosServidor] = useState<string[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvando, iniciarSalvar] = useTransition();
  const [pensando, iniciarIA] = useTransition();

  const variaveis = useMemo(() => variaveisDoPost(config), [config]);
  const validacao = useMemo(() => validarPost(config, dados, { exigirDataFutura: true }), [config, dados]);
  const nomeConta = (config.fixos.identidade_curta ?? "Escritório").split("·")[0].trim();

  const alterar = <K extends keyof DadosPost>(chave: K, valor: DadosPost[K]) =>
    setDados((d) => ({ ...d, [chave]: valor }));

  const alterarVariavel = (chave: string, valor: string) =>
    setDados((d) => ({ ...d, variaveis: { ...d.variaveis, [chave]: valor } }));

  const alterarDestino = (rede: Rede, parcial: Partial<DadosDestino>) =>
    setDados((d) => ({
      ...d,
      destinos: d.destinos.map((x) => (x.rede === rede ? { ...x, ...parcial } : x)),
    }));

  function alternarRede(rede: Rede) {
    setDados((d) => {
      const tem = d.destinos.some((x) => x.rede === rede);
      const destinos = tem
        ? d.destinos.filter((x) => x.rede !== rede)
        : REDES.filter((r) => r === rede || d.destinos.some((x) => x.rede === r)).map(
            (r) => d.destinos.find((x) => x.rede === r) ?? destinoVazio(r),
          );
      if (tem && aba === rede) setAba(destinos[0]?.rede ?? null);
      if (!tem) setAba(rede);
      return { ...d, destinos };
    });
  }

  function mudarTipo(tipo: DadosPost["tipo"]) {
    if (tipo === dados.tipo) return;
    const temMidia = dados.media_paths.length > 0;
    if (temMidia && !window.confirm("Mudar o tipo remove as mídias já escolhidas. Continuar?")) return;
    setDados((d) => ({ ...d, tipo, media_paths: [] }));
  }

  function sugerir() {
    setMensagem(null);
    iniciarIA(async () => {
      const r = await sugerirComIA({
        id: dados.id,
        titulo_interno: dados.titulo_interno,
        legenda_base: dados.legenda_base,
        tipo: dados.tipo,
        media_paths: dados.media_paths,
        redes: dados.destinos.map((d) => d.rede),
      });
      if (!r.ok || !r.sugestao) {
        setMensagem(r.mensagem ?? "Não foi possível sugerir agora.");
        return;
      }
      const s = r.sugestao;
      setDados((d) => ({
        ...d,
        variaveis: {
          ...d.variaveis,
          palavra_chave: s.palavra_chave,
          hashtag_tema: s.hashtag_tema,
          hashtag_jogo: s.hashtag_jogo,
          ...(s.descricao_imagem ? { descricao_imagem: s.descricao_imagem } : {}),
        },
        destinos: d.destinos.map((x) => ({
          ...x,
          youtube_titulo: x.rede === "youtube" && !x.youtube_titulo.trim() ? s.youtube_titulo : x.youtube_titulo,
          reddit_titulo: x.rede === "reddit" && !x.reddit_titulo.trim() ? s.reddit_titulo : x.reddit_titulo,
        })),
      }));
      setMensagem(`✨ Sugestões aplicadas. Revise antes de agendar.${s.observacoes ? ` ${s.observacoes}` : ""}`);
    });
  }

  function salvar(acao: AcaoSalvar) {
    setErrosServidor([]);
    setMensagem(null);
    if (acao === "publicar_agora" && !window.confirm("Publicar agora em todas as redes escolhidas?")) return;
    iniciarSalvar(async () => {
      const r = await salvarPost(dados, acao);
      if (!r.ok) {
        setErrosServidor(r.erros ?? [r.mensagem ?? "Erro ao salvar."]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (r.mensagem) window.alert(r.mensagem);
      router.push(`/posts/${r.id}`);
      router.refresh();
    });
  }

  const destinoAtual = dados.destinos.find((d) => d.rede === aba);
  const analiseAtual = aba ? validacao.porRede[aba] : undefined;
  const midiasPrevia = dados.media_paths.map((c) => ({ caminho: c, url: urls[c] }));
  const errosParaAgendar = [
    ...validacao.erros,
    ...Object.entries(validacao.porRede).flatMap(([r, a]) =>
      (a?.erros ?? []).map((e) => `${CONFIG_REDES[r as Rede].nome}: ${e}`),
    ),
  ];

  return (
    <div className="space-y-4 pb-28">
      <ListaMensagens itens={errosServidor} tipo="erro" />

      {/* Título e tipo ------------------------------------------------ */}
      <section className="cartao space-y-4">
        <label className="block">
          <span className="rotulo">Título interno (só você vê)</span>
          <input
            className="campo"
            value={dados.titulo_interno}
            maxLength={200}
            placeholder="Ex.: Conta banida no Free Fire — carrossel"
            onChange={(e) => alterar("titulo_interno", e.target.value)}
          />
        </label>
        <div>
          <span className="rotulo">Tipo de post</span>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS_POST.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => mudarTipo(t)}
                className={`botao border ${dados.tipo === t ? "border-marca-600 bg-marca-50 text-marca-700" : "border-zinc-300 bg-white text-zinc-700"}`}
              >
                {NOMES_TIPO[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="rotulo">Mídias</span>
          <UploadMidias
            postId={dados.id}
            tipo={dados.tipo}
            caminhos={dados.media_paths}
            urls={urls}
            aoMudar={(c) => alterar("media_paths", c)}
            aoMudarUrls={setUrls}
          />
        </div>
      </section>

      {/* Legenda base ------------------------------------------------- */}
      <section className="cartao space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="rotulo">Legenda base</span>
          <Contador atual={contarCaracteres(dados.legenda_base)} />
        </div>
        <textarea
          className="campo min-h-40"
          value={dados.legenda_base}
          placeholder="Escreva o texto principal. Cada rede pode ter a sua versão nas abas abaixo."
          onChange={(e) => alterar("legenda_base", e.target.value)}
        />
        <p className="text-xs text-zinc-500">
          O rodapé de cada rede (identidade, base legal, aviso e hashtags) é acrescentado automaticamente.
        </p>
      </section>

      {/* Variáveis ---------------------------------------------------- */}
      <section className="cartao space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Dados do rodapé (SEO/GEO)</h2>
          <button type="button" onClick={sugerir} className="botao-secundario" disabled={pensando}>
            {pensando ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-marca-600" />}
            {pensando ? "Pensando…" : "Sugerir com IA"}
          </button>
        </div>
        {mensagem && <p className="rounded-lg bg-marca-50 p-3 text-sm text-marca-700">{mensagem}</p>}
        {variaveis.map((v) => (
          <label key={v.chave} className="block">
            <span className="rotulo">
              <code className="text-marca-700">{`{${v.chave}}`}</code>
            </span>
            {v.multilinha ? (
              <textarea
                className="campo min-h-20"
                value={dados.variaveis[v.chave] ?? ""}
                onChange={(e) => alterarVariavel(v.chave, e.target.value)}
              />
            ) : (
              <input
                className="campo"
                value={dados.variaveis[v.chave] ?? ""}
                inputMode={v.chave.startsWith("link") ? "url" : undefined}
                onChange={(e) => alterarVariavel(v.chave, e.target.value)}
              />
            )}
            {v.descricao && <span className="mt-1 block text-xs text-zinc-500">{v.descricao}</span>}
          </label>
        ))}
      </section>

      {/* Redes -------------------------------------------------------- */}
      <section className="cartao space-y-3">
        <h2 className="font-semibold">Redes</h2>
        <div className="flex flex-wrap gap-2">
          {REDES.map((r) => {
            const marcada = dados.destinos.some((d) => d.rede === r);
            const cfg = CONFIG_REDES[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => alternarRede(r)}
                aria-pressed={marcada}
                className={`botao min-h-10 border ${marcada ? cfg.cor : "border-zinc-300 bg-white text-zinc-500"}`}
              >
                {marcada ? "✓ " : ""}
                {cfg.nome}
                {cfg.manual && <span className="text-[10px] font-normal">(manual)</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Abas por rede ------------------------------------------------ */}
      {dados.destinos.length > 0 && (
        <section className="cartao space-y-4 p-0">
          <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 px-2 pt-2">
            {dados.destinos.map((d) => {
              const temErro = (validacao.porRede[d.rede]?.erros.length ?? 0) > 0;
              return (
                <button
                  key={d.rede}
                  type="button"
                  onClick={() => setAba(d.rede)}
                  className={`relative shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium ${
                    aba === d.rede ? "border border-b-white border-zinc-200 bg-white text-marca-700 -mb-px" : "text-zinc-500"
                  }`}
                >
                  {CONFIG_REDES[d.rede].nome}
                  {temErro && <span className="absolute top-1.5 right-1 size-2 rounded-full bg-red-600" />}
                </button>
              );
            })}
          </div>

          {destinoAtual && analiseAtual && (
            <div className="space-y-4 px-4 pb-4">
              {/* Campos extras */}
              {destinoAtual.rede === "youtube" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(["longo", "shorts"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => alterarDestino("youtube", { youtube_formato: f })}
                        className={`botao border ${destinoAtual.youtube_formato === f ? "border-red-400 bg-red-50 text-red-800" : "border-zinc-300 bg-white"}`}
                      >
                        {f === "longo" ? "Vídeo longo" : "Shorts"}
                      </button>
                    ))}
                  </div>
                  <label className="block">
                    <span className="rotulo flex justify-between">
                      Título do vídeo
                      <Contador atual={contarCaracteres(destinoAtual.youtube_titulo)} limite={LIMITE_TITULO_YOUTUBE} />
                    </span>
                    <input
                      className="campo"
                      value={destinoAtual.youtube_titulo}
                      onChange={(e) => alterarDestino("youtube", { youtube_titulo: e.target.value })}
                    />
                  </label>
                </div>
              )}

              {destinoAtual.rede === "reddit" && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="rotulo">Subreddit</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500">r/</span>
                      <input
                        className="campo"
                        value={destinoAtual.reddit_subreddit}
                        placeholder="direito"
                        autoCapitalize="none"
                        onChange={(e) => alterarDestino("reddit", { reddit_subreddit: e.target.value })}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="rotulo flex justify-between">
                      Título do post
                      <Contador atual={contarCaracteres(destinoAtual.reddit_titulo)} limite={LIMITE_TITULO_REDDIT} />
                    </span>
                    <input
                      className="campo"
                      value={destinoAtual.reddit_titulo}
                      onChange={(e) => alterarDestino("reddit", { reddit_titulo: e.target.value })}
                    />
                  </label>
                </div>
              )}

              {destinoAtual.rede === "linkedin" && (
                <label className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-5"
                    checked={destinoAtual.linkedin_link_no_comentario}
                    onChange={(e) => alterarDestino("linkedin", { linkedin_link_no_comentario: e.target.checked })}
                  />
                  <span className="text-sm">
                    <b>Link no primeiro comentário</b>
                    <span className="block text-zinc-500">Tira o link do texto e envia o {"{link_artigo}"} como comentário.</span>
                  </span>
                </label>
              )}

              {/* Legenda da rede */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rotulo mb-0">Legenda nesta rede</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-marca-700"
                    onClick={() =>
                      alterarDestino(destinoAtual.rede, {
                        legenda_personalizada: destinoAtual.legenda_personalizada === null ? dados.legenda_base : null,
                      })
                    }
                  >
                    {destinoAtual.legenda_personalizada === null ? "Personalizar" : "Usar a legenda base"}
                  </button>
                </div>
                {destinoAtual.legenda_personalizada === null ? (
                  <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-500">Usando a legenda base.</p>
                ) : (
                  <textarea
                    className="campo min-h-32"
                    value={destinoAtual.legenda_personalizada}
                    onChange={(e) => alterarDestino(destinoAtual.rede, { legenda_personalizada: e.target.value })}
                  />
                )}
              </div>

              {/* Rodapé */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rotulo mb-0">Rodapé</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-marca-700"
                    onClick={() =>
                      alterarDestino(destinoAtual.rede, {
                        rodape_personalizado:
                          destinoAtual.rodape_personalizado === null ? analiseAtual.calculado.rodapeAutomatico : null,
                      })
                    }
                  >
                    {destinoAtual.rodape_personalizado === null ? "Editar só neste post" : "Voltar ao automático"}
                  </button>
                </div>
                {destinoAtual.rodape_personalizado === null ? (
                  <pre className="rounded-lg bg-zinc-50 p-3 font-sans text-sm whitespace-pre-wrap text-zinc-700">
                    {analiseAtual.calculado.rodapeAutomatico || "Esta rede não tem rodapé configurado."}
                  </pre>
                ) : (
                  <textarea
                    className="campo min-h-40"
                    value={destinoAtual.rodape_personalizado}
                    onChange={(e) => alterarDestino(destinoAtual.rede, { rodape_personalizado: e.target.value })}
                  />
                )}
              </div>

              {/* Contadores */}
              <div className="flex flex-wrap gap-4 rounded-lg bg-zinc-50 p-3 text-sm">
                <span>
                  Texto final: <Contador atual={analiseAtual.tamanho} limite={analiseAtual.limite} />
                </span>
                <span>
                  Hashtags: <Contador atual={analiseAtual.hashtags} limite={analiseAtual.maxHashtags} />
                </span>
              </div>

              <ListaMensagens itens={analiseAtual.erros} tipo="erro" />
              <ListaMensagens itens={analiseAtual.avisos} tipo="aviso" />
              {analiseAtual.termos.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="mb-1 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="size-4" /> Termos sensíveis (Provimento 205)
                  </p>
                  <ul className="space-y-0.5">
                    {analiseAtual.termos.map((t) => (
                      <li key={`${t.trecho}-${t.motivo}`}>
                        “{t.trecho}” — {t.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {CONFIG_REDES[destinoAtual.rede].manual && (
                <p className="rounded-lg bg-violet-50 p-3 text-sm text-violet-900">
                  TikTok é manual: no horário agendado, o post aparece em <b>Manual</b> com botões para baixar o vídeo e copiar a legenda.
                </p>
              )}

              {/* Prévia */}
              <div>
                <span className="rotulo">Prévia</span>
                <PreviaRede
                  rede={destinoAtual.rede}
                  nome={nomeConta}
                  texto={analiseAtual.calculado.textoFinal}
                  midias={midiasPrevia}
                  youtubeTitulo={destinoAtual.youtube_titulo}
                  youtubeShorts={destinoAtual.youtube_formato === "shorts"}
                  subreddit={destinoAtual.reddit_subreddit.replace(/^\/?r\//i, "")}
                  redditTitulo={destinoAtual.reddit_titulo}
                  comentario={analiseAtual.calculado.comentario}
                  botao={analiseAtual.calculado.botao}
                  textoAlternativo={analiseAtual.calculado.textoAlternativo}
                />
                {analiseAtual.calculado.textoAlternativo && (
                  <p className="mt-2 text-xs text-zinc-500">
                    <b>Texto alternativo:</b> {analiseAtual.calculado.textoAlternativo}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Data e hora -------------------------------------------------- */}
      <section className="cartao space-y-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <CalendarClock className="size-5" /> Quando publicar
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="rotulo">Data</span>
            <input type="date" className="campo" value={dados.data} onChange={(e) => alterar("data", e.target.value)} />
          </label>
          <label className="block">
            <span className="rotulo">Hora</span>
            <input type="time" className="campo" value={dados.hora} onChange={(e) => alterar("hora", e.target.value)} />
          </label>
        </div>
        <p className="text-xs text-zinc-500">Horário de Brasília. O envio acontece em até 5 minutos depois do horário.</p>
      </section>

      {errosParaAgendar.length > 0 && (
        <details className="cartao text-sm" open={errosServidor.length > 0}>
          <summary className="cursor-pointer font-medium text-red-800">
            {errosParaAgendar.length} {errosParaAgendar.length === 1 ? "pendência impede" : "pendências impedem"} o agendamento
          </summary>
          <ul className="mt-2 space-y-1 text-red-900">
            {errosParaAgendar.map((e) => (
              <li key={e}>⛔ {e}</li>
            ))}
          </ul>
        </details>
      )}

      {/* Barra de ações ----------------------------------------------- */}
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur md:bottom-0">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2">
          <button type="button" className="botao-secundario px-2" disabled={salvando} onClick={() => salvar("rascunho")}>
            <Save className="hidden size-4 sm:block" /> Rascunho
          </button>
          <button
            type="button"
            className="botao-primario px-2"
            disabled={salvando || !validacao.ok}
            onClick={() => salvar("agendar")}
          >
            <CalendarClock className="hidden size-4 sm:block" /> Agendar
          </button>
          <button
            type="button"
            className="botao-secundario px-2"
            disabled={salvando || !validarPost(config, dados, { exigirDataFutura: false }).ok}
            onClick={() => salvar("publicar_agora")}
          >
            {salvando ? <Loader2 className="size-4 animate-spin" /> : <Send className="hidden size-4 sm:block" />}
            <span className="whitespace-nowrap">Publicar agora</span>
          </button>
        </div>
      </div>
    </div>
  );
}
