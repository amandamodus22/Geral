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
2. **[REVISAR]:** procure `[REVISAR]` nos 4 arquivos. Cada marca aparece na página como uma etiqueta amarela. Confira o texto jurídico ao lado e apague a marca (`<mark class="revisar">[REVISAR]</mark>`). Na política de privacidade, preencha também os trechos entre colchetes (serviço do webhook e prazo de guarda).
3. **[FOTO]:** em "Sobre a advogada", substitua `<div class="photo" aria-hidden="true">AM</div>` pelo `<img>` indicado no comentário logo acima. Use foto quadrada, em `.webp`, com até 40 KB.

## 2. Hospedagem e domínio

Endereço definido: **https://cartorio.modusadvocacia.com.br** (subdomínio sem acento). As páginas não citam o site principal; o endereço já está nas tags `canonical` das páginas.

1. Publique a pasta `landing-cartorio/` inteira como raiz do site, **incluindo a pasta `fonts/`**, em qualquer hospedagem estática: Netlify, Vercel, Cloudflare Pages, Hostinger etc.
2. No painel de DNS de `modusadvocacia.com.br`, crie um registro **CNAME** com nome `cartorio`, apontando para o endereço que a hospedagem indicar (por exemplo `cname.vercel-dns.com` na Vercel, ou `seu-site.netlify.app` no Netlify).
3. Ative o HTTPS (certificado automático) na hospedagem.
4. A raiz `cartorio.modusadvocacia.com.br/` não tem página. Se quiser, configure na hospedagem um redirecionamento de `/` para `/divorcio/`.

Para testar localmente: `npx serve landing-cartorio` (ou `python3 -m http.server`) e abra `http://localhost:3000/divorcio/?debug=1`. Com `?debug=1`, todos os eventos aparecem no console do navegador.

**GA4:** como o domínio é compartilhado com o site principal, recomendo uma **propriedade GA4 separada** para estas páginas, para não misturar os dados. A conta do Google Ads pode ser a mesma.

## Visual e interações

- **Paleta:** verde-esmeralda profundo, dourado champanhe e creme quente. As cores ficam em variáveis no início do CSS de cada página (`--brand`, `--night`, `--gold`...).
- **Tipografia:** títulos em Newsreader (licença SIL OFL, hospedada em `fonts/`, sem Google Fonts); textos na fonte do sistema.
- **Interações:**
  - barra de progresso de leitura no topo da tela;
  - topo que fica fixo e claro ao rolar (desktop);
  - conteúdo que surge suavemente ao rolar;
  - ilustração flutuante que reage ao mouse;
  - linha do tempo que se desenha;
  - lista de requisitos clicável, que mostra um atalho para a triagem quando todos os itens são marcados.
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

## 5. Webhook (recebimento dos leads)

Sugestão com Make:

1. Crie um cenário com o módulo **Webhooks → Custom webhook** e copie a URL para `WEBHOOK_URL`.
2. Envie um lead de teste para o Make aprender a estrutura dos dados.
3. Adicione **Google Sheets → Add a row** (uma linha por lead) e, se quiser, um aviso por e-mail ou WhatsApp para você.

Os dados chegam como formulário (`application/x-www-form-urlencoded`) com os campos:

- **Identificação e classificação:** `lead_id`, `servico`, `classificacao` (QUALIFICADO / REVISAR / NAO_CABE), `motivo`, `motivo_texto`
- **Contato:** `nome`, `whatsapp`, `email`, `cidade`, `uf`, `uf_bens`
- **Respostas:** cada resposta como `resp_<pergunta>`, mais `resumo` (texto pronto com todas as respostas)
- **Atribuição:** `gclid`, `gbraid`, `wbraid`, `utm_*`, `pagina_origem`, `referrer`
- **Consentimento e data:** `consentimento`, `consentimento_texto`, `data_hora`

Se o webhook não responder, a página faz uma segunda tentativa. Por isso, **ignore `lead_id` repetido** (no Make, use um filtro ou um Data store).

Sem webhook configurado, ou se ele falhar, a `/obrigado/` mostra o botão "Enviar minhas respostas por e-mail" (mailto com o resumo), além do WhatsApp.

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
