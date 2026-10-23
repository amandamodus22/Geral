# Landing page: direito bancário para pequenas empresas

Página independente para Google Ads, em **https://bancario.modusadvocacia.com.br**. Cada arquivo HTML tem o CSS e o JS embutidos, sem frameworks e sem fontes externas (Manrope e Inter ficam em `fonts/`, licença SIL OFL).

| Endereço | Arquivo | Função |
|---|---|---|
| `/` | `index.html` | Landing page de passivo bancário (ME e EPP) |
| `/obrigado/` | `obrigado/index.html` | Agradecimento + conversão do Google Ads (`noindex`) |
| `/privacidade/` | `privacidade/index.html` | Política de privacidade (LGPD) |

## Configuração

O bloco `window.CONFIG` fica no topo das 3 páginas. Use os mesmos valores em todas.

- `WHATSAPP`, `EMAIL`: contato. O único link de WhatsApp da página fica abaixo do formulário, com mensagem pronta pedindo porte e valor da dívida.
- `ADS_ID`: `AW-18256148045` (mesma conta do Google Ads e do site principal; por isso os rótulos abaixo são exclusivos deste site).
- `ADS_LABEL`: `8zUeCJn2naYdEM3smoFE`, ação "Lead – bancário PJ", usada para o lead **qualificado**.
- `ADS_LABEL_NAO_QUALIFICADO`: marcador `ROTULO_NAO_QUALIFICADO`. Enquanto for marcador, o lead não qualificado não gera conversão no Ads (só o `generate_lead` no GA4).
- `ADS_LABEL_WHATSAPP`: marcador `ROTULO_WHATSAPP_BANCARIO`. Enquanto for marcador, o clique no WhatsApp só gera `whatsapp_click` no GA4.
- Rótulos do site principal e do cartório (`mrS3CPW_8p8dEM3smoFE`, `jPA8CNPM06MdEM3smoFE`, `6IlZCNK14KQdEM3smoFE`) são recusados pelo código mesmo se colados por engano.
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

- **Lead qualificado** = porte ME ou EPP **e** dívidas a partir de R$ 50 mil (`50-200mil`, `200-500mil`, `500mil-1mi`, `acima-1mi`). O resto é não qualificado. Todos os contatos são recebidos; quem escolhe MEI ou "Menos de R$ 50 mil" vê um aviso discreto, sem bloqueio.
- A conversão dispara **só quando o Make confirma o recebimento** (resposta 200), na própria página do formulário, uma vez por envio (`transaction_id` = `lead_id`). Envio com erro, campo anti-spam preenchido ou visita direta à `/obrigado/` não geram conversão.
- **Origem do clique:** gclid, gbraid, wbraid e as 5 UTMs ficam na sessão do navegador (`sessionStorage`, chaves `mb_*`), preenchem campos ocultos do formulário e vão para o Make e para o e-mail de aviso (bloco "Origem").
- Modelo de acompanhamento sugerido: `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}`.
- Âncoras dos sitelinks: `#servicos`, `#recuperacao-extrajudicial`, `#metodo`, `#duvidas`, `#contato`.

| Evento | Quando dispara |
|---|---|
| `inicio_formulario` (GA4) | primeira digitação no formulário |
| `generate_lead` (GA4) | envio confirmado pelo Make; parâmetros `form_name`, `lead_qualificado`, `porte`, `faixa_divida` |
| `conversion` (Ads) | envio confirmado; rótulo do qualificado ou do não qualificado |
| `whatsapp_click` (GA4) + `conversion` (Ads, rótulo do WhatsApp) | clique no link de WhatsApp, **só com cookies aceitos** |
| `perfil_completo` (GA4) | os 4 itens de "A sua empresa tem esse perfil?" marcados |

O banner de cookies usa o Consent Mode v2 no modo avançado: tudo começa "negado" e, antes do aceite, o Google recebe apenas sinais sem cookies. Nenhum dado pessoal vai para o GA4 ou para o Google Ads.

## Marca

`logo-ma.svg` (cabeçalho, rodapé e ícone), `apple-touch-icon.png` e `og-modus-advocacia.png` (imagem de compartilhamento) são **provisórios**, desenhados para combinar com o logo dos anúncios (monograma "MA" dourado sobre bordô). Quando a advogada enviar o arquivo oficial, substitua esses três arquivos mantendo os nomes.

## Pendências da advogada

- Bio curta em "Quem atende" (hoje está um texto neutro).
- Revisar os trechos marcados `REVISAR-AMANDA` no `index.html`.
- Criar no Google Ads as ações "Lead não qualificado – bancário" e "WhatsApp – bancário" e colar os rótulos.
- Enviar o arquivo oficial do logo "MA Modus Advocacia".
