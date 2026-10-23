# Landing page: direito bancário para pequenas empresas

Página independente para Google Ads, em **https://bancario.modusadvocacia.com.br**. Cada arquivo HTML tem o CSS e o JS embutidos, sem frameworks e sem fontes externas (Manrope e Inter ficam em `fonts/`, licença SIL OFL).

| Endereço | Arquivo | Função |
|---|---|---|
| `/` | `index.html` | Landing page de passivo bancário (ME e EPP) |
| `/obrigado/` | `obrigado/index.html` | Agradecimento + conversão do Google Ads (`noindex`) |
| `/privacidade/` | `privacidade/index.html` | Política de privacidade (LGPD) |

## Configuração

O bloco `window.CONFIG` fica no topo das 3 páginas. Use os mesmos valores em todas.

- `WHATSAPP`, `EMAIL`: contato (botão do topo, "Chame no WhatsApp" do formulário e rodapé).
- `ADS_ID`: `AW-18256148045` (mesma conta do Google Ads).
- `ADS_LABEL`: `8zUeCJn2naYdEM3smoFE`, ação "Lead – bancário PJ" (Enviar formulário de lead, contagem "Uma", valores diferentes para cada conversão).
- `GA4_ID`: `G-VVFXJ8YE64` (filtre por **Nome do host = bancario.modusadvocacia.com.br**).
- `WEBHOOK_URL`: cenário do Make "Leads – bancário PJ".

## Hospedagem e domínio

- Projeto `bancario-online` na Vercel, publicando a pasta `landing-bancario/`.
- DNS no Cloudflare: registro **CNAME** `bancario` → `cname.vercel-dns.com`, com **Proxy desligado** (nuvem cinza, "DNS only").
- Teste local: `python3 -m http.server 8080` dentro desta pasta e abra `http://localhost:8080/?debug=1` (os eventos aparecem no console).

## Recebimento dos leads (Make)

- **Cenário:** "Leads – bancário PJ" (ativo). Recebe o formulário, grava o lead, responde ao site e envia um e-mail para amandamodus2@gmail.com com o assunto "Novo lead BANCÁRIO – empresa – faixa da dívida".
- **Banco de leads:** Make → Data stores → "Leads – Modus (cartório e bancário)". O plano gratuito do Make permite só 1 MB de data store no total, por isso o banco é o mesmo do cartório; a coluna `servico` mostra `bancario`. Webhook, cenário e e-mail são separados.
- Se o webhook falhar, a página de obrigado mostra "Enviar os dados por e-mail" (mailto com o resumo), além do WhatsApp.

## Conversão e eventos

- A conversão do Ads só dispara na `/obrigado/`, uma vez por envio (com `transaction_id`). Acesso direto ou recarregar a página não conta.
- Valor interno: `VALOR_QUALIFICADO` (ME/EPP com dívidas acima de R$ 50 mil) ou `VALOR_REVISAR` (MEI, "Outro / não sei" ou até R$ 50 mil). A classificação não aparece para a pessoa e todos os contatos são recebidos.
- Modelo de acompanhamento sugerido: `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}`.

| Evento GA4 | Quando dispara |
|---|---|
| `inicio_formulario` | primeira digitação no formulário |
| `lead_qualificado` / `lead_revisar` | envio do formulário |
| `generate_lead` | página de obrigado, uma vez por envio |
| `clique_whatsapp` | clique em qualquer botão de WhatsApp (`local`: hero, contato, rodapé, obrigado) |

Nenhum dado pessoal vai para o GA4 ou para o Google Ads. O banner de cookies usa o Consent Mode v2 (tudo começa "negado").

## Pendências da advogada

- Bio curta em "Quem atende" (hoje está um texto neutro).
