# Campanha Google Ads: divórcio e inventário em cartório

Pronto para copiar no Google Ads. Os títulos têm até 30 caracteres e as descrições até 90, conferidos automaticamente. Também não há preços, "grátis", "especialista", promessas de resultado ou de prazo, nem urgência apelativa.

## 1. Configuração da campanha

| Item | Valor |
|---|---|
| Tipo | **Pesquisa** (sem rede de Display; desmarque também "Parceiros de pesquisa" no início) |
| Objetivo | Leads, com a conversão "Lead triagem cartório" (veja o README, item 3) |
| Locais | Brasil, com a opção **"Presença: pessoas que estão nos locais segmentados"** |
| Idioma | Português |
| Lances | Primeiras 2 a 3 semanas: **Maximizar cliques** com limite de CPC. Depois de cerca de 15 conversões: **Maximizar conversões** ou **Maximizar valor da conversão** (os valores 1 e 0,5 já são enviados pela página) |
| Orçamento | Começar com um valor diário que você esteja confortável em testar por 30 dias |
| Programação | Todos os dias. Ajuste depois, olhando os horários com mais conversões |
| Modelo de acompanhamento (conta) | `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}` |

Se a URL final já tiver `?h=...`, o Google junta os parâmetros automaticamente.

## 2. Grupos de anúncios e palavras-chave

Use **correspondência de frase** ("...") e **exata** [...]. Evite a ampla no início.

| Grupo | Palavras-chave | URL final |
|---|---|---|
| Divórcio em cartório | "divórcio em cartório", [divórcio em cartório online], "divórcio no cartório", "divórcio pelo cartório", "divórcio online" | `https://cartorio.modusadvocacia.com.br/divorcio/` |
| Divórcio consensual | "divórcio consensual", [divórcio consensual online], "divórcio amigável" | `.../divorcio/?h=consensual` |
| Divórcio extrajudicial | "divórcio extrajudicial", [divórcio extrajudicial online] | `.../divorcio/?h=extrajudicial` |
| Custo do divórcio | "quanto custa divórcio em cartório", "valor divórcio cartório", "custo divórcio consensual" | `.../divorcio/?h=custo` |
| Inventário em cartório | "inventário em cartório", [inventário em cartório online], "inventário online", "inventário no cartório" | `https://cartorio.modusadvocacia.com.br/inventario/` |
| Inventário extrajudicial | "inventário extrajudicial", [inventário extrajudicial online], "partilha de bens em cartório" | `.../inventario/?h=extrajudicial` |
| Custo do inventário | "quanto custa inventário em cartório", "valor inventário extrajudicial", "custo inventário cartório" | `.../inventario/?h=custo` |

### Palavras-chave negativas (lista da campanha)

`grátis`, `gratuito`, `gratuita`, `defensoria`, `defensoria pública`, `modelo`, `petição`, `pdf`, `curso`, `concurso`, `vaga`, `emprego`, `apostila`, `tcc`, `jurisprudência`, `artigo`, `lei`, `código civil`, `sozinho`, `sem advogado`, `litigioso`, `pensão alimentícia`, `revisional`, `cartório de registro de imóveis`, `jusbrasil`

Revise a lista uma vez por semana em **Termos de pesquisa** e acrescente o que não fizer sentido.

## 3. Anúncios responsivos (1 por grupo)

### Grupos de divórcio

**Títulos (até 15):**
1. Divórcio em Cartório Online (fixe na posição 1 no grupo "Divórcio em cartório")
2. Divórcio Consensual Online (fixe na posição 1 no grupo "Divórcio consensual")
3. Divórcio Extrajudicial Online (fixe na posição 1 no grupo "Divórcio extrajudicial")
4. Sem Precisar Ir ao Cartório
5. Assinatura por Vídeo Online
6. Atendimento em Todo o Brasil
7. Advogada OAB/PR 119.898
8. Escritura Pública de Divórcio
9. Sem Processo Judicial
10. Para Casais em Acordo
11. Verifique se Seu Caso Cabe
12. Triagem Online em 1 Minuto
13. Acompanhamento Completo
14. Pelo e-Notariado
15. Entenda Custos e Etapas

**Descrições (4):**
1. Casais em acordo resolvem por escritura pública, sem processo judicial. 100% online.
2. Assinatura por videoconferência pelo e-Notariado, cada um de onde estiver.
3. Responda à triagem e veja se o seu caso pode ser feito em cartório. Todo o Brasil.
4. Veja requisitos, documentos e do que é composto o custo. Advogada OAB/PR 119.898.

**Caminhos de exibição:** `divorcio` / `cartorio`

### Grupos de inventário

**Títulos (até 15):**
1. Inventário em Cartório Online (fixe na posição 1 no grupo "Inventário em cartório")
2. Inventário Extrajudicial (fixe na posição 1 no grupo "Inventário extrajudicial")
3. Inventário 100% Online
4. Sem Precisar Ir ao Cartório
5. Assinatura por Vídeo Online
6. Atendimento em Todo o Brasil
7. Advogada OAB/PR 119.898
8. Partilha por Escritura Pública
9. Sem Processo Judicial
10. Para Herdeiros em Acordo
11. Bens Digitais na Herança
12. Verifique se Seu Caso Cabe
13. Triagem Online em 1 Minuto
14. Pelo e-Notariado
15. Entenda Custos e Etapas

**Descrições (4):**
1. Herdeiros em acordo fazem a partilha por escritura pública, sem processo judicial.
2. Assinatura por videoconferência pelo e-Notariado. Herdeiros em cidades diferentes.
3. Responda à triagem e veja se o inventário pode ser feito em cartório. Todo o Brasil.
4. Também cuidamos de criptomoedas, contas e canais monetizados na herança.

**Caminhos de exibição:** `inventario` / `online`

### Grupos "Custo"

Use os mesmos anúncios do serviço, fixando na posição 1 o título "Entenda Custos e Etapas". **Não escreva valores no anúncio.** A página explica do que o custo é composto.

## 4. Recursos (extensões)

**Sitelinks.** Cada um precisa de uma URL diferente; o `?s=` só serve para isso:

| Texto (até 25) | URL (divórcio) | URL (inventário) |
|---|---|---|
| Como funciona | `/divorcio/?s=como#como-funciona` | `/inventario/?s=como#como-funciona` |
| Documentos necessários | `/divorcio/?s=docs#documentos` | `/inventario/?s=docs#documentos` |
| Do que é composto o custo | `/divorcio/?s=custo#custo` | `/inventario/?s=custo#custo` |
| Perguntas frequentes | `/divorcio/?s=faq#duvidas` | `/inventario/?s=faq#duvidas` |

**Frases de destaque (até 25):** 100% online · Sem ir ao cartório · Atendimento todo o Brasil · Assinatura por vídeo · Sigilo profissional · Triagem em 1 minuto

**Snippet estruturado:** cabeçalho **Serviços**; valores: Divórcio consensual, Inventário extrajudicial, Partilha de bens, Bens digitais

**Não use** extensão de chamada nem de preço. A ideia é que o contato passe pela triagem antes do WhatsApp.

## 5. Rotina de acompanhamento (15 min/semana)

1. **Termos de pesquisa:** negative o que não tem relação com o serviço.
2. **Conversões:** compare cliques e leads por grupo e pause as palavras com gasto alto e nenhum lead.
3. **Leads no Make:** abra o banco "Leads – cartório online" (Make → Data stores) e confira a coluna **Classificação**. Se houver muitos "NAO_CABE" vindos de uma palavra, negative-a.
4. **Grupos "Custo":** costumam trazer muita gente só pesquisando. Se a taxa de leads qualificados for baixa, reduza o lance ou pause esses grupos.
