"""Gera landing-desbloqueio/ e landing-marketplace/ no repositório Geral."""
import json, os, shutil, html, re
from urllib.parse import quote

S = os.path.dirname(os.path.abspath(__file__)) + '/'
G = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')) + '/'
CSS = open(S + 'estilo.css', encoding='utf-8').read()
MOTOR = open(S + 'motor.js', encoding='utf-8').read()

P = {
 'check': '<path d="M20 6 9 17l-5-5"/>',
 'shield': '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
 'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 'alert': '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
 'lock': '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 'file': '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 14h6M9 18h4"/>',
 'link': '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
 'tag': '<path d="M20 12 12 20l-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
 'star': '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 'cart': '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.4 11h11l2-8H6.2"/>',
 'msg': '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
}
def ic(n, cls='ico', sw='2'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{P[n]}</svg>'
WA_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-4-.5-5.7-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8.9 3.8.8.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>'
def wa_btn(secao, texto='Falar com a advogada no WhatsApp', extra=''):
    return f'<button type="button" class="btn btn-wa{extra}" data-triagem="{secao}">{WA_SVG}{texto}</button>'

def fonte(url, txt):
    return f'<span class="fonte">(<a href="{url}" target="_blank" rel="noopener">{txt}</a>)</span>'
CPC = 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm'
CC = 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm'
CDC = 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm'
L9099 = 'https://www.planalto.gov.br/ccivil_03/leis/l9099.htm'
PERFIL_GOOGLE = 'https://www.google.com/maps/place/?q=place_id:ChIJydzzsRvX7JQRKOM9yO4yNUY'

# ---------------------------------------------------------------- avaliações
AVALIACOES_JS = '''/* ==========================================================================
   AVALIAÇÕES DO GOOGLE — nota, total e lista APROVADA. Edite só este bloco.
   Critérios para aprovar uma nova avaliação (Provimento 205/2021 da OAB):
   - fala de atendimento, clareza, atenção ou comunicação;
   - NÃO menciona resultado, valores, prazo, preço, "especialista" ou "melhor";
   - NÃO identifica processo, parte contrária ou dado sensível.
   O texto vai LITERAL, sem nenhuma edição. Não use widget/API que puxe os textos
   automaticamente e não adicione dados estruturados AggregateRating/Review.
   ========================================================================== */
window.AVALIACOES = {
  nota: "5,0",
  total: 9,
  atualizado: "outubro/2026",
  perfil: "%s",
  lista: [
    { texto: "Eu estava com muitas dúvidas sobre esse novo ECA Digital. Ela me explicou muito bem tudo o que precisa ser feito. E está trabalhando no meu Alvará. Super recomendo!",
      autor: "[PRIMEIRO NOME]", data: "[MÊS/ANO]" }
    // , { texto: "...", autor: "Nome", data: "mês/ano" }
  ]
};
''' % PERFIL_GOOGLE

AVAL_RENDER = '''<script>
/* Monta o selo e os cartões a partir de window.AVALIACOES (texto literal, escapado). */
(function () {
  var A = window.AVALIACOES;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pronto(v) { return v && !/^\\[/.test(v); }
  Array.prototype.forEach.call(document.querySelectorAll('[data-selo]'), function (el) {
    el.innerHTML = '<a href="' + esc(A.perfil) + '" target="_blank" rel="noopener" data-ev="google_reviews_click" data-secao="' + el.getAttribute('data-selo') + '"><span class="estrelas" aria-hidden="true">★★★★★</span>' + esc(A.nota) + ' no Google · ' + esc(A.total) + ' avaliações</a><small>Atualizado em ' + esc(A.atualizado) + '</small>';
  });
  var box = document.getElementById('avals');
  if (box) {
    box.className = 'avals ' + (A.lista.length === 1 ? 'um' : 'varios');
    box.innerHTML = A.lista.slice(0, 3).map(function (r) {
      var quem = [pronto(r.autor) ? esc(r.autor) : 'Avaliação no Google', pronto(r.data) ? esc(r.data) : ''].filter(Boolean).join(' · ');
      return '<figure class="aval"><span class="estrelas" aria-label="5 estrelas">★★★★★</span><blockquote>' + esc(r.texto) + '</blockquote>' +
        '<figcaption><span>' + quem + '</span><a href="' + esc(A.perfil) + '" target="_blank" rel="noopener" data-ev="google_reviews_click" data-secao="avaliacoes">Ver no Google</a></figcaption></figure>';
    }).join('');
  }
})();
</script>
'''

# ---------------------------------------------------------------- páginas
JUD = dict(
 slug='desbloqueio', dominio='desbloqueio.modusadvocacia.com.br', pagina='judicial', prefixo='DJ',
 acc='#1B3A63', acc_dark='#122947', acc_soft='#E7EDF5', acc_glow='rgba(27,58,99,.10)', label_ads='SQaSCPiznacdEM3smoFE',
 title='Bloqueio judicial na conta? Desbloqueio de salário e poupança | OAB/PR 119.898',
 desc='Valores bloqueados por ordem judicial: salário, aposentadoria, pensão e poupança têm proteção na lei. Advogada OAB/PR 119.898, atendimento online.',
 og_titulo='A Justiça bloqueou sua conta?', og_sub='Desbloqueio de salário, aposentadoria, pensão e poupança',
 h1='A Justiça bloqueou sua conta?',
 sub='Salário, aposentadoria, pensão e poupança têm proteção na lei. A advogada analisa o bloqueio e pede a liberação no processo. Atendimento online em todo o Brasil.',
 chips=['Salário', 'Aposentadoria', 'Pensão', 'Benefício do INSS', 'Poupança', 'Conta salário'],
 servico='Desbloqueio de valores bloqueados por ordem judicial (Sisbajud / penhora online)',
 cruz=('Vende em marketplace e teve a conta ou o saldo bloqueado?', 'https://marketplace.modusadvocacia.com.br'),
)
MKT = dict(
 slug='marketplace', dominio='marketplace.modusadvocacia.com.br', pagina='marketplace', prefixo='MK',
 acc='#0E5A6A', acc_dark='#0A4552', acc_soft='#E2EFF1', acc_glow='rgba(14,90,106,.10)', label_ads='QUhZCPuznacdEM3smoFE',
 title='Conta de vendedor bloqueada ou saldo retido no marketplace? | Advogada OAB/PR 119.898',
 desc='Conta de vendedor suspensa ou saldo de vendas retido? A advogada analisa o bloqueio e busca a reativação e a liberação do dinheiro. Atendimento online.',
 og_titulo='Conta de vendedor bloqueada ou saldo retido?', og_sub='Reativação da conta e liberação do saldo de vendas',
 h1='Sua conta de vendedor foi bloqueada ou o seu saldo está retido?',
 sub='A advogada analisa o bloqueio da sua conta no marketplace e busca a reativação e a liberação do dinheiro de vendas, pelo diálogo com a plataforma ou na Justiça. Atendimento online em todo o Brasil.',
 chips=['Conta suspensa', 'Saldo retido', 'Anúncios pausados', 'Conta encerrada', 'Denúncia de marca', 'Mediações e reclamações'],
 servico='Defesa de vendedores de marketplace: reativação de conta e liberação de saldo retido',
 cruz=('Teve a conta bancária bloqueada por ordem judicial?', 'https://desbloqueio.modusadvocacia.com.br'),
)

def config_js(pg):
    fat = '  QUALIFICAR_POR_FATURAMENTO: false,          // true: até R$ 3 mil, mas faturamento acima de R$ 10 mil/mês, vira qualificado\n' if pg['pagina'] == 'marketplace' else ''
    return f'''<script>
/* ==========================================================================
   CONFIGURAÇÃO — edite apenas este bloco. Itens [PREENCHER] ficam desligados até receberem o ID.
   ========================================================================== */
window.CONFIG = {{
  PAGINA: "{pg['pagina']}",                         // vai em todos os eventos (parâmetro "pagina")
  VALOR_MINIMO: 3000,                              // valor mínimo atendido (texto das faixas da triagem)
  PERMITIR_WHATSAPP_ABAIXO_DO_MINIMO: false,       // true: a tela de encerramento mostra um WhatsApp (sem contar como lead)
{fat}  WHATSAPP: "5544988482082",
  GTM_ID: "[PREENCHER]",                           // Google Tag Manager (GTM-XXXXXXX). Com ele, as tags ficam no contêiner
  GA4_ID: "G-VVFXJ8YE64",                          // GA4 (usado direto enquanto não houver GTM)
  ADS_ID: "AW-18256148045",                        // Google Ads: ID da tag da conta 364-007-7370 (confirmado em 23/10/2026)
  ADS_LABEL_LEAD: "{pg['label_ads']}",       // Google Ads: rótulo da ação "Lead WhatsApp - {'Judicial' if pg['pagina']=='judicial' else 'Marketplace'}"
  ADS_LABEL_LIGACAO: "ROTULO_LIGACAO",             // Google Ads: rótulo da ação "Ligação pelo site"
  META_PIXEL_ID: "[PREENCHER]",                    // Meta Pixel
  META_CAPI: true,                                 // envia o Lead também pela API de Conversões (/api/meta-capi)
  CLARITY_ID: "[PREENCHER]",                       // Microsoft Clarity
  PLANILHA_URL: "[PREENCHER]"                      // URL do Web App do Google Apps Script (https://script.google.com/macros/s/.../exec)
}};
</script>
<script>
/* Consentimento (Consent Mode v2, modo avançado) e carregamento das tags — não editar */
(function () {{
  var C = window.CONFIG;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {{ dataLayer.push(arguments); }};
  var m = document.cookie.match(/(?:^|; )modus_consent=([^;]*)/);
  var g = m && m[1] === 'granted' ? 'granted' : 'denied';
  gtag('consent', 'default', {{ ad_storage: g, ad_user_data: g, ad_personalization: g, analytics_storage: g, wait_for_update: 500 }});
  gtag('set', 'ads_data_redaction', g === 'denied');
  gtag('set', 'url_passthrough', true);
  function valido(id) {{ return !!id && !/X{{4,}}|\\[|PREENCHER/.test(id); }}
  window.idValido = valido;
  var s = document.createElement('script');
  s.async = true;
  if (valido(C.GTM_ID)) {{
    dataLayer.push({{ 'gtm.start': Date.now(), event: 'gtm.js' }});
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + C.GTM_ID;
  }} else {{
    var ids = [C.GA4_ID, C.ADS_ID].filter(valido);
    if (!ids.length) return;
    gtag('js', new Date());
    if (valido(C.GA4_ID)) gtag('config', C.GA4_ID);
    if (valido(C.ADS_ID)) gtag('config', C.ADS_ID);
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ids[0];
  }}
  document.head.appendChild(s);
}})();
</script>
'''

def head(pg, titulo, desc, canonical, extra_ld='', noindex=False):
    ld = {
      '@context': 'https://schema.org', '@type': 'LegalService', 'name': 'Modus Advocacia',
      'url': f"https://{pg['dominio']}/", 'logo': f"https://{pg['dominio']}/logo-modus.png", 'image': f"https://{pg['dominio']}/og.png",
      'description': pg['servico'], 'serviceType': pg['servico'], 'telephone': '+55-44-98848-2082', 'email': 'amanda@modusadvocacia.com.br',
      'areaServed': {'@type': 'Country', 'name': 'Brasil'},
      'address': {'@type': 'PostalAddress', 'streetAddress': 'R. Quebec, 326 - Jardim Canadá', 'addressLocality': 'Maringá', 'addressRegion': 'PR', 'postalCode': '87080-560', 'addressCountry': 'BR'},
      'founder': {'@type': 'Person', 'name': 'Amanda Regina Gonçalves Modus', 'jobTitle': 'Advogada', 'identifier': 'OAB/PR 119.898'},
    }
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{config_js(pg)}<title>{titulo}</title>
<meta name="description" content="{desc}">
{'<meta name="robots" content="noindex">' if noindex else ''}
<link rel="canonical" href="{canonical}">
<link rel="preload" href="/fonts/manrope-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin>
<meta name="theme-color" content="#F8F7F3">
<link rel="icon" type="image/png" href="/logo-modus.png">
<link rel="apple-touch-icon" href="/logo-modus.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Modus Advocacia">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{pg['og_titulo']}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://{pg['dominio']}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False, indent=1)}
</script>
{extra_ld}<style>
:root{{--acc:{pg['acc']};--acc-dark:{pg['acc_dark']};--acc-soft:{pg['acc_soft']};--acc-glow:{pg['acc_glow']}}}
{CSS}</style>
</head>
'''

def cabecalho(pg, home=True):
    btn = wa_btn('cabecalho', 'Falar no WhatsApp', ' btn-sm') if home else ''
    return f'''<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="/">
      <img src="/logo-modus.png" width="44" height="44" alt="">
      <span><span class="brand-nome">Modus Advocacia</span><span class="brand-sub">Amanda Regina Gonçalves Modus · OAB/PR 119.898</span></span>
    </a>
    {btn}
  </div>
</header>
'''

AVISO_MARCAS = 'Marcas citadas apenas para identificar as plataformas em que os vendedores atendidos atuam. Não há qualquer vínculo, parceria ou autorização dessas empresas.'

def rodape(pg, home=True):
    cross = f'<p class="cross"><a href="{pg["cruz"][1]}" data-ev="cross_page_click">{pg["cruz"][0]}</a></p>' if home else ''
    marcas = f'<p>{AVISO_MARCAS}</p>' if pg['pagina'] == 'marketplace' else ''
    return f'''<footer class="foot">
  <div class="wrap">
    <div class="cols">
      <div>
        <p class="foot-brand"><img src="/logo-modus.png" width="40" height="40" alt="" loading="lazy">Modus Advocacia</p>
        <p>Amanda Regina Gonçalves Modus · Advogada · OAB/PR 119.898</p>
        <p>R. Quebec, 326, Jardim Canadá, Maringá-PR · Atendimento online em todo o Brasil</p>
        <p><a href="tel:+5544988482082" data-ev="phone_click" data-secao="rodape">(44) 98848-2082</a> · <a href="mailto:amanda@modusadvocacia.com.br" data-ev="email_click" data-secao="rodape">amanda@modusadvocacia.com.br</a></p>
      </div>
      <div>
        <p><a href="/privacidade/">Política de privacidade</a></p>
        {cross}
        {marcas}
      </div>
    </div>
    <p class="disc">Conteúdo informativo. Cada caso depende da análise dos documentos; não há garantia de resultado nem de prazo.</p>
  </div>
</footer>
'''

COOKIE = '''<div class="cookie" id="cookie" role="region" aria-label="Aviso de cookies" hidden>
  <p>Usamos cookies para medir o desempenho da página e dos anúncios (Google, Meta e Microsoft Clarity). <a href="/privacidade/">Política de privacidade</a></p>
  <div class="btns">
    <button type="button" class="no" data-cookie="denied">Recusar</button>
    <button type="button" class="ok" data-cookie="granted">Aceitar</button>
  </div>
</div>
'''

def faq_html(faq):
    return ''.join(f'''        <details>
          <summary>{q}</summary>
          <div class="ans"><p>{a}</p></div>
        </details>
''' for q, a in faq)

def faq_ld(faq):
    limpa = lambda t: html.unescape(re.sub(r'<[^>]+>', '', t))
    d = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': limpa(q), 'acceptedAnswer': {'@type': 'Answer', 'text': limpa(a)}} for q, a in faq]}
    return '<script type="application/ld+json">\n' + json.dumps(d, ensure_ascii=False, indent=1) + '\n</script>\n'

def hero(pg):
    chips = ''.join(f'<li>{c}</li>' for c in pg['chips'])
    return f'''  <section class="hero" id="topo">
    <div class="wrap hero-grid">
      <div>
        <h1>{pg['h1']}</h1>
        <p class="sub">{pg['sub']}</p>
        <p class="minimo">{ic('info')}Atendimento para valores bloqueados acima de R$ 3 mil.</p>
        <div class="cta-row">
          {wa_btn('topo').replace('class="btn btn-wa"', 'class="btn btn-wa" id="hero-cta"')}
          <a class="btn btn-sec" href="#direitos" data-cta="topo">Entender meus direitos</a>
        </div>
        <div class="selo" data-selo="topo"></div>
        <ul class="chips" aria-label="Situações atendidas">{chips}</ul>
        <p class="oab">Advogada Amanda Modus · OAB/PR 119.898</p>
      </div>
      <figure class="hero-foto" style="margin:0">
        <img src="/foto-amanda-modus.webp" width="560" height="700" alt="Amanda Regina Gonçalves Modus, advogada" fetchpriority="low" decoding="async">
        <figcaption><p><strong>Amanda Regina Gonçalves Modus</strong>Advogada · OAB/PR 119.898<br>Atendimento online em todo o Brasil</p></figcaption>
      </figure>
    </div>
  </section>
'''

QUEM = f'''  <section class="sec" id="quem" aria-labelledby="t-quem">
    <div class="wrap">
      <div class="quem">
        <!-- [FOTO PROFISSIONAL]: trocar este arquivo pela foto profissional quando houver (mesmo nome, retrato 4:5) -->
        <img src="/foto-amanda-modus.webp" width="560" height="700" alt="Amanda Regina Gonçalves Modus, advogada" loading="lazy" decoding="async">
        <div>
          <p class="kicker">Quem cuida do seu caso</p>
          <h2 id="t-quem">Amanda Regina Gonçalves Modus</h2>
          <p class="selo-oab">Advogada · OAB/PR 119.898 · Maringá-PR</p>
          <ul class="lista">
            <li>Atendimento online, para todo o Brasil.</li>
            <li>Contato direto com a advogada, do começo ao fim.</li>
            <li>Sigilo profissional sobre tudo o que você contar.</li>
            <li>Honorários combinados em contrato escrito.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
'''

def avaliacoes_sec():
    return f'''  <section class="sec sec-alt" id="avaliacoes" aria-labelledby="t-aval">
    <div class="wrap">
      <div class="head"><h2 id="t-aval">O que dizem no Google</h2></div>
      <div id="avals" class="avals um"></div>
      <p class="ver-todas"><a href="{PERFIL_GOOGLE}" target="_blank" rel="noopener" data-ev="google_reviews_click" data-secao="avaliacoes">Ver todas as avaliações no Google</a></p>
    </div>
  </section>
'''

def triagem_dialog():
    return '''<dialog class="triagem" id="triagem" aria-labelledby="tri-titulo">
  <div class="tri-in">
    <div class="tri-top"><span class="tri-prog" id="tri-prog">Pergunta 1</span><button type="button" class="tri-fechar" id="tri-fechar" aria-label="Fechar">×</button></div>
    <div class="tri-barra" aria-hidden="true"><i id="tri-barra" style="width:0"></i></div>
    <div id="tri-corpo"></div>
  </div>
</dialog>
'''

# ------------------------------------------------------------- JUDICIAL
JUD_FAQ = [
 ('Todo bloqueio judicial pode ser desfeito?', 'Não. Quando o valor bloqueado é protegido por lei, como salário ou poupança até 40 salários mínimos, é possível pedir a liberação no processo. Se a dívida for de pensão alimentícia, ou se o dinheiro não tiver proteção, o bloqueio pode ser mantido. Cada caso depende da análise dos documentos.'),
 ('Quais valores a lei protege?', 'Em regra, salários, aposentadorias, pensões e outras verbas de sustento (CPC, art. 833, IV) e até 40 salários mínimos em poupança (CPC, art. 833, X). Há exceções, como a dívida de pensão alimentícia e a parte do salário acima de 50 salários mínimos.'),
 ('Quanto tempo tenho para agir?', 'Depois do bloqueio, a lei dá 5 dias para provar que o valor é protegido ou que o bloqueio foi excessivo (CPC, art. 854, § 3º). Para valores de até 40 salários mínimos, a proteção precisa ser pedida na primeira oportunidade, senão o direito de alegá-la pode se perder.'),
 ('Quanto tempo leva o desbloqueio?', 'Depende do juízo e de cada processo. O pedido pode ser feito com urgência quando cabível, mas não há prazo garantido para a decisão.'),
 ('Não sei de qual processo é o bloqueio. E agora?', 'Isso é comum. Com o extrato do bloqueio e os seus dados, a advogada localiza o processo e verifica o que aconteceu.'),
 ('Vocês atendem qualquer valor?', 'O atendimento é para valores bloqueados acima de R$ 3 mil. Para valores menores, a Defensoria Pública do seu estado atende quem não pode pagar advogado e pode ajudar.'),
 ('Vocês atendem no meu estado?', 'Sim. O atendimento é online, para todo o Brasil, e o pedido é feito no próprio processo, de forma eletrônica.'),
]

def jud_corpo():
    return f'''  <section class="sec sec-alt" id="direitos" aria-labelledby="t-dir">
    <div class="wrap">
      <div class="head"><p class="kicker">Seus direitos</p><h2 id="t-dir">Alguns valores são protegidos por lei</h2></div>
      <div class="grid2">
        <div class="card"><span class="ic">{ic('shield')}</span><h3>Salário, aposentadoria e pensão</h3><p>Salários, aposentadorias, pensões e outras verbas de sustento são, em regra, impenhoráveis {fonte(CPC, 'CPC, art. 833, IV')}.</p></div>
        <div class="card"><span class="ic">{ic('lock')}</span><h3>Poupança até 40 salários mínimos</h3><p>Até 40 salários mínimos em poupança são impenhoráveis {fonte(CPC, 'CPC, art. 833, X')}. O STJ estende essa proteção, em regra, a outras aplicações e à conta corrente.</p><!-- [CONFIRMAR a redação sobre a extensão pelo STJ] --></div>
      </div>
      <aside class="aviso">{ic('alert')}<div>
        <h3>As exceções</h3>
        <ul>
          <li>A proteção não vale para dívida de pensão alimentícia, nem para a parte do salário acima de 50 salários mínimos {fonte(CPC, 'CPC, art. 833, § 2º')}.</li>
          <li>Em casos excepcionais, o STJ admite a penhora de parte do salário, desde que fique preservado o sustento da família.</li>
        </ul>
      </div></aside>
      <div class="sec-cta">{wa_btn('direitos', 'Ver se o meu valor é protegido')}</div>
    </div>
  </section>
  <section class="sec" id="prazo" aria-labelledby="t-prazo">
    <div class="wrap">
      <div class="head"><p class="kicker">Prazo</p><h2 id="t-prazo">Existe prazo para agir</h2></div>
      <div class="grid3">
        <div class="card"><span class="ic">{ic('clock')}</span><h3>5 dias depois do bloqueio</h3><p>A lei dá 5 dias para provar que o valor é protegido ou que o bloqueio foi excessivo {fonte(CPC, 'CPC, art. 854, § 3º')}.</p></div>
        <div class="card"><span class="ic">{ic('info')}</span><h3>A proteção precisa ser pedida</h3><p>Para valores de até 40 salários mínimos, o juiz não reconhece a proteção sozinho: ela precisa ser pedida na primeira oportunidade, senão a pessoa pode perder o direito de alegá-la (STJ, Tema 1.235, 2024).</p></div>
        <div class="card"><span class="ic">{ic('alert')}</span><h3>Sem defesa, o valor pode sair</h3><p>Sem defesa, o valor pode ser transferido ao credor, e novos bloqueios podem acontecer.</p></div>
      </div>
      <div class="sec-cta">{wa_btn('prazo')}</div>
    </div>
  </section>
  <section class="sec sec-alt" id="como-funciona" aria-labelledby="t-como">
    <div class="wrap">
      <div class="head"><p class="kicker">Como funciona</p><h2 id="t-como">Quatro etapas, com retorno direto da advogada</h2></div>
      <ol class="passos">
        <li><strong>Você envia o extrato</strong><p>Mande o extrato com o bloqueio e, se tiver, o número do processo.</p></li>
        <li><strong>Análise do processo</strong><p>A advogada localiza o processo e verifica se o valor é protegido.</p></li>
        <li><strong>Pedido de desbloqueio</strong><p>Ela pede o desbloqueio no processo, com pedido de urgência quando cabível.</p></li>
        <li><strong>Acompanhamento</strong><p>Acompanhamento até a decisão, com retorno direto da advogada.</p></li>
      </ol>
    </div>
  </section>
{QUEM}  <section class="sec sec-alt" id="documentos" aria-labelledby="t-docs">
    <div class="wrap">
      <div class="head"><p class="kicker">Documentos</p><h2 id="t-docs">Documentos para começar</h2></div>
      <ul class="lista">
        <li>Extrato mostrando o bloqueio.</li>
        <li>Número do processo, se tiver.</li>
        <li>Comprovante da origem do dinheiro: holerite, extrato do INSS ou comprovante de pensão.</li>
        <li>Documento de identidade.</li>
      </ul>
    </div>
  </section>
'''

JUD_TRI = '''<script>
/* Triagem desta página: perguntas, mensagem do WhatsApp e tela de encerramento. */
window.TRIAGEM = {
  prefixo: 'DJ',
  perguntas: [
    { id: 'valor', chave: 'faixa_valor', texto: 'Quanto foi bloqueado, aproximadamente?',
      opcoes: [['ate3', 'Até R$ 3 mil'], ['3a10', 'De R$ 3 mil a R$ 10 mil'], ['10a50', 'De R$ 10 mil a R$ 50 mil'], ['acima50', 'Acima de R$ 50 mil'], ['naosei', 'Não sei o valor exato']] },
    { id: 'origem', chave: 'origem_dinheiro', texto: 'De onde vem o dinheiro bloqueado?',
      opcoes: [['salario', 'Salário'], ['aposentadoria', 'Aposentadoria ou INSS'], ['pensao', 'Pensão'], ['poupanca', 'Poupança'], ['autonomo', 'Trabalho autônomo'], ['outro', 'Outro']] },
    { id: 'quando', chave: 'quando_bloqueio', texto: 'Quando foi o bloqueio?',
      opcoes: [['5dias', 'Nos últimos 5 dias'], ['mais5', 'Há mais de 5 dias'], ['naosei', 'Não sei']] }
  ],
  mensagem: function (r) {
    var v = { '3a10': 'cerca de R$ 3 a 10 mil', '10a50': 'cerca de R$ 10 a 50 mil', 'acima50': 'mais de R$ 50 mil' }[r.valor];
    var o = { salario: 'salário', aposentadoria: 'aposentadoria ou INSS', pensao: 'pensão', poupanca: 'poupança', autonomo: 'trabalho autônomo' }[r.origem];
    var q = { '5dias': 'o bloqueio foi nos últimos 5 dias', 'mais5': 'o bloqueio foi há mais de 5 dias', 'naosei': 'não sei quando foi o bloqueio' }[r.quando];
    var t = 'Olá, Amanda! ' + (v ? 'Tive um bloqueio judicial de ' + v + '.' : 'Tive um bloqueio judicial e ainda não sei o valor exato.');
    var partes = [];
    if (o) partes.push('o dinheiro é de ' + o);
    else if (r.origem === 'outro') partes.push('o dinheiro tem outra origem');
    if (q) partes.push(q);
    if (partes.length) t += ' ' + partes.join(' e ').replace(/^./, function (c) { return c.toUpperCase(); }) + '.';
    return t;
  },
  encerramento: '<p>Para valores até R$ 3 mil, os custos de uma atuação particular podem não compensar. A Defensoria Pública do seu estado atende quem não pode pagar advogado e pode ajudar no seu caso.</p>' +
    '<p>Se o valor bloqueado aumentar, volte a falar com a gente.</p>' +
    /* [CONFIRMAR o link oficial] */
    '<ul><li><a href="https://www.anadep.org.br" target="_blank" rel="noopener">Encontrar a Defensoria Pública do meu estado</a></li></ul>'
};
</script>
'''

# ------------------------------------------------------------- MARKETPLACE
MARCAS = ['Mercado Livre', 'Mercado Pago', 'Shopee', 'Amazon', 'Magalu', 'Shein', 'TikTok Shop']
MKT_FAQ = [
 ('A plataforma pode bloquear minha conta sem explicar o motivo?', 'A plataforma pode aplicar suas regras, mas precisa agir com transparência e boa-fé. Isso inclui informar o motivo de forma clara e permitir a defesa do vendedor. Um bloqueio sem explicação pode ser questionado, conforme o caso.'),
 ('Meu dinheiro de vendas pode ficar retido por quanto tempo?', 'A retenção precisa de justificativa e de prazo razoável. O dinheiro de vendas já concluídas é do vendedor e não deve ficar retido por tempo indefinido sem relação com a suspeita apontada. Cada caso depende das regras da plataforma e dos documentos.'),
 ('Já recorri pela plataforma e não resolveu. O que fazer?', 'É possível enviar uma notificação extrajudicial pedindo o motivo, a reativação e a liberação do saldo. Se não houver solução, cabe ação judicial com pedido de urgência, quando cabível.'),
 ('Dá para recuperar a conta ou só o dinheiro?', 'Depende do caso. Às vezes o pedido é a reativação da conta; em outras, a liberação do saldo, ou as duas coisas. A análise mostra o que faz sentido pedir.'),
 ('Posso pedir indenização pelas vendas perdidas?', 'Depende do caso e da prova do prejuízo. Por isso é importante guardar o faturamento dos últimos meses e os registros do bloqueio.'),
 ('Vocês atendem qualquer valor?', 'O atendimento é para valores bloqueados ou retidos acima de R$ 3 mil. Para valores menores, você pode registrar uma reclamação no consumidor.gov.br e, se não resolver, procurar o Juizado Especial Cível da sua cidade.'),
 ('Sou MEI ou pessoa física. Faz diferença?', 'Pode fazer diferença nas regras que se aplicam ao caso, por exemplo na possibilidade de usar o Código de Defesa do Consumidor. Isso é verificado na análise. O atendimento vale para MEI, pequenas empresas e autônomos.'),
]

def mkt_marcas():
    li = ''.join(f'<li>{m}</li>' for m in MARCAS)
    return f'''  <!-- [CONFIRMAR a lista final de plataformas antes de publicar]. Logos oficiais não foram obtidos (sem acesso aos kits de imprensa);
       por isso os nomes aparecem em texto, em cinza uniforme. Para usar logos, coloque os SVG oficiais e troque cada <li> por <img>. -->
  <div class="marcas" aria-labelledby="t-marcas">
    <div class="wrap">
      <p class="tit" id="t-marcas">Atendemos vendedores de:</p>
      <ul>{li}</ul>
      <p class="aviso-marcas">{AVISO_MARCAS}</p>
    </div>
  </div>
'''

def mkt_corpo():
    sit = [
     ('alert', 'Bloqueio por “análise de segurança”', 'Suspeita de fraude ou análise de segurança, sem prazo para terminar.'),
     ('file', 'Documentos que não resolvem', 'A plataforma pede documentos, você envia, e o bloqueio continua.'),
     ('star', 'Reclamações e reputação', 'Suspensão por excesso de reclamações ou queda de reputação.'),
     ('tag', 'Denúncia de marca', 'Denúncia de marca ou de propriedade intelectual contra os anúncios.'),
     ('link', 'Conta vinculada', 'A conta foi ligada a outra conta bloqueada.'),
     ('lock', 'Saldo preso no encerramento', 'Saldo retido depois do encerramento da conta.'),
    ]
    cards = ''.join(f'<div class="card"><span class="ic">{ic(i)}</span><h3>{t}</h3><p>{d}</p></div>' for i, t, d in sit)
    return f'''  <section class="sec" id="situacoes" aria-labelledby="t-sit">
    <div class="wrap">
      <div class="head"><p class="kicker">Situações</p><h2 id="t-sit">Situações que mais acontecem</h2></div>
      <div class="grid3">{cards}</div>
    </div>
  </section>
  <section class="sec sec-alt" id="direitos" aria-labelledby="t-dir">
    <div class="wrap">
      <div class="head"><p class="kicker">Seus direitos</p><h2 id="t-dir">O vendedor também tem direitos</h2></div>
      <div class="grid2">
        <div class="card"><span class="ic">{ic('shield')}</span><h3>Transparência e defesa</h3><p>A plataforma pode aplicar suas regras, mas precisa agir com transparência e boa-fé: informar o motivo de forma clara, permitir a defesa do vendedor e não reter por tempo indefinido valores sem relação com a suspeita.</p></div>
        <div class="card"><span class="ic">{ic('cart')}</span><h3>O dinheiro das vendas é do vendedor</h3><p>O dinheiro de vendas já concluídas é do vendedor. A retenção precisa de justificativa e de prazo razoável.</p></div>
      </div>
      <!-- [CONFIRMAR se o CDC se aplica ao perfil do vendedor antes de afirmar; por ora, "conforme o caso"] -->
      <p class="fonte" style="margin-top:16px">Base: boa-fé e função social do contrato (<a href="{CC}" target="_blank" rel="noopener">Código Civil, arts. 421 e 422</a>) e, conforme o caso, as regras de proteção do consumidor (<a href="{CDC}" target="_blank" rel="noopener">CDC</a>).</p>
      <div class="sec-cta">{wa_btn('direitos', 'Analisar o bloqueio da minha conta')}</div>
    </div>
  </section>
  <section class="sec" id="como-funciona" aria-labelledby="t-como">
    <div class="wrap">
      <div class="head"><p class="kicker">Como funciona</p><h2 id="t-como">Como a advogada atua</h2></div>
      <ol class="passos">
        <li><strong>Análise</strong><p>Você envia os prints das notificações, o histórico da conta e o valor retido.</p></li>
        <li><strong>Defesa e notificação</strong><p>Recurso na própria plataforma, quando cabível, e notificação extrajudicial pedindo o motivo, a reativação e a liberação do saldo.</p></li>
        <li><strong>Ação judicial</strong><p>Se não houver solução, ação com pedido de urgência para reativar a conta ou liberar os valores e, quando cabível, reparar os prejuízos.</p></li>
        <li><strong>Acompanhamento</strong><p>Acompanhamento até a resposta, com retorno direto da advogada.</p></li>
      </ol>
    </div>
  </section>
  <section class="sec sec-alt" id="quanto-antes" aria-labelledby="t-antes">
    <div class="wrap">
      <div class="head"><p class="kicker">Não espere</p><h2 id="t-antes">Quanto antes, melhor</h2></div>
      <div class="grid2">
        <div class="card"><span class="ic">{ic('clock')}</span><h3>Conta parada custa</h3><p>Cada dia de conta parada é venda perdida e reputação em risco.</p></div>
        <div class="card"><span class="ic">{ic('file')}</span><h3>Guarde as provas agora</h3><p>Prints das notificações, e-mails da plataforma, extrato do saldo e faturamento dos últimos meses.</p></div>
      </div>
    </div>
  </section>
{QUEM}  <section class="sec sec-alt" id="documentos" aria-labelledby="t-docs">
    <div class="wrap">
      <div class="head"><p class="kicker">Documentos</p><h2 id="t-docs">Documentos para começar</h2></div>
      <ul class="lista">
        <li>Prints e e-mails do bloqueio.</li>
        <li>Extrato do saldo retido.</li>
        <li>Relatório de vendas ou faturamento dos últimos 3 a 6 meses.</li>
        <li>CNPJ ou MEI, se houver.</li>
        <li>Histórico de reclamações ou mediações.</li>
      </ul>
    </div>
  </section>
'''

MKT_TRI = '''<script>
/* Triagem desta página: perguntas, mensagem do WhatsApp e tela de encerramento. */
window.TRIAGEM = {
  prefixo: 'MK',
  perguntas: [
    { id: 'valor', chave: 'faixa_valor', texto: 'Quanto está bloqueado ou retido, aproximadamente?',
      opcoes: [['ate3', 'Até R$ 3 mil'], ['3a20', 'De R$ 3 mil a R$ 20 mil'], ['20a100', 'De R$ 20 mil a R$ 100 mil'], ['acima100', 'Acima de R$ 100 mil'], ['naosei', 'Não sei o valor exato']] },
    { id: 'plataforma', chave: 'plataforma', texto: 'Qual plataforma?',
      opcoes: [['mercadolivre', 'Mercado Livre'], ['mercadopago', 'Mercado Pago'], ['shopee', 'Shopee'], ['amazon', 'Amazon'], ['magalu', 'Magalu'], ['shein', 'Shein'], ['tiktok', 'TikTok Shop'], ['outra', 'Outra']] },
    { id: 'situacao', chave: 'situacao', texto: 'O que aconteceu?',
      opcoes: [['suspensa', 'Conta suspensa'], ['retido', 'Saldo retido'], ['pausados', 'Anúncios pausados'], ['encerrada', 'Conta encerrada']] },
    { id: 'faturamento', chave: 'faturamento', texto: 'Faturamento mensal na plataforma?',
      opcoes: [['ate10', 'Até R$ 10 mil'], ['10a50', 'R$ 10 a 50 mil'], ['acima50', 'Acima de R$ 50 mil']] }
  ],
  mensagem: function (r, rot) {
    var v = { '3a20': 'cerca de R$ 3 a 20 mil', '20a100': 'cerca de R$ 20 a 100 mil', 'acima100': 'mais de R$ 100 mil', 'ate3': 'até R$ 3 mil' }[r.valor];
    var prep = { mercadolivre: 'no', mercadopago: 'no', shopee: 'na', amazon: 'na', magalu: 'na', shein: 'na', tiktok: 'no' }[r.plataforma];
    var onde = prep ? prep + ' ' + rot('plataforma') : (r.plataforma === 'outra' ? 'em outra plataforma' : 'em um marketplace');
    var t = 'Olá, Amanda! ' + (v ? 'Tenho ' + v + ' retidos ' + onde : 'Tenho valores retidos ' + onde + ', mas ainda não sei o valor exato');
    if (r.situacao) t += ', ' + rot('situacao').toLowerCase();
    var f = { ate10: 'até R$ 10 mil', '10a50': 'de R$ 10 a 50 mil', acima50: 'acima de R$ 50 mil' }[r.faturamento];
    if (f) t += ', faturo ' + f + ' por mês';
    return t + '.';
  },
  encerramento: '<p>Para valores até R$ 3 mil, os custos de uma atuação particular podem não compensar. Você pode registrar uma reclamação no consumidor.gov.br e, se não resolver, procurar o Juizado Especial Cível da sua cidade, onde causas de até 20 salários mínimos podem ser apresentadas sem advogado.</p>' +
    '<p>Se o valor retido aumentar, volte a falar com a gente.</p>' +
    /* [CONFIRMAR o link oficial de orientação sobre Juizados] */
    '<ul><li><a href="https://www.consumidor.gov.br" target="_blank" rel="noopener">Registrar reclamação no consumidor.gov.br</a></li>' +
    '<li><a href="https://www.cnj.jus.br/programas-e-acoes/juizados-especiais/" target="_blank" rel="noopener">Orientações sobre os Juizados Especiais (CNJ)</a></li></ul>'
};
</script>
'''

# ------------------------------------------------------------- montagem
def pagina_principal(pg, faq, corpo, tri_js, depois_hero=''):
    canonical = f"https://{pg['dominio']}/"
    final_txt = 'Vamos entender o que foi bloqueado na sua conta.' if pg['pagina'] == 'judicial' else 'Vamos entender o bloqueio da sua conta.'
    return (head(pg, pg['title'], pg['desc'], canonical, extra_ld=faq_ld(faq)) +
      '<body>\n' + cabecalho(pg) + '<main id="conteudo">\n' + hero(pg) + depois_hero + corpo + avaliacoes_sec() +
      f'''  <section class="sec" id="duvidas" aria-labelledby="t-faq">
    <div class="wrap">
      <div class="head"><p class="kicker">Dúvidas</p><h2 id="t-faq">Perguntas frequentes</h2></div>
      <div class="faq">
{faq_html(faq)}      </div>
    </div>
  </section>
  <section class="sec" style="padding-top:0" aria-labelledby="t-final">
    <div class="wrap">
      <div class="final">
        <h2 id="t-final">{final_txt}</h2>
        {wa_btn('final')}
      </div>
    </div>
  </section>
</main>
''' + rodape(pg) +
      f'<button type="button" class="wa-float oculto" id="wa-float" data-triagem="flutuante" aria-label="Falar com a advogada no WhatsApp">{WA_SVG}</button>\n' +
      triagem_dialog() + COOKIE +
      '<script>\n' + AVALIACOES_JS + '</script>\n' + AVAL_RENDER + tri_js + '<script>\n' + MOTOR + '</script>\n</body>\n</html>\n')

def privacidade(pg):
    canonical = f"https://{pg['dominio']}/privacidade/"
    corpo = f'''<main id="conteudo" class="sec">
  <article class="wrap" style="max-width:820px">
    <h1 style="font-size:clamp(1.9rem,6vw,2.6rem)">Política de privacidade</h1>
    <p class="fonte">Última atualização: outubro de 2026.</p>
    <p>Esta política explica, de forma simples, como são tratados os dados desta página, conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 – LGPD).</p>
    <h2>1. Quem é a responsável</h2>
    <p><strong>Amanda Regina Gonçalves Modus</strong> (Modus Advocacia), advogada inscrita na OAB/PR sob o nº 119.898, R. Quebec, 326, Jardim Canadá, Maringá-PR. Contato: <a href="mailto:amanda@modusadvocacia.com.br" data-ev="email_click" data-secao="privacidade">amanda@modusadvocacia.com.br</a>.</p>
    <h2>2. Quais dados são tratados</h2>
    <ul>
      <li><strong>Respostas da triagem:</strong> faixa de valor e as demais opções que você toca. A página não pede nome, telefone ou e-mail.</li>
      <li><strong>Origem da visita:</strong> identificadores de clique de anúncios (gclid, gbraid, wbraid, fbclid) e parâmetros de campanha (UTM), guardados num cookie próprio por 90 dias, com a página e a data de entrada.</li>
      <li><strong>Dados de navegação:</strong> páginas vistas, cliques, rolagem, tipo de aparelho e navegador.</li>
    </ul>
    <h2>3. Para que são usados</h2>
    <ul>
      <li>Encaminhar você ao WhatsApp da advogada com um resumo das suas respostas e um código de atendimento.</li>
      <li>Registrar o atendimento numa planilha interna do escritório, sem nome nem telefone, para saber de qual anúncio veio cada contato.</li>
      <li>Medir o desempenho da página e dos anúncios.</li>
    </ul>
    <h2>4. Ferramentas e compartilhamento</h2>
    <ul>
      <li><strong>Google Analytics 4 e Google Ads</strong> (Google): medição da página e dos anúncios.</li>
      <li><strong>Meta Pixel e API de Conversões</strong> (Meta): medição dos anúncios no Facebook e no Instagram. Só funcionam depois que você aceita os cookies.</li>
      <li><strong>Microsoft Clarity</strong> (Microsoft): mapas de calor e gravações anônimas da navegação, com os textos mascarados. Só funciona depois que você aceita os cookies.</li>
      <li><strong>Google Sheets</strong> (Google): planilha interna com o registro dos atendimentos.</li>
      <li><strong>WhatsApp</strong> (Meta): somente se você decidir abrir a conversa.</li>
    </ul>
    <p>Algumas dessas ferramentas podem armazenar dados fora do Brasil, observadas as garantias da LGPD. Os dados não são vendidos.</p>
    <h2>5. Cookies e consentimento</h2>
    <p>Os cookies de medição e publicidade só são usados depois do seu aceite. Se você recusar, a página continua funcionando, e o Google pode receber apenas sinais sem cookies, sem identificar você. A sua escolha fica guardada por 12 meses.</p>
    <p><button type="button" class="link-btn" id="mudar-cookies">Alterar minhas preferências de cookies</button></p>
    <h2>6. Bases legais e prazos</h2>
    <p>Consentimento (art. 7º, I, da LGPD) para cookies de medição e publicidade, e legítimo interesse (art. 7º, IX) para o registro interno da origem dos atendimentos. Os registros são mantidos pelo tempo necessário ao atendimento e às obrigações legais.</p>
    <h2>7. Seus direitos</h2>
    <p>Você pode pedir confirmação, acesso, correção, anonimização, eliminação e informações sobre o compartilhamento dos dados, e revogar o consentimento, pelo e-mail acima (art. 18 da LGPD). Também pode reclamar à ANPD.</p>
  </article>
</main>
'''
    script_cookie = '''<script>
(function () {
  var D = /(^|\\.)modusadvocacia\\.com\\.br$/.test(location.hostname) ? '; domain=.modusadvocacia.com.br' : '';
  var b = document.getElementById('cookie');
  if (!/(?:^|; )modus_consent=/.test(document.cookie)) b.hidden = false;
  Array.prototype.forEach.call(b.querySelectorAll('[data-cookie]'), function (btn) {
    btn.addEventListener('click', function () {
      var g = btn.getAttribute('data-cookie') === 'granted' ? 'granted' : 'denied';
      document.cookie = 'modus_consent=' + g + '; max-age=31536000; path=/' + D + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
      gtag('consent', 'update', { ad_storage: g, ad_user_data: g, ad_personalization: g, analytics_storage: g });
      if (g === 'granted') dataLayer.push({ event: 'consentimento_aceito' });
      b.hidden = true;
    });
  });
  document.getElementById('mudar-cookies').addEventListener('click', function () { b.hidden = false; b.querySelector('.ok').focus(); });
})();
</script>
'''
    return (head(pg, 'Política de privacidade | Modus Advocacia – OAB/PR 119.898', 'Como são tratados os dados desta página, conforme a LGPD.', canonical) +
            '<body>\n' + cabecalho(pg, home=False) + corpo + rodape(pg, home=False) + COOKIE + script_cookie + '</body>\n</html>\n')

def vercel_json(pg):
    return json.dumps({
      "trailingSlash": True,
      "headers": [
        {"source": "/fonts/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]},
        {"source": "/(.*)\\.(png|webp|svg)", "headers": [{"key": "Cache-Control", "value": "public, max-age=2592000"}]},
        {"source": "/(.*)", "headers": [
          {"key": "X-Content-Type-Options", "value": "nosniff"},
          {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}]},
        {"source": "/(.*)", "missing": [{"type": "host", "value": pg['dominio']}], "headers": [{"key": "X-Robots-Tag", "value": "noindex"}]}
      ]
    }, indent=2) + '\n'

CAPI = '''/*
 * Meta – API de Conversões: envia o evento Lead do servidor, com o mesmo event_id
 * (o código do atendimento) do Pixel, para a Meta descartar a duplicidade.
 * Configure na Vercel (Settings → Environment Variables):
 *   META_PIXEL_ID   = ID do Pixel
 *   META_CAPI_TOKEN = token de acesso da API de Conversões (Gerenciador de Eventos → Configurações)
 *   META_TEST_CODE  = (opcional) código de "Eventos de teste", só durante os testes
 * Sem as variáveis, a função não faz nada. Só é chamada depois do aceite dos cookies.
 */
module.exports = async function (req, res) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
  const pixel = process.env.META_PIXEL_ID, token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) { res.statusCode = 204; return res.end(); }
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  const eventId = String(b.event_id || '');
  if (!/^(DJ|MK)-\\d{4}$/.test(eventId)) { res.statusCode = 400; return res.end(); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const user = { client_ip_address: ip || undefined, client_user_agent: String(req.headers['user-agent'] || '').slice(0, 400) };
  if (/^fb\\.1\\.\\d+\\.\\d+$/.test(b.fbp || '')) user.fbp = b.fbp;
  if (/^fb\\.1\\.\\d+\\..+$/.test(b.fbc || '')) user.fbc = String(b.fbc).slice(0, 500);
  const corpo = {
    data: [{
      event_name: 'Lead', event_time: Math.floor(Date.now() / 1000), event_id: eventId, action_source: 'website',
      event_source_url: String(b.url || '').slice(0, 500), user_data: user,
      custom_data: { content_category: b.content_category === 'marketplace' ? 'marketplace' : 'judicial' }
    }]
  };
  if (process.env.META_TEST_CODE) corpo.test_event_code = process.env.META_TEST_CODE;
  try {
    const r = await fetch('https://graph.facebook.com/v21.0/' + encodeURIComponent(pixel) + '/events?access_token=' + encodeURIComponent(token), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo)
    });
    res.statusCode = r.ok ? 204 : 502;
  } catch (e) { res.statusCode = 502; }
  res.end();
};
'''

def escrever(pg, faq, corpo, tri, depois_hero=''):
    D = G + f"landing-{pg['slug']}/"
    os.makedirs(D + 'privacidade', exist_ok=True); os.makedirs(D + 'fonts', exist_ok=True); os.makedirs(D + 'api', exist_ok=True)
    open(D + 'index.html', 'w', encoding='utf-8').write(pagina_principal(pg, faq, corpo, tri, depois_hero))
    open(D + 'privacidade/index.html', 'w', encoding='utf-8').write(privacidade(pg))
    open(D + 'robots.txt', 'w').write(f"User-agent: *\nAllow: /\n\nSitemap: https://{pg['dominio']}/sitemap.xml\n")
    open(D + 'sitemap.xml', 'w').write(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://{pg['dominio']}/</loc><lastmod>2026-10-23</lastmod></url>
  <url><loc>https://{pg['dominio']}/privacidade/</loc><lastmod>2026-10-23</lastmod></url>
</urlset>
''')
    open(D + 'vercel.json', 'w').write(vercel_json(pg))
    open(D + 'api/meta-capi.js', 'w').write(CAPI)
    open(D + '.vercelignore', 'w').write('README.md\n')
    for f in ['manrope-700.woff2', 'manrope-800.woff2', 'inter-400.woff2', 'inter-600.woff2', 'LICENSE-Inter-OFL.txt', 'LICENSE-Manrope-OFL.txt']:
        shutil.copy(G + 'landing-bancario/fonts/' + f, D + 'fonts/' + f)
    shutil.copy(G + 'landing-bancario/logo-modus.png', D + 'logo-modus.png')
    shutil.copy(G + 'landing-cartorio/foto-amanda-profissional.webp', D + 'foto-amanda-modus.webp')

escrever(JUD, JUD_FAQ, jud_corpo(), JUD_TRI)
escrever(MKT, MKT_FAQ, mkt_corpo(), MKT_TRI, depois_hero=mkt_marcas())
print('ok')
