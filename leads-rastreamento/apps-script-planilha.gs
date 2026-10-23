/**
 * Registro de leads das páginas desbloqueio.modusadvocacia.com.br e marketplace.modusadvocacia.com.br
 *
 * Como publicar (uma vez):
 *  1. Crie uma planilha nova no Google Sheets (ex.: "Leads – Modus").
 *  2. Menu Extensões → Apps Script. Apague o conteúdo e cole este arquivo inteiro. Salve.
 *  3. No seletor de funções, escolha "configurar" e clique em Executar. Autorize com a sua conta.
 *     Isso cria a aba "Leads" com os cabeçalhos e a lista de status.
 *  4. Implantar → Nova implantação → tipo "App da Web".
 *     Executar como: Eu. Quem pode acessar: Qualquer pessoa. Clique em Implantar.
 *  5. Copie a URL que termina em /exec e me envie (ela vai em PLANILHA_URL nas duas páginas).
 *
 * As páginas mandam só as respostas da triagem e a origem do clique. Nenhum nome ou telefone.
 * Toda semana: menu "Modus" → "Gerar importação de clientes fechados" (veja o README).
 */

var ABA = 'Leads';
var COLUNAS = [
  'data_hora', 'lead_id', 'pagina', 'secao', 'qualificado', 'faixa_valor',
  'origem_dinheiro', 'quando_bloqueio', 'plataforma', 'situacao', 'faturamento', 'respostas',
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'fbp', 'fbc',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gad_source', 'gad_campaignid',
  'pagina_entrada', 'data_entrada', 'url', 'user_agent',
  // preenchidas por você:
  'status', 'data_fechamento', 'valor_honorarios'
];
var STATUS = ['Novo', 'Em conversa', 'Cliente fechado', 'Não qualificado'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (['judicial', 'marketplace'].indexOf(d.pagina) === -1) return resposta('ignorado');
    var aba = abaLeads();
    var linha = COLUNAS.map(function (c) {
      if (c === 'data_hora') return new Date();
      if (c === 'status') return d.qualificado === 'sim' ? 'Novo' : 'Não qualificado';
      if (c === 'data_fechamento' || c === 'valor_honorarios') return '';
      var v = d[c] == null ? '' : String(d[c]).slice(0, 500);
      return /^[=+\-@]/.test(v) ? "'" + v : v; // evita fórmula vinda de fora
    });
    aba.appendRow(linha);
    return resposta('ok');
  } catch (err) {
    return resposta('erro');
  } finally {
    lock.releaseLock();
  }
}

function resposta(t) { return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.TEXT); }

function abaLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(ABA) || configurar();
}

/** Cria a aba "Leads", os cabeçalhos, a lista de status e os formatos. Pode rodar de novo sem perder dados. */
function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName(ABA) || ss.insertSheet(ABA);
  aba.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]).setFontWeight('bold').setBackground('#E7EDF5');
  aba.setFrozenRows(1);
  var col = function (n) { return COLUNAS.indexOf(n) + 1; };
  var regra = SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build();
  aba.getRange(2, col('status'), 5000, 1).setDataValidation(regra);
  aba.getRange(2, col('data_hora'), 5000, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  aba.getRange(2, col('data_fechamento'), 5000, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  aba.getRange(2, col('valor_honorarios'), 5000, 1).setNumberFormat('"R$" #,##0.00');
  ss.setSpreadsheetTimeZone('America/Sao_Paulo');
  return aba;
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Modus')
    .addItem('Gerar importação de clientes fechados', 'gerarImportacoes')
    .addToUi();
}

/**
 * Monta as abas "Importar Google Ads" e "Importar Meta" com as linhas "Cliente fechado"
 * que têm data_fechamento e valor_honorarios. Depois: Arquivo → Fazer download → CSV (aba atual).
 */
function gerarImportacoes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dados = abaLeads().getDataRange().getValues();
  var cab = dados.shift();
  var i = function (n) { return cab.indexOf(n); };
  var fuso = 'America/Sao_Paulo';
  var google = [['Parameters:TimeZone=' + fuso, '', '', '', ''], ['Google Click ID', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency']];
  var meta = [['event_name', 'event_time', 'event_id', 'value', 'currency', 'fbc', 'fbp', 'action_source', 'content_category']];
  dados.forEach(function (r) {
    if (r[i('status')] !== 'Cliente fechado' || !r[i('data_fechamento')] || r[i('valor_honorarios')] === '') return;
    var quando = new Date(r[i('data_fechamento')]);
    var valor = Number(r[i('valor_honorarios')]) || 0;
    var nome = r[i('pagina')] === 'marketplace' ? 'Cliente fechado - Marketplace' : 'Cliente fechado - Judicial';
    if (r[i('gclid')]) google.push([r[i('gclid')], nome, Utilities.formatDate(quando, fuso, 'yyyy-MM-dd HH:mm:ss'), valor, 'BRL']);
    if (r[i('lead_id')]) meta.push(['Purchase', Math.floor(quando.getTime() / 1000), r[i('lead_id')], valor, 'BRL', r[i('fbc')], r[i('fbp')], 'system_generated', r[i('pagina')]]);
  });
  escreverAba(ss, 'Importar Google Ads', google);
  escreverAba(ss, 'Importar Meta', meta);
  SpreadsheetApp.getUi().alert('Pronto: ' + (google.length - 2) + ' linha(s) para o Google Ads e ' + (meta.length - 1) + ' para a Meta.');
}

function escreverAba(ss, nome, linhas) {
  var aba = ss.getSheetByName(nome) || ss.insertSheet(nome);
  aba.clearContents();
  aba.getRange(1, 1, linhas.length, linhas[0].length).setValues(linhas);
}
