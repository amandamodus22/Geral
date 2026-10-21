# Landing pages: divórcio e inventário em cartório

Páginas independentes para Google Ads (rede de pesquisa). Cada arquivo HTML tem o CSS e o JS embutidos, sem frameworks e sem fontes externas.

| Endereço | Arquivo | Função |
|---|---|---|
| `/divorcio/` | `divorcio/index.html` | Landing page de divórcio em cartório online |
| `/inventario/` | `inventario/index.html` | Landing page de inventário em cartório online |
| `/obrigado/` | `obrigado/index.html` | Agradecimento + conversão do Google Ads (`noindex`) |
| `/privacidade/` | `privacidade/index.html` | Política de privacidade (LGPD) |

---

## 1. Antes de publicar

1. **Bloco de configuração** (topo de cada arquivo, em `window.CONFIG`): preencha os mesmos valores nas 4 páginas.
   - `WHATSAPP`: só números, por exemplo `5544999999999`.
   - `EMAIL`: e-mail de contato.
   - `ADS_ID` e `ADS_LABEL`: veja o item 3.
   - `GA4_ID`: veja o item 4.
   - `WEBHOOK_URL`: veja o item 5.
   - `PERGUNTA_GRAVIDEZ`: só na página de divórcio. Fica `false` por padrão; se ativar, revise a política de privacidade, porque essa informação é dado de saúde (dado sensível na LGPD).
2. **Revisão jurídica:** concluída e aprovada pela advogada em 21/10/2026 (etiquetas [REVISAR] removidas).
3. **Foto:** já incluída (`foto-amanda-modus.webp`, 368×368, 14 KB). Para trocar, substitua esse arquivo mantendo o nome.

## 2. Hospedagem e domínio

Endereço definido: **https://cartorio.modusadvocacia.com.br** (subdomínio sem acento). As páginas não citam o site principal; o endereço já está nas tags `canonical` das páginas.

1. **Hospedagem:** projeto `cartorio-online` na sua conta da Vercel, publicando a pasta `landing-cartorio/` (configuração em `vercel.json`: `/` redireciona para `/divorcio/`, e as fontes ficam em cache). O `README.md` e o `google-ads.md` não são publicados (`.vercelignore`).
2. **DNS (Cloudflare):** o domínio `modusadvocacia.com.br` usa o DNS do Cloudflare.
   1. Entre em dash.cloudflare.com → selecione `modusadvocacia.com.br` → **DNS** → **Records** → **Add record**.
   2. Preencha:
      - **Type:** CNAME
      - **Name:** `cartorio`
      - **Target:** `cname.vercel-dns.com`
      - **Proxy status:** desligado (nuvem cinza, "DNS only")
   3. Salve. O site principal não é afetado.
3. O HTTPS é emitido automaticamente pela Vercel depois que o DNS propaga.

Para testar localmente: `npx serve landing-cartorio` (ou `python3 -m http.server`) e abra `http://localhost:3000/divorcio/?debug=1`. Com `?debug=1`, todos os eventos aparecem no console do navegador.

**GA4:** por enquanto, estas páginas usam a mesma propriedade do site principal (`G-VVFXJ8YE64`). Para ver só estas páginas, filtre por **Nome do host = cartorio.modusadvocacia.com.br**. Se preferir separar no futuro, crie outra propriedade e troque o `GA4_ID` nas 4 páginas.

## Visual e interações

- **Paleta:** lilás e violeta sobre fundo escuro (ameixa quase preto) nas áreas de destaque e fundo claro levemente lavanda no conteúdo. As cores ficam em variáveis no início do CSS de cada página (`--brand`, `--night`, `--grad-cta`...).
- **Tipografia:** títulos em Space Grotesk (licença SIL OFL, hospedada em `fonts/`, sem Google Fonts); rótulos em fonte monoespaçada do sistema; textos na fonte do sistema.
- **Interações:**
  - barra de progresso de leitura no topo da tela;
  - topo que fica fixo e claro ao rolar (desktop);
  - conteúdo que surge suavemente ao rolar;
  - janela simulando a sessão de assinatura online, flutuante e reagindo ao mouse;
  - luz que acompanha o cursor nos cartões;
  - linha do tempo que se desenha;
  - lista de requisitos clicável, que mostra um atalho para a triagem quando todos os itens são marcados.
- **Celular:** layout pensado primeiro para o celular (testado em 320, 360 e 390 px), com barra fixa "Verificar meu caso" e aviso de cookies que só aparece depois da primeira rolagem, para não cobrir o botão principal.
- **Acessibilidade:** quem ativa "reduzir movimento" no sistema vê tudo sem animação. Sem JavaScript, o conteúdo aparece normalmente.

## 3. Google Ads: conversão

1. Em **Metas → Conversões → Nova ação de conversão → Site**, crie a ação manualmente:
   - **Categoria:** Enviar formulário de lead
   - **Contagem:** Uma
   - **Valor:** "Usar valores diferentes para cada conversão"
2. Copie o **ID da tag** (`AW-...`) para `ADS_ID` e o **rótulo da conversão** para `ADS_LABEL`.
3. A conversão só dispara na `/obrigado/`, uma vez por envio (com `transaction_id`) e só para leads **QUALIFICADO** (valor `VALOR_QUALIFICADO`) e **REVISAR** (valor `VALOR_REVISAR`). Acesso direto ou recarregar a página não gera conversão.
4. **Modelo de acompanhamento** (nível da conta):
   `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}`
5. **Título conforme a busca (message match):**

| Grupo de anúncios | URL final |
|---|---|
| divórcio em cartório | `/divorcio/` |
| divórcio consensual | `/divorcio/?h=consensual` → H1 "Divórcio consensual em cartório 100% online" |
| divórcio extrajudicial | `/divorcio/?h=extrajudicial` |
| quanto custa divórcio em cartório | `/divorcio/?h=custo` → mostra o atalho "Veja do que o custo é composto" |
| inventário em cartório | `/inventario/` |
| inventário extrajudicial | `/inventario/?h=extrajudicial` |

   Sem o parâmetro `h`, a página tenta identificar o título pelo `utm_term`. Só textos pré-aprovados podem aparecer; nada digitado na URL é exibido.

## 4. GA4: eventos

| Evento | Quando dispara | Parâmetros |
|---|---|---|
| `inicio_formulario` | primeira resposta | `servico` |
| `etapa_formulario` | cada etapa concluída | `etapa`, `pergunta`, `servico` |
| `triagem_nao_cabe` | tela "não pode ser feito em cartório" | `motivo` |
| `lead_qualificado` | envio QUALIFICADO | `motivo` |
| `lead_revisar` | envio REVISAR | `motivo` |
| `lead_nao_qualificado` | envio de contato no caso NÃO CABE | `motivo` |
| `clique_whatsapp` | clique no botão de WhatsApp | `classificacao`, `local` |

- Em **Administrador → Definições personalizadas**, crie dimensões de evento para `etapa`, `pergunta`, `servico`, `motivo` e `classificacao`.
- Marque `lead_qualificado` e `lead_revisar` como **eventos-chave** no GA4, mas **não importe** esses eventos para o Google Ads. A conversão do Ads já vem da tag na `/obrigado/`, e importar contaria o mesmo lead duas vezes.
- Nenhum dado pessoal (nome, telefone, e-mail) é enviado ao GA4 ou ao Google Ads, e esses dados nunca vão na URL.

**Consentimento:** o banner de cookies usa o Consent Mode v2. Tudo começa como "negado" e muda para "concedido" quando a pessoa clica em Aceitar. O formulário funciona com ou sem aceite.

## 5. Recebimento dos leads (já configurado no Make)

Já está criado e ativo na sua conta do Make (equipe "My Team"):

- **Cenário:** "Leads – cartório online". Recebe o formulário, grava o lead e responde ao site.
- **Webhook:** `https://hook.us2.make.com/h2ykw2j3wkuyjyx7sl513ear7729nk1t` (já está em `WEBHOOK_URL` nas 4 páginas).
- **Banco de leads:** Make → **Data stores** → "Leads – cartório online". Cada lead vira uma linha com nome, WhatsApp, e-mail, classificação, pontos a revisar, resumo das respostas, cidade/UF, gclid e palavra-chave. O lead é gravado pelo `lead_id`, então um envio repetido não duplica.

Para receber um aviso a cada lead, abra o cenário no Make e acrescente um módulo de **e-mail ou Gmail** depois do "Add/replace a record". O Make vai pedir para você conectar a sua conta, e só você pode fazer isso.

Sem webhook, ou se ele falhar, a `/obrigado/` mostra o botão "Enviar minhas respostas por e-mail" (mailto com o resumo), além do WhatsApp.

## Campanha

Anúncios, palavras-chave, negativas e extensões prontos em [`google-ads.md`](google-ads.md).

## 6. Lógica de classificação

**Divórcio**
- **NÃO CABE:** não há acordo sobre o divórcio, não há acordo sobre os bens, ou há filhos menores/incapazes sem decisão judicial.
- **REVISAR:** filhos com guarda e pensão já decididas na Justiça, ou gravidez (se a pergunta estiver ativa).
- **QUALIFICADO:** os demais casos.

**Inventário**
- **NÃO CABE:** herdeiros sem acordo.
- **REVISAR:** "não sei" sobre o acordo, herdeiro menor/incapaz, testamento (ou "não sei"), ou "só dívidas ou nenhum bem".
- **QUALIFICADO:** os demais casos.

No caso NÃO CABE, a triagem para na hora e mostra uma mensagem explicando que o caminho costuma ser judicial. O botão "Quero uma avaliação do meu caso" abre os campos de contato; o lead vai para o webhook como `NAO_CABE`, sem conversão no Google Ads.

Para mudar perguntas ou regras, edite o bloco `PAGINA` no fim de cada página de serviço. O bloco "MOTOR DA PÁGINA" é igual nas duas e não precisa ser alterado.
