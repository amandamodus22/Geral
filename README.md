# Painel de Posts

Painel pessoal para **agendar e distribuir os posts do escritório** em Instagram, Facebook, LinkedIn, YouTube, Google Perfil da Empresa, Reddit e TikTok. Interface em português, pensada primeiro para o celular, no fuso de Brasília.

> **Como funciona, em uma frase:** você cria o post no painel → no horário marcado o painel envia tudo para um cenário do **Make** → o Make publica em cada rede e devolve o resultado (link ou erro) para o painel. O **TikTok é manual**: no horário, o post aparece em "Manual", com botões para baixar o vídeo e copiar a legenda.

```
 Você (celular)
    │ cria/agenda
    ▼
 Painel (Vercel) ──grava──▶ Supabase (banco + mídias privadas)
                               │ a cada 5 min (pg_cron)
                               ▼
                    Edge Function "enviar-para-make"
                               │ POST com o post + links das mídias (24h)
                               ▼
                         Cenário do Make ──publica──▶ redes sociais
                               │ resultado de cada rede
                               ▼
                 Painel: /api/make-callback (atualiza o status)
```

---

## Sumário

1. [O que você vai precisar](#1-o-que-você-vai-precisar)
2. [Gerar duas senhas](#2-gerar-duas-senhas)
3. [Supabase: banco, login e mídias](#3-supabase-banco-login-e-mídias)
4. [Supabase: função de envio](#4-supabase-função-de-envio-edge-function)
5. [Vercel: colocar o painel no ar](#5-vercel-colocar-o-painel-no-ar)
6. [Últimos ajustes e primeiro acesso](#6-últimos-ajustes-e-primeiro-acesso)
7. [Make: montar o cenário](#7-make-montar-o-cenário)
8. [Uso no dia a dia](#8-uso-no-dia-a-dia)
9. [Rodapés, variáveis e regras](#9-rodapés-variáveis-e-regras)
10. [Problemas comuns](#10-problemas-comuns)
11. [Segurança](#11-segurança)
12. [Para quem programa](#12-para-quem-programa)

---

## 1. O que você vai precisar

| Conta | Para quê | Custo |
|---|---|---|
| **GitHub** | Guarda o código do painel | Grátis |
| **Supabase** ([supabase.com](https://supabase.com)) | Banco de dados, login e mídias | Plano gratuito serve (limite de 50 MB por arquivo) |
| **Vercel** ([vercel.com](https://vercel.com)) | Deixa o painel no ar | Veja a observação abaixo |
| **Make** ([make.com](https://make.com)) | Publica nas redes | Depende do seu plano |
| **Anthropic** ([console.anthropic.com](https://console.anthropic.com)) | Botão "Sugerir com IA" | Paga por uso (centavos por sugestão) |

> **Observação sobre a Vercel:** o plano gratuito (Hobby) é, pelos termos da Vercel, para uso pessoal **não comercial**. Como o painel é do escritório, o mais seguro é usar o plano **Pro**. Tecnicamente, o painel funciona nos dois.

Reserve uns 40 minutos para a primeira configuração. Vá na ordem: algumas etapas usam informações das anteriores.

Ao longo do guia você vai copiar vários valores. Abra um bloco de notas **privado** para ir guardando:

```
URL do Supabase:
Chave pública (anon/publishable):
Chave secreta (service_role/secret):
PAINEL_SECRET:
CRON_SECRET:
URL do webhook do Make:
Endereço do painel na Vercel:
Chave da Anthropic:
```

---

## 2. Gerar duas senhas

O painel usa duas senhas longas que **só máquinas** digitam:

- **PAINEL_SECRET**: senha combinada entre o painel e o Make (nos dois sentidos).
- **CRON_SECRET**: senha que o agendador usa para acionar o envio.

Gere cada uma com um gerador de senhas (o do seu gerenciador de senhas, por exemplo) com **40 caracteres, só letras e números** (sem símbolos, para evitar problemas). As duas devem ser **diferentes**. Anote no bloco de notas.

---

## 3. Supabase: banco, login e mídias

### 3.1 Criar o projeto

1. Entre em [supabase.com](https://supabase.com) → **New project**.
2. Nome: `painel-posts`. Região: **South America (São Paulo)**. Crie uma senha de banco e guarde.
3. Espere o projeto ficar pronto (1–2 minutos).
4. Vá em **Project Settings → API** (ou **Data API / API Keys**) e anote:
   - **Project URL** (ex.: `https://abcd1234.supabase.co`);
   - a chave **anon** / **publishable** (pública);
   - a chave **service_role** / **secret** (secreta; nunca compartilhe).

### 3.2 Criar as tabelas (SQL)

No menu lateral, abra **SQL Editor** → **New query**. Você vai colar e rodar (**Run**) o conteúdo de cada arquivo da pasta `supabase/migrations`, **um de cada vez e nesta ordem**:

1. `20261015000001_tabelas.sql`: tabelas e sua configuração de rodapés.
2. `20261015000002_seguranca_rls.sql`: trava tudo para que só você acesse.
3. `20261015000003_storage.sql`: cria a pasta privada `midias`.
4. `20261015000004_funcoes_envio.sql`: regras de envio e de status.

Para abrir o arquivo no GitHub: entre no repositório → pasta `supabase/migrations` → clique no arquivo → botão **Copy raw file** (ícone de copiar) → cole no SQL Editor → **Run**. Deve aparecer "Success".

### 3.3 Guardar dois segredos no Vault e ligar o agendador

Ainda no **SQL Editor**, numa nova consulta, cole o texto abaixo **trocando os valores** e rode:

```sql
select vault.create_secret('https://SEU-PROJETO.supabase.co', 'url_projeto');
select vault.create_secret('COLE_AQUI_O_CRON_SECRET', 'cron_secret');
```

Depois rode o 5º arquivo: `20261015000005_agendamento_cron.sql`. Ele liga o envio automático **a cada 5 minutos**.

> Se aparecer erro sobre `pg_cron` ou `pg_net`, vá em **Database → Extensions**, ative **pg_cron** e **pg_net** e rode o arquivo de novo.

### 3.4 Configurar o login

1. **Authentication → Sign In / Providers**: em **Email**, deixe ligado. Em **User Signups**, **desligue "Allow new users to sign up"**. O painel cria a sua usuária sozinho no primeiro acesso, e ninguém mais consegue se cadastrar.
2. **Authentication → Emails → Templates → Magic Link**. Troque pelo modelo abaixo. Ele funciona mesmo quando o link abre em outro navegador do celular, e mostra um código para digitar:

   **Assunto:** `Seu acesso ao Painel de Posts`

   **Corpo:**
   ```html
   <h2>Acesso ao Painel de Posts</h2>
   <p><a href="{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email">Entrar no painel</a></p>
   <p>Ou digite este código no painel: <strong>{{ .Token }}</strong></p>
   <p>Se você não pediu este acesso, ignore este e-mail.</p>
   ```
3. **Authentication → URL Configuration**: você volta aqui no passo 6, depois de ter o endereço da Vercel.

> **E-mail de login:** o envio de e-mails padrão do Supabase é limitado, com poucos e-mails por hora, e só funciona para endereços da equipe do projeto. Use no painel **o mesmo e-mail da sua conta do Supabase**. Se quiser usar outro, configure um SMTP próprio em **Authentication → Emails → SMTP Settings** (Resend, Brevo, Google Workspace etc.).

---

## 4. Supabase: função de envio (Edge Function)

### 4.1 Criar a função pelo painel do Supabase

1. Menu lateral → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nome da função: **`enviar-para-make`** (exatamente assim).
3. Apague o código de exemplo e cole todo o conteúdo do arquivo `supabase/functions/enviar-para-make/index.ts`.
4. Clique em **Deploy function**.
5. Abra a função → **Details** (ou **Settings**) → **desligue "Verify JWT" / "Enforce JWT verification"** → salve. A função já se protege com o `CRON_SECRET`.

### 4.2 Segredos da função

**Edge Functions → Secrets** (ou **Manage secrets**) → adicione:

| Nome | Valor |
|---|---|
| `MAKE_WEBHOOK_URL` | URL do webhook do Make (passo 7). Se ainda não tiver, volte depois. |
| `PAINEL_SECRET` | o seu PAINEL_SECRET |
| `CRON_SECRET` | o seu CRON_SECRET |
| `PAINEL_URL` | endereço do painel na Vercel (passo 5), ex.: `https://painel-posts.vercel.app`, **sem barra no final** |

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente.

---

## 5. Vercel: colocar o painel no ar

1. Entre em [vercel.com](https://vercel.com) com a sua conta do GitHub → **Add New… → Project**.
2. Escolha o repositório do painel → **Import**. O tipo (Next.js) é detectado sozinho.
3. Abra **Environment Variables** e cadastre (os nomes têm que ser exatamente estes):

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave pública (anon/publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | chave secreta (service_role/secret) |
| `EMAIL_PERMITIDO` | o seu e-mail (o único que entra) |
| `PAINEL_SECRET` | o seu PAINEL_SECRET |
| `CRON_SECRET` | o seu CRON_SECRET |
| `ANTHROPIC_API_KEY` | chave da Anthropic (para "Sugerir com IA") |
| `NEXT_PUBLIC_LIMITE_UPLOAD_MB` | `50` |

4. **Deploy**. Ao terminar, copie o endereço (ex.: `https://painel-posts.vercel.app`).

> Todas as variáveis estão explicadas no arquivo [`.env.example`](.env.example).
> Sempre que mudar uma variável na Vercel, faça um novo deploy: **Deployments → ⋯ → Redeploy**.

---

## 6. Últimos ajustes e primeiro acesso

1. **Supabase → Authentication → URL Configuration**:
   - **Site URL**: o endereço da Vercel (ex.: `https://painel-posts.vercel.app`).
   - **Redirect URLs**: adicione `https://painel-posts.vercel.app/**` (com o seu endereço).
2. **Supabase → Edge Functions → Secrets**: confira se `PAINEL_URL` está com o endereço da Vercel.
3. Abra o painel no celular → digite o seu e-mail → **Receber link de acesso** → abra o e-mail e toque em **Entrar no painel**, ou digite o código.
4. Dica: no celular, use **"Adicionar à tela de início"** para abrir o painel como um app.

---

## 7. Make: montar o cenário

### 7.1 O que o painel envia (um envio por post)

```json
{
  "teste": false,
  "post_id": "…",
  "titulo_interno": "Conta banida no Free Fire",
  "tipo": "imagem | carrossel | video",
  "agendado_para": "2026-10-20T13:00:00.000Z",
  "midias": ["URL assinada válida por 24h", "…"],
  "destinos": [
    {
      "destino_id": "…",
      "rede": "instagram",
      "legenda": "texto final, já com o rodapé e as hashtags",
      "youtube_titulo": null,
      "youtube_formato": null,
      "reddit_subreddit": null,
      "reddit_titulo": null,
      "texto_alternativo": "texto alternativo da imagem (só Instagram)",
      "comentario": null,
      "google_tipo_post": null,
      "google_botao": null
    }
  ],
  "callback_url": "https://SEU-PAINEL.vercel.app/api/make-callback"
}
```

Cabeçalho enviado: `x-painel-secret: SEU_PAINEL_SECRET`.

Campos por rede:
- **YouTube:** `youtube_titulo` e `youtube_formato` (`longo` ou `shorts`).
- **Reddit:** `reddit_subreddit` (só o nome, sem `r/`) e `reddit_titulo`.
- **LinkedIn:** `comentario` (o link para o 1º comentário, quando você liga essa opção).
- **Google:** `google_tipo_post` (`Novidade`) e `google_botao` (`{ "tipo": "Saiba mais", "url": "…" }`).

O **TikTok nunca vai para o Make**.

### 7.2 Passo a passo do cenário

1. **Webhooks → Custom webhook** → **Add** → nome `Painel de Posts`. Em **Advanced settings**, ligue **"Get request headers"**. Copie a URL do webhook e cole no segredo `MAKE_WEBHOOK_URL` da Edge Function (passo 4.2).
2. Com o webhook em modo de escuta (**Redetermine data structure**), vá no painel → **Ajustes** → **Enviar post de teste**. O Make aprende sozinho o formato dos dados.
3. Logo depois do webhook, adicione um **filtro de segurança**: o cabeçalho `x-painel-secret` deve ser **igual** ao seu PAINEL_SECRET. Assim ninguém consegue disparar o cenário de fora.
4. Adicione outro **filtro**: `teste` **igual a** `false`. No teste, envie só a resposta de exemplo (veja 7.4) para não publicar de verdade.
5. **Iterator** sobre `destinos` (um item por rede).
6. **Router** com uma rota por rede (filtro: `rede` igual a `instagram`, `facebook`, `linkedin`, `youtube`, `google_business`, `reddit`).
7. Em cada rota, o módulo da rede, usando:
   - `legenda` como texto/legenda/descrição;
   - `midias` como imagem(ns) ou vídeo. No carrossel, use as URLs em ordem.
   - os campos extras da rede (título, subreddit, botão, texto alternativo etc.).
8. No fim de cada rota, um módulo **HTTP → Make a request** para avisar o painel (veja 7.3).
9. Em cada módulo de rede, clique com o botão direito → **Add error handler** → também um **HTTP → Make a request**, avisando o erro (veja 7.3).

### 7.3 Como o Make devolve o resultado

Módulo **HTTP → Make a request**:
- **URL:** `callback_url` (vem no próprio envio)
- **Method:** `POST`
- **Headers:** `x-painel-secret` = seu PAINEL_SECRET
- **Body type:** Raw → **Content type:** JSON
- **Request content**, quando der certo:
  ```json
  { "destino_id": "{{destino_id}}", "status": "publicado", "url_publicada": "{{link do post criado}}", "mensagem_erro": null }
  ```
- E quando der erro (no error handler):
  ```json
  { "destino_id": "{{destino_id}}", "status": "erro", "url_publicada": null, "mensagem_erro": "{{mensagem do erro}}" }
  ```

O painel também aceita uma **lista** com vários resultados de uma vez.

### 7.4 Testando a integração

- **Ajustes → Enviar post de teste** manda um exemplo com `"teste": true`, uma imagem de teste e todas as redes (exceto TikTok).
- Se o Make devolver o resultado para `callback_url` com `destino_id` como `teste-instagram`, ele aparece em **Ajustes → Últimos retornos do Make** como "teste recebido". É a prova de que a volta (Make → painel) também funciona.

> Se o Make não devolver nada em **2 horas**, o painel marca a rede como erro ("O Make não devolveu resultado em 2 horas") e mostra o botão **Tentar de novo**.

---

## 8. Uso no dia a dia

**Criar um post** (botão **+ Novo**):
1. Título interno (só você vê) e tipo: imagem, carrossel ou vídeo.
2. Envie as mídias. O aviso aparece se o arquivo passar de 50 MB.
3. Escreva a **legenda base**.
4. Preencha os **dados do rodapé**: palavra-chave, fonte legal, link do artigo, hashtags. O botão **Sugerir com IA** preenche palavra-chave, hashtags, títulos e a descrição da imagem. A **fonte legal e o link são sempre seus**: a IA não inventa leis nem links.
5. Escolha as **redes**. Em cada aba você pode personalizar a legenda e o rodapé só daquela rede, preencher os campos extras e ver a **prévia**.
6. Escolha data e hora (horário de Brasília) → **Agendar**. Ou **Publicar agora**.

**Calendário:** visões de mês e semana, com cores por status:
- cinza: rascunho
- azul: agendado
- amarelo: enviando
- verde: concluído
- vermelho: concluído com erros

**Posts:** lista com filtros por status e por rede.

**Detalhe do post:** mostra o status de cada rede, o link publicado e o erro (se houver), com **Tentar de novo** só para a rede que falhou. Também tem **Publicar agora**, **Duplicar post**, **Voltar para rascunho** e **Excluir**.

**Manual (TikTok):** no horário, o post aparece com **Baixar vídeo** e **Copiar legenda**. Publique no app do TikTok e toque em **Marcar como publicado**. O link do vídeo é opcional.

> Os posts saem **em até 5 minutos** depois do horário marcado (o agendador roda a cada 5 minutos). Um post que já foi enviado não pode ser editado: use **Duplicar**.

---

## 9. Rodapés, variáveis e regras

A configuração de conteúdo é o seu JSON (versão `2026-10-15`). Ela fica no banco e pode ser editada em **Ajustes → Rodapés e regras de conteúdo**. O botão **Restaurar padrão** volta à versão original.

- **Variáveis** entre chaves, como `{palavra_chave}`, `{fonte_legal}`, `{link_artigo}`, `{hashtag_tema}`, `{hashtag_jogo}`, `{capitulos}` e `{descricao_imagem}`, viram campos no formulário do post.
- **Variável vazia:** a **linha inteira** some do rodapé. O bloco **"Capítulos:"** sai junto quando `{capitulos}` está vazio.
- **Hashtags:** `#{hashtag_tema}` e `#{hashtag_jogo}` são convertidas para minúsculas, sem acento e sem espaço. Se `{hashtag_jogo}` ficar vazio, vira `#games`.
- **YouTube** usa o rodapé `youtube_longo` ou `youtube_shorts`, conforme o formato escolhido.
- **LinkedIn**: a opção "Link no primeiro comentário" troca a linha do link e manda o link como comentário.
- **Google**: tipo de post "Novidade", botão "Saiba mais" com o `{link_artigo}`, e o texto não pode ter telefone, URL nem hashtags.
- **Facebook e Reddit** não têm rodapé no seu JSON. Para criar, acrescente `"facebook": { "rodape": "…", "max_hashtags": 5 }` (ou `"reddit"`) dentro de `"redes"`.

**Regras que impedem o agendamento:**
- YouTube e TikTok: só vídeo.
- Instagram: pelo menos 1 mídia; carrossel com até 10 itens.
- Reddit: subreddit e título obrigatórios.
- **Limites de caracteres** (texto final = legenda + rodapé), com contador ao vivo:

  | Item | Limite |
  |---|---|
  | Instagram | 2.200 |
  | LinkedIn | 3.000 |
  | Google | 1.500 |
  | TikTok | 4.000 |
  | Descrição do YouTube | 5.000 |
  | Título do YouTube | 100 |
  | Título do Reddit | 300 |

- **Máximo de hashtags por rede**, contando as que você escrever na legenda:

  | Rede | Máximo |
  |---|---|
  | Instagram | 5 |
  | TikTok | 4 |
  | YouTube | 3 |
  | LinkedIn | 3 |
  | Google | 0 |

**Avisos que não bloqueiam:**
- Termos sensíveis do **Provimento 205** (sua lista de `checagem_termos`): "especialista", "grátis", "garantido" etc.
- Imagem que não é JPEG no Instagram.
- Variável vazia.

---

## 10. Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Não chega o e-mail de login | Use o mesmo e-mail da conta do Supabase, ou configure SMTP (passo 3.4). Espere alguns minutos: o limite de e-mails é baixo. |
| "O link expirou ou já foi usado" | Peça um novo, ou digite o **código** do e-mail. Confira o modelo de e-mail (passo 3.4) e a Site URL (passo 6). |
| Post fica "Agendado" e não sai | Confira o passo 3.3 (Vault + arquivo 5) e se a Edge Function se chama `enviar-para-make`, está com "Verify JWT" desligado e tem os 4 segredos. Em **Edge Functions → enviar-para-make → Logs** aparecem os erros. |
| Erro "O Make recusou o envio" | O cenário do Make está desligado ou a URL do webhook está errada. Ligue o cenário e use **Tentar de novo**. |
| Status fica "Enviando" | O Make não devolveu o resultado. Confira o módulo HTTP do passo 7.3 (URL, cabeçalho e JSON). Em **Ajustes → Últimos retornos do Make** você vê o que chegou. |
| "Publicar agora" diz que o envio falhou | Falta `CRON_SECRET` na Vercel ou ele está diferente do da Edge Function. O post continua agendado e sai na próxima rodada automática. |
| "Sugerir com IA" não funciona | Confira `ANTHROPIC_API_KEY` na Vercel e se há crédito na conta da Anthropic. |
| Vídeo maior que 50 MB | Comprima o vídeo (no celular, exporte em 1080p) ou passe para o plano Pro do Supabase e aumente `NEXT_PUBLIC_LIMITE_UPLOAD_MB` e o limite do bucket. |
| Projeto do Supabase "pausado" | No plano gratuito, projetos sem uso por cerca de uma semana podem ser pausados. Reative em supabase.com e use o painel com frequência. |

---

## 11. Segurança

- **Só um e-mail entra.** O cadastro público fica desligado. O painel confere o e-mail no login e em cada página, e o banco confere de novo (RLS em **todas** as tabelas e no Storage).
- **Nenhuma chave secreta vai para o navegador.** A service role, o `PAINEL_SECRET`, o `CRON_SECRET` e a chave da Anthropic ficam só na Vercel (servidor) e na Edge Function.
- **Mídias privadas.** O bucket `midias` é privado; o Make recebe **URLs assinadas válidas por 24 horas**.
- **Make ↔ painel.** As duas direções usam o cabeçalho `x-painel-secret`, conferido com comparação em tempo constante.
- **Sem envio duplicado.** A reivindicação dos posts é atômica no banco (`FOR UPDATE SKIP LOCKED`).

---

## 12. Para quem programa

**Tecnologias:** Next.js 16 (App Router) + TypeScript + Tailwind 4, Supabase (Auth, Postgres com RLS, Storage, Edge Functions, pg_cron, pg_net), Anthropic SDK (structured outputs).

```bash
npm install
cp .env.example .env.local   # preencha
npm run dev                  # http://localhost:3000
npm test                     # testes de rodapé, validação e termos
npm run typecheck
npm run build
```

Com a Supabase CLI, dá para aplicar as migrações e publicar a função sem copiar e colar:

```bash
npx supabase link --project-ref SEU_REF
npx supabase db push                       # (antes, crie os segredos do Vault — passo 3.3)
npx supabase functions deploy enviar-para-make --no-verify-jwt
npx supabase secrets set MAKE_WEBHOOK_URL=… PAINEL_SECRET=… CRON_SECRET=… PAINEL_URL=…
```

**Estrutura**

```
app/
  login/                  login por link mágico ou código
  auth/confirmar/         destino do link do e-mail
  (painel)/calendario     calendário (mês/semana)
  (painel)/posts          lista, novo, detalhe, editar
  (painel)/manual         TikTok manual
  (painel)/ajustes        teste do Make, JSON de conteúdo, retornos, sair
  api/make-callback/      retorno do Make
components/               interface (formulário, prévias, selos…)
lib/
  conteudo.ts             lê o JSON de rodapés e monta o texto de cada rede
  composicao.ts           motor dos modelos (variáveis, hashtags, blocos)
  validacao.ts            regras compartilhadas (navegador e servidor)
  acoes.ts                ações do servidor (salvar, publicar, duplicar…)
  ia.ts                   sugestão com Claude (claude-opus-5-5)
  config-padrao.json      configuração de conteúdo original
proxy.ts                  protege as rotas e renova a sessão
supabase/migrations/      banco, RLS, storage, funções e cron
supabase/functions/       Edge Function enviar-para-make
testes/                   testes automatizados
```

**Status:**
- Post: `rascunho → agendado → enviando → concluido | concluido_com_erros`.
- Destino: `pendente → enviando → publicado | erro`.
- TikTok: `pendente → manual → publicado`.

O status geral do post é recalculado por um gatilho no banco sempre que o status de um destino muda.
