# Rastreamento: desbloqueio.modusadvocacia.com.br e marketplace.modusadvocacia.com.br

As duas páginas (`landing-desbloqueio/` e `landing-marketplace/`) mandam os mesmos eventos ao `dataLayer`, com `pagina` = `judicial` ou `marketplace`. Os IDs ficam no bloco `window.CONFIG`, no topo de cada `index.html`.

- **Sem `GTM_ID`:** a página carrega a tag do Google (GA4 + Google Ads) direto e, depois do aceite dos cookies, o Meta Pixel e o Clarity. Funciona já, com os IDs que existirem.
- **Com `GTM_ID`:** a página só carrega o GTM, e as tags passam a vir do contêiner (`gtm-conteiner-modus.json`). As duas formas não rodam juntas, então não há contagem dupla.

## O que falta preencher

| Item | Onde | Situação |
|---|---|---|
| `GTM_ID` | `CONFIG` das duas páginas | **[PREENCHER]**: crie o contêiner (Web) e cole o `GTM-XXXXXXX` |
| `GA4_ID` | `CONFIG` e variável `const - GA4_ID` | `G-VVFXJ8YE64` (mesma propriedade do site e do cartório; separe por **Nome do host**) |
| `ADS_ID` | `CONFIG` e `const - ADS_ID` | `AW-18256148045`, da conta **364-007-7370** (confirmado em 23/10/2026). A conta 783-935-8286 é antiga e só de leitura |
| `ADS_LABEL_LEAD` | `CONFIG` de cada página e `const - Ads rótulo Lead ...` | **Preenchido em 23/10/2026**: Judicial `SQaSCPiznacdEM3smoFE` (ação 7866898936), Marketplace `QUhZCPuznacdEM3smoFE` (ação 7866898939). Categoria Contato, principal, contagem Uma, janela de 90 dias |
| `ADS_LABEL_LIGACAO` | `CONFIG` e `const - Ads rótulo Ligação` | **Não criado** de propósito: a advogada não atende ligações (regra da conta). Fica `ROTULO_LIGACAO`, que não dispara |
| `META_PIXEL_ID` | `CONFIG` e `const - META_PIXEL_ID` | **[PREENCHER]** |
| `META_CAPI_TOKEN` | Vercel → projeto → Settings → Environment Variables | **[PREENCHER]** (junto com `META_PIXEL_ID`; veja abaixo) |
| `CLARITY_ID` | `CONFIG` e `const - CLARITY_ID` | **[PREENCHER]** |
| `PLANILHA_URL` | `CONFIG` das duas páginas | **[PREENCHER]** com a URL `/exec` do Apps Script |

## 1. Planilha de leads (Google Sheets + Apps Script)

Veja as instruções no topo de `apps-script-planilha.gs`. Resumo: criar a planilha → Extensões → Apps Script → colar → executar `configurar` → Implantar como App da Web (Executar como: Eu; Acesso: Qualquer pessoa) → mandar a URL `/exec`.

- Cada clique em "Abrir conversa no WhatsApp" grava uma linha com `lead_id` (DJ-1234 ou MK-1234) e status **Novo**.
- Cada "Até R$ 3 mil" grava uma linha sem `lead_id`, com status **Não qualificado**.
- Nenhum nome ou telefone é gravado. As colunas `status`, `data_fechamento` e `valor_honorarios` são suas.

## 2. Google Tag Manager

1. tagmanager.google.com → Criar conta/contêiner **Web** ("Modus - desbloqueio e marketplace"). Copie o `GTM-XXXXXXX`.
2. Admin → **Importar contêiner** → escolha `gtm-conteiner-modus.json` → espaço de trabalho novo → **Mesclar** → "Substituir tags conflitantes".
3. Em **Variáveis**, preencha as constantes `const - ...` (Pixel, Clarity, rótulos do Ads; o GA4 e o Ads já vêm com os IDs atuais).
4. **Visualizar** (Tag Assistant) em `https://desbloqueio.modusadvocacia.com.br/?gclid=TESTE123` e confira a lista de testes abaixo. Depois, **Enviar → Publicar**.
5. Me mande o `GTM-XXXXXXX`: eu coloco nas duas páginas e publico.

O que o contêiner tem:

| Tag | Dispara em | Consentimento |
|---|---|---|
| Google tag - GA4 / Google tag - Google Ads | Inicialização | Consent Mode (modo avançado) |
| Google Ads - Vinculador de conversões | Todas as páginas | Consent Mode |
| GA4 - eventos da página (nome = `{{Event}}`, todos os parâmetros) | os 12 eventos da tabela | Consent Mode |
| Google Ads - Lead WhatsApp - Judicial / Marketplace (ID do pedido = `lead_id`) | `whatsapp_click` + `pagina` | Consent Mode |
| Google Ads - Ligação pelo site | `phone_click` | Consent Mode |
| Meta Pixel - base, Meta - Lead (eventID = `lead_id`), LeadDesqualificado, Contact, ViewContent (50%) | Todas as páginas / eventos | só com `ad_storage` concedido |
| Microsoft Clarity | Todas as páginas e `consentimento_aceito` | só com `analytics_storage` concedido |

`lead_desqualificado` vai só para o GA4 (e para a Meta como `LeadDesqualificado`). **Nunca crie conversão do Google Ads com ele.**

No Clarity: Configurações → Mascaramento → **Rigoroso** (a triagem não tem campo de texto, mas assim nada digitado aparece).

## 3. GA4

1. Admin → Fluxos de dados → o fluxo web → **Medição aprimorada**: deixe ligada, mas **desligue "Rolagens"** (a página manda `scroll_depth` com 25, 50, 75 e 90%).
2. Admin → **Eventos principais**: marque `whatsapp_click` e `phone_click`. Deixe `triagem_concluida` e `lead_desqualificado` como eventos comuns.
3. Admin → **Definições personalizadas** → dimensões (escopo Evento): `pagina`, `secao`, `qualificado`, `faixa_valor`, `origem_dinheiro`, `quando_bloqueio`, `plataforma`, `situacao`, `faturamento`.

## 4. Google Ads (conta 364-007-7370)

Metas → Conversões → Nova ação → **Site** → criar manualmente com código:

| Conversão | Categoria | Classificação | Contagem | Rótulo vai em |
|---|---|---|---|---|
| Lead WhatsApp - Judicial | Contato (criada em 23/10/2026) | Principal | Uma | `ADS_LABEL_LEAD` do judicial / `const - Ads rótulo Lead Judicial` |
| Lead WhatsApp - Marketplace | Contato (criada em 23/10/2026) | Principal | Uma | `ADS_LABEL_LEAD` do marketplace / `const - Ads rótulo Lead Marketplace` |
| Ligação pelo site | Contato | Secundária | Uma | `ADS_LABEL_LIGACAO` / `const - Ads rótulo Ligação` |
| Cliente fechado - Judicial | Importação → cliques | Secundária (principal depois de ~30 fechamentos) | Uma, com valor | importação offline |
| Cliente fechado - Marketplace | idem | idem | idem | importação offline |

Conversões otimizadas para leads: não se aplicam, porque a página não coleta e-mail nem telefone. O vínculo com o fechamento é feito pelo **gclid** (importação offline).

## 5. Meta (Pixel + API de Conversões)

- O Pixel só carrega depois do aceite. Eventos: PageView, ViewContent (50% da página), **Lead** (só qualificados, `eventID` = `lead_id`, `content_category` = página), **LeadDesqualificado** (personalizado; use para excluir do remarketing) e Contact (clique no telefone).
- **API de Conversões:** já está pronta em `/api/meta-capi` (função da Vercel nas duas páginas). Ela envia o mesmo Lead, com o mesmo `event_id`, `_fbp`, `_fbc`, IP e navegador, e a Meta descarta a duplicidade. Para ligar: Vercel → projeto (`desbloqueio-online` e `marketplace-online`) → Settings → Environment Variables:
  - `META_PIXEL_ID` = ID do Pixel
  - `META_CAPI_TOKEN` = Gerenciador de Eventos → Configurações → API de Conversões → Gerar token de acesso
  - `META_TEST_CODE` = (só durante o teste) código da aba "Eventos de teste"
  Depois, faça um novo deploy (ou me avise).

## 6. Importação offline (toda semana)

1. Na planilha, marque o status **Cliente fechado** e preencha `data_fechamento` e `valor_honorarios` dos atendimentos que viraram contrato.
2. Menu **Modus → Gerar importação de clientes fechados**. Ele monta as abas "Importar Google Ads" (só linhas com gclid) e "Importar Meta" (linhas com `lead_id`).
3. Abra a aba "Importar Google Ads" → Arquivo → Fazer download → **CSV**. No Google Ads: Metas → Conversões → **Uploads** → Enviar → escolha o arquivo → Visualizar e aplicar.
4. Abra a aba "Importar Meta" → baixe o CSV. Na Meta: Gerenciador de Eventos → seu conjunto de dados → **Carregar eventos offline / Carregar CSV** → associe as colunas (`event_id` = lead_id). [CONFIRMAR o caminho exato na sua conta, a Meta muda esse menu com frequência.]
5. Confira, 1 a 2 dias depois, as conversões "Cliente fechado - ..." na coluna **Todas as conv.** do Google Ads e no Gerenciador de Eventos. Importe só fechamentos dos últimos 90 dias (limite do gclid).

Modelos: `modelo-importacao-google-ads.csv` e `modelo-importacao-meta.csv`.

## 7. Testes antes de anunciar

1. Tag Assistant: GTM, GA4 e Google Ads disparando, com cookies aceitos e recusados (recusado: só sinais sem cookies; Meta e Clarity não carregam).
2. GA4 → Admin → DebugView: cada evento da tabela com os parâmetros.
3. Meta → Eventos de teste (com `META_TEST_CODE`): PageView e Lead, com "Desduplicado" entre navegador e servidor.
4. `?gclid=TESTE123&utm_source=google&utm_campaign=teste`:
   - "Até R$ 3 mil": tela de encerramento, `lead_desqualificado`, linha "Não qualificado" na planilha; **sem** `whatsapp_click`, conversão do Ads ou Lead.
   - "De R$ 3 mil a R$ 10 mil" → até o WhatsApp: código na mensagem, conversão disparada e linha completa na planilha.

## Gerador das páginas

`gerador/gerar.py` monta `landing-desbloqueio/` e `landing-marketplace/` a partir de `gerador/estilo.css`, `gerador/motor.js` e dos textos que estão no próprio script (`python3 leads-rastreamento/gerador/gerar.py`). `gerador/gtm.py` gera o `gtm-conteiner-modus.json`. Para ajustes pontuais (IDs, avaliações aprovadas, valor mínimo), basta editar o bloco `CONFIG` e o bloco `AVALIACOES` no `index.html` de cada página. Se rodar o gerador depois disso, repita as edições no script.
