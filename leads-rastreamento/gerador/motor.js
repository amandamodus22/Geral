/* ==========================================================================
   MOTOR DA PÁGINA (igual nas páginas judicial e marketplace) — não precisa editar.
   Consentimento, origem do clique, triagem, eventos, Meta e registro na planilha.
   ========================================================================== */
(function () {
  'use strict';
  var C = window.CONFIG, T = window.TRIAGEM;
  var DEBUG = /[?&]debug=1/.test(location.search);
  var MODO_GTM = idValido(C.GTM_ID);
  var params = new URLSearchParams(location.search);

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function log() { if (DEBUG) console.log.apply(console, arguments); }

  /* ---------- Cookies próprios (compartilhados entre os subdomínios) ---------- */
  var DOMINIO = /(^|\.)modusadvocacia\.com\.br$/.test(location.hostname) ? '; domain=.modusadvocacia.com.br' : '';
  function setCookie(n, v, dias) {
    document.cookie = n + '=' + encodeURIComponent(v) + '; max-age=' + Math.round(dias * 86400) + '; path=/' + DOMINIO + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
  function getCookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function consentiu() { return getCookie('modus_consent') === 'granted'; }

  /* ---------- Origem do clique: cookie de 90 dias, sem apagar um gclid anterior ---------- */
  var CAMPOS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gad_source', 'gad_campaignid'];
  var CLIQUE = ['gclid', 'gbraid', 'wbraid', 'fbclid'];
  var origem = (function () {
    var salvo = {};
    try { salvo = JSON.parse(getCookie('modus_origem') || '{}') || {}; } catch (e) { salvo = {}; }
    var novo = {}, tem = false;
    CAMPOS.forEach(function (k) { var v = params.get(k); if (v) { novo[k] = v.slice(0, 300); tem = true; } });
    if (!tem && salvo.data_entrada) return salvo;
    var o = {};
    CAMPOS.forEach(function (k) {
      if (novo[k]) o[k] = novo[k];
      else if (CLIQUE.indexOf(k) !== -1 && salvo[k]) o[k] = salvo[k]; // não sobrescreve gclid/fbclid anteriores
      else if (!tem && salvo[k]) o[k] = salvo[k];
    });
    o.pagina_entrada = (location.origin + location.pathname).slice(0, 200);
    o.data_entrada = new Date().toISOString();
    setCookie('modus_origem', JSON.stringify(o), 90);
    return o;
  })();

  /* ---------- Cookies _fbp e _fbc do Meta (só com consentimento) ---------- */
  function cookiesMeta() {
    if (!consentiu()) return;
    if (!getCookie('_fbp')) setCookie('_fbp', 'fb.1.' + Date.now() + '.' + Math.floor(Math.random() * 1e10), 90);
    var fbc = getCookie('_fbc');
    if (origem.fbclid && (!fbc || fbc.split('.').slice(3).join('.') !== origem.fbclid)) setCookie('_fbc', 'fb.1.' + Date.now() + '.' + origem.fbclid, 90);
  }

  /* ---------- Meta Pixel e Clarity (modo sem GTM; com GTM, as tags ficam no contêiner) ---------- */
  var metaPronto = false, clarityPronto = false;
  function carregarMeta() {
    if (MODO_GTM || metaPronto || !consentiu() || !idValido(C.META_PIXEL_ID)) return;
    metaPronto = true;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    fbq('init', C.META_PIXEL_ID);
    fbq('track', 'PageView');
  }
  function carregarClarity() {
    if (MODO_GTM || clarityPronto || !consentiu() || !idValido(C.CLARITY_ID)) return;
    clarityPronto = true;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', C.CLARITY_ID);
  }
  function aposConsentimento() { cookiesMeta(); carregarMeta(); carregarClarity(); }
  aposConsentimento();

  /* ---------- Eventos: dataLayer (GTM) e, sem GTM, envio direto ao GA4/Google Ads/Meta ---------- */
  function rotuloOk(r) { return idValido(r) && !/^ROTULO_/.test(r); }
  function emitir(ev, p) {
    p = p || {};
    p.pagina = C.PAGINA;
    var obj = { event: ev };
    Object.keys(p).forEach(function (k) { obj[k] = p[k]; });
    window.dataLayer.push(obj);
    log('[evento]', ev, p);
    if (MODO_GTM) return;
    if (idValido(C.GA4_ID)) { var g = { send_to: C.GA4_ID }; Object.keys(p).forEach(function (k) { g[k] = p[k]; }); gtag('event', ev, g); }
    // Google Ads: lead (só qualificados) e ligação
    if (ev === 'whatsapp_click' && rotuloOk(C.ADS_LABEL_LEAD)) gtag('event', 'conversion', { send_to: C.ADS_ID + '/' + C.ADS_LABEL_LEAD, transaction_id: p.lead_id });
    if (ev === 'phone_click' && rotuloOk(C.ADS_LABEL_LIGACAO)) gtag('event', 'conversion', { send_to: C.ADS_ID + '/' + C.ADS_LABEL_LIGACAO });
    // Meta
    if (metaPronto && window.fbq) {
      if (ev === 'whatsapp_click') fbq('track', 'Lead', { content_category: C.PAGINA }, { eventID: p.lead_id });
      else if (ev === 'lead_desqualificado') fbq('trackCustom', 'LeadDesqualificado', { content_category: C.PAGINA, faixa_valor: p.faixa_valor });
      else if (ev === 'phone_click') fbq('track', 'Contact');
      else if (ev === 'scroll_depth' && p.percentual === 50) fbq('track', 'ViewContent', { content_category: C.PAGINA });
    }
  }

  /* ---------- Registro do lead na planilha (sem nome nem telefone) ---------- */
  function registrar(d) {
    var linha = {
      lead_id: d.lead_id || '', data_hora: new Date().toISOString(), pagina: C.PAGINA, secao: d.secao || '',
      qualificado: d.qualificado ? 'sim' : 'nao', respostas: d.respostas || '',
      fbp: getCookie('_fbp') || '', fbc: getCookie('_fbc') || '',
      pagina_entrada: origem.pagina_entrada || '', data_entrada: origem.data_entrada || '',
      url: location.href.slice(0, 300), user_agent: navigator.userAgent.slice(0, 300)
    };
    Object.keys(d.campos || {}).forEach(function (k) { linha[k] = d.campos[k]; });
    CAMPOS.forEach(function (k) { linha[k] = origem[k] || ''; });
    log('[planilha]', linha);
    if (!/^https:\/\/script\.google\.com\//.test(C.PLANILHA_URL || '')) return;
    var corpo = JSON.stringify(linha);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(C.PLANILHA_URL, new Blob([corpo], { type: 'text/plain;charset=UTF-8' }))) return;
    } catch (e) {}
    try { fetch(C.PLANILHA_URL, { method: 'POST', body: corpo, mode: 'no-cors', keepalive: true }); } catch (e) {}
  }
  function capiLead(leadId) {
    if (!C.META_CAPI || !consentiu()) return;
    var corpo = JSON.stringify({ event_id: leadId, content_category: C.PAGINA, url: location.href.slice(0, 500), fbp: getCookie('_fbp') || '', fbc: getCookie('_fbc') || '' });
    try { navigator.sendBeacon('/api/meta-capi', new Blob([corpo], { type: 'application/json' })); } catch (e) {}
  }

  /* ---------- Triagem ---------- */
  var dlg = $('#triagem'), corpoTri = $('#tri-corpo');
  var estado = null;
  function pergunta(id) { for (var i = 0; i < T.perguntas.length; i++) if (T.perguntas[i].id === id) return T.perguntas[i]; return null; }
  function rotulo(q, v) { for (var i = 0; i < q.opcoes.length; i++) if (q.opcoes[i][0] === v) return q.opcoes[i][1]; return v; }
  function respostasTexto() {
    return T.perguntas.filter(function (q) { return estado.r[q.id]; }).map(function (q) { return q.chave + '=' + rotulo(q, estado.r[q.id]); }).join('; ');
  }
  function camposRespostas() {
    var o = {};
    T.perguntas.forEach(function (q) { o[q.chave] = estado.r[q.id] ? rotulo(q, estado.r[q.id]) : ''; });
    return o;
  }
  function proximaPergunta() {
    // A 1ª pergunta é sempre o valor. Abaixo do mínimo, só segue se a regra de faturamento estiver ligada.
    if (!estado.r.valor) return 'valor';
    if (estado.qualificado === false) return null;
    for (var i = 0; i < estado.ordem.length; i++) if (!estado.r[estado.ordem[i]]) return estado.ordem[i];
    return null;
  }
  function abrirTriagem(secao) {
    estado = { secao: secao, r: {}, hist: [], qualificado: null, ordem: T.perguntas.map(function (q) { return q.id; }).filter(function (id) { return id !== 'valor'; }) };
    emitir('triagem_inicio', { secao: secao });
    $('#wa-float').classList.add('oculto');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    mostrar();
  }
  function fecharTriagem() {
    if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
  }
  dlg.addEventListener('close', function () { atualizarFlutuante(); });
  $('#tri-fechar').addEventListener('click', fecharTriagem);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) fecharTriagem(); });

  function mostrar() {
    var id = proximaPergunta();
    if (!id) return estado.qualificado ? telaFinal() : telaEncerramento();
    var q = pergunta(id), total = 1 + estado.ordem.length, feitas = Object.keys(estado.r).length;
    $('#tri-prog').textContent = 'Pergunta ' + (feitas + 1) + ' de ' + total;
    $('#tri-barra').style.width = Math.round(feitas / total * 100) + '%';
    var h = '<h2 class="tri-q" id="tri-titulo" tabindex="-1">' + esc(q.texto) + '</h2><div class="tri-opts">';
    q.opcoes.forEach(function (o) { h += '<button type="button" class="tri-opt" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>'; });
    h += '</div><div class="tri-nav">';
    h += estado.hist.length ? '<button type="button" class="link-btn" data-acao="voltar">Voltar</button>' : '<span></span>';
    if (estado.qualificado && id !== 'valor') h += '<button type="button" class="link-btn" data-acao="pular">Pular e ir direto ao WhatsApp</button>';
    h += '</div>';
    corpoTri.innerHTML = h;
    $$('.tri-opt', corpoTri).forEach(function (b) { b.addEventListener('click', function () { responder(q, b.getAttribute('data-v')); }); });
    var v = $('[data-acao=voltar]', corpoTri); if (v) v.addEventListener('click', voltar);
    var p = $('[data-acao=pular]', corpoTri); if (p) p.addEventListener('click', function () { telaFinal(true); });
    $('#tri-titulo').focus({ preventScroll: true });
  }
  function responder(q, v) {
    estado.hist.push({ id: q.id, qualificado: estado.qualificado, ordem: estado.ordem.slice() });
    estado.r[q.id] = v;
    emitir('triagem_etapa', { etapa: q.chave, resposta: rotulo(q, v), secao: estado.secao });
    if (q.id === 'valor') {
      if (v !== 'ate3') estado.qualificado = true;
      else if (C.QUALIFICAR_POR_FATURAMENTO && pergunta('faturamento')) {
        estado.qualificado = null;
        estado.ordem = ['faturamento'];               // pergunta o faturamento antes de encerrar
      } else estado.qualificado = false;
    } else if (q.id === 'faturamento' && estado.qualificado === null) {
      if (v === 'ate10') estado.qualificado = false;
      else {
        estado.qualificado = true;
        estado.ordem = T.perguntas.map(function (x) { return x.id; }).filter(function (x) { return x !== 'valor'; });
      }
    }
    mostrar();
  }
  function voltar() {
    var a = estado.hist.pop();
    if (!a) return;
    delete estado.r[a.id];
    estado.qualificado = a.qualificado; estado.ordem = a.ordem;
    mostrar();
  }
  function novoCodigo() { return T.prefixo + '-' + String(Math.floor(1000 + Math.random() * 9000)); }

  function telaFinal(pulou) {
    var leadId = novoCodigo();
    var msg = T.mensagem(estado.r, rotuloDe) + ' (código do atendimento: ' + leadId + ')';
    var url = 'https://wa.me/' + C.WHATSAPP + '?text=' + encodeURIComponent(msg);
    emitir('triagem_concluida', { qualificado: true, respostas: respostasTexto(), secao: estado.secao });
    $('#tri-prog').textContent = 'Tudo certo';
    $('#tri-barra').style.width = '100%';
    corpoTri.innerHTML = '<div class="tri-res"><h2 class="tri-q" id="tri-titulo" tabindex="-1">Pronto! Agora é só abrir a conversa</h2>' +
      '<p>A mensagem abaixo já vai preenchida no WhatsApp da advogada. Você pode completar com o que quiser contar.</p>' +
      '<p class="msg">' + esc(msg) + '</p>' +
      '<p class="codigo">Seu código de atendimento: ' + esc(leadId) + '</p>' +
      '<a class="btn btn-wa" id="tri-wa" href="' + esc(url) + '" target="_blank" rel="noopener">' + ICONE_WA + 'Abrir conversa no WhatsApp</a>' +
      '<div class="tri-nav"><button type="button" class="link-btn" data-acao="voltar">Voltar e mudar uma resposta</button></div></div>';
    var enviado = false;
    $('#tri-wa').addEventListener('click', function () {
      if (enviado) return;
      enviado = true;
      var campos = camposRespostas();
      var p = { lead_id: leadId, secao: estado.secao };
      Object.keys(campos).forEach(function (k) { p[k] = campos[k]; });
      emitir('whatsapp_click', p);
      registrar({ lead_id: leadId, secao: estado.secao, qualificado: true, respostas: respostasTexto() + (pulou ? '; pulou=sim' : ''), campos: campos });
      capiLead(leadId);
    });
    $('[data-acao=voltar]', corpoTri).addEventListener('click', function () { voltar(); });
    $('#tri-titulo').focus({ preventScroll: true });
  }
  function telaEncerramento() {
    var faixa = rotulo(pergunta('valor'), estado.r.valor);
    emitir('triagem_concluida', { qualificado: false, respostas: respostasTexto(), secao: estado.secao });
    emitir('lead_desqualificado', { faixa_valor: faixa, secao: estado.secao });
    registrar({ secao: estado.secao, qualificado: false, respostas: respostasTexto(), campos: camposRespostas() });
    $('#tri-prog').textContent = 'Triagem concluída';
    $('#tri-barra').style.width = '100%';
    var h = '<div class="tri-res"><h2 class="tri-q" id="tri-titulo" tabindex="-1">Obrigada por responder</h2>' + T.encerramento;
    if (C.PERMITIR_WHATSAPP_ABAIXO_DO_MINIMO) {
      h += '<a class="btn btn-sec" href="https://wa.me/' + C.WHATSAPP + '" target="_blank" rel="noopener">Mesmo assim, falar no WhatsApp</a>';
    }
    h += '<div class="tri-nav"><button type="button" class="link-btn" data-acao="voltar">Voltar e mudar a resposta</button></div></div>';
    corpoTri.innerHTML = h;
    $('[data-acao=voltar]', corpoTri).addEventListener('click', voltar);
    $('#tri-titulo').focus({ preventScroll: true });
  }
  function rotuloDe(id) { var q = pergunta(id); return q && estado.r[id] ? rotulo(q, estado.r[id]) : ''; }
  var ICONE_WA = $('#wa-float').innerHTML;

  /* ---------- Botões que abrem a triagem e demais cliques medidos ---------- */
  $$('[data-triagem]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var secao = b.getAttribute('data-triagem');
      emitir('cta_click', { secao: secao, texto_botao: (b.getAttribute('aria-label') || b.textContent).trim() });
      abrirTriagem(secao);
    });
  });
  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () { emitir('cta_click', { secao: a.getAttribute('data-cta'), texto_botao: a.textContent.trim() }); });
  });
  $$('[data-ev]').forEach(function (a) {
    a.addEventListener('click', function () {
      var ev = a.getAttribute('data-ev'), p = { secao: a.getAttribute('data-secao') || '' };
      if (ev === 'cross_page_click') p = { destino: a.getAttribute('href') };
      emitir(ev, p);
    });
  });
  $$('#duvidas details').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) emitir('faq_open', { pergunta: $('summary', d).textContent.trim() }); });
  });

  /* ---------- Profundidade de rolagem (25, 50, 75 e 90%) ---------- */
  (function () {
    var marcas = [25, 50, 75, 90], feitas = {}, pend = false;
    function medir() {
      pend = false;
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      if (max <= 0) return;
      var pct = (h.scrollTop || window.scrollY) / max * 100;
      marcas.forEach(function (m) { if (pct >= m && !feitas[m]) { feitas[m] = true; emitir('scroll_depth', { percentual: m }); } });
    }
    addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(medir); } }, { passive: true });
  })();

  /* ---------- Movimento ao rolar: barra de leitura, sombra do topo e elementos que entram na tela ---------- */
  (function () {
    var barra = document.createElement('div');
    barra.className = 'progresso'; barra.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barra);
    var topo = $('.top'), pend = false;
    function rolar() {
      pend = false;
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      if (topo) topo.classList.toggle('rolou', window.scrollY > 8);
    }
    addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(rolar); } }, { passive: true });
    rolar();

    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // [seletor, variação, intervalo entre irmãos em segundos]
    var grupos = [
      ['main .sec .head', '', 0], ['.grid2 > *, .grid3 > *', '', 0.09], ['.passos > li', '', 0.12],
      ['.aviso', 'esq', 0], ['.lista > li', '', 0.06], ['.quem > :first-child', 'esq', 0], ['.quem > :last-child', 'dir', 0.1],
      ['.aval', 'zoom', 0.1], ['.faq details', '', 0.05], ['.final', 'zoom', 0], ['.marcas li', '', 0.06],
      ['.sec-cta', '', 0.1], ['.ver-todas', '', 0]
    ];
    var alvo = [], limite = window.innerHeight * 0.92;
    grupos.forEach(function (g) {
      $$(g[0]).forEach(function (el) {
        if (el.classList.contains('rv') || el.closest('.hero') || el.getBoundingClientRect().top < limite) return;
        var irmaos = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.classList.add('rv'); if (g[1]) el.classList.add(g[1]);
        if (g[2]) el.style.setProperty('--d', (Math.min(irmaos, 6) * g[2]).toFixed(2) + 's');
        alvo.push(el);
      });
    });
    if (!alvo.length) return;
    document.documentElement.classList.add('anim');
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (!it.isIntersecting) return;
        var el = it.target; io.unobserve(el); el.classList.add('vis');
        // depois de entrar, volta ao normal (para o efeito de passar o mouse funcionar)
        setTimeout(function () { el.classList.remove('rv', 'vis', 'esq', 'dir', 'zoom'); el.style.removeProperty('--d'); }, 1700);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    alvo.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- WhatsApp flutuante: aparece depois do topo, some com a triagem aberta ---------- */
  var flutuante = $('#wa-float');
  var pulsou = false;
  function atualizarFlutuante() {
    var aberto = dlg.hasAttribute('open');
    var esconder = aberto || window.scrollY < 380;
    flutuante.classList.toggle('oculto', esconder);
    if (!esconder && !pulsou) { pulsou = true; flutuante.classList.add('pulsar'); }
  }
  addEventListener('scroll', atualizarFlutuante, { passive: true });
  atualizarFlutuante();

  /* ---------- Aviso de cookies (escolha guardada por 12 meses) ---------- */
  (function () {
    var b = $('#cookie');
    if (!getCookie('modus_consent')) {
      var mostrou = false;
      var mostrar = function () {
        if (mostrou) return;
        mostrou = true; b.hidden = false; document.body.classList.add('has-cookie');
        removeEventListener('scroll', aoRolar);
      };
      var aoRolar = function () { if (window.scrollY > 150) mostrar(); };
      addEventListener('scroll', aoRolar, { passive: true });
      setTimeout(mostrar, 6000);
    }
    $$('[data-cookie]', b).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var g = btn.getAttribute('data-cookie') === 'granted' ? 'granted' : 'denied';
        setCookie('modus_consent', g, 365);
        gtag('consent', 'update', { ad_storage: g, ad_user_data: g, ad_personalization: g, analytics_storage: g });
        gtag('set', 'ads_data_redaction', g === 'denied');
        if (g === 'granted') { window.dataLayer.push({ event: 'consentimento_aceito' }); aposConsentimento(); }
        b.hidden = true; document.body.classList.remove('has-cookie');
      });
    });
    var mudar = $('#mudar-cookies');
    if (mudar) mudar.addEventListener('click', function () { b.hidden = false; $('.ok', b).focus(); });
  })();
})();
