import json
import os
D = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')) + '/'
nid = iter(range(1, 1000))
def T(k, v): return {"type": "TEMPLATE", "key": k, "value": v}
def B(k, v): return {"type": "BOOLEAN", "key": k, "value": "true" if v else "false"}
variaveis, acionadores, tags = [], [], []
def const(nome, valor):
    variaveis.append({"accountId": "0", "containerId": "0", "variableId": str(next(nid)), "name": nome, "type": "c", "parameter": [T("value", valor)]})
def dlv(chave):
    variaveis.append({"accountId": "0", "containerId": "0", "variableId": str(next(nid)), "name": "dlv - " + chave, "type": "v",
                      "parameter": [{"type": "INTEGER", "key": "dataLayerVersion", "value": "2"}, B("setDefaultValue", False), T("name", chave)]})
const("const - GA4_ID", "G-VVFXJ8YE64")
const("const - ADS_ID", "AW-18256148045")
const("const - Ads rótulo Lead Judicial", "SQaSCPiznacdEM3smoFE")
const("const - Ads rótulo Lead Marketplace", "QUhZCPuznacdEM3smoFE")
const("const - Ads rótulo Ligação", "ROTULO_LIGACAO")
const("const - META_PIXEL_ID", "PREENCHER")
const("const - CLARITY_ID", "PREENCHER")
PARAMS = ["pagina", "secao", "texto_botao", "etapa", "resposta", "qualificado", "respostas", "lead_id", "faixa_valor",
          "origem_dinheiro", "quando_bloqueio", "plataforma", "situacao", "faturamento", "pergunta", "percentual", "destino"]
for p in PARAMS: dlv(p)

def ce(nome, evento, filtros=()):
    tid = str(next(nid))
    t = {"accountId": "0", "containerId": "0", "triggerId": tid, "name": nome, "type": "CUSTOM_EVENT",
         "customEventFilter": [{"type": "EQUALS", "parameter": [T("arg0", "{{_event}}"), T("arg1", evento)]}]}
    if filtros:
        t["filter"] = [{"type": "EQUALS", "parameter": [T("arg0", "{{dlv - %s}}" % k), T("arg1", v)]} for k, v in filtros]
    acionadores.append(t); return tid
EVENTOS = ["cta_click", "triagem_inicio", "triagem_etapa", "triagem_concluida", "whatsapp_click", "lead_desqualificado", "phone_click",
           "email_click", "google_reviews_click", "faq_open", "scroll_depth", "cross_page_click"]
ids = {e: ce("CE - " + e, e) for e in EVENTOS}
t_lead_jud = ce("CE - whatsapp_click (judicial)", "whatsapp_click", [("pagina", "judicial")])
t_lead_mkt = ce("CE - whatsapp_click (marketplace)", "whatsapp_click", [("pagina", "marketplace")])
t_aceite = ce("CE - consentimento_aceito", "consentimento_aceito")
t_scroll50 = ce("CE - scroll_depth 50", "scroll_depth", [("percentual", "50")])
INIT = "2147479573"     # Inicialização - Todas as páginas
ALL = "2147479553"      # Todas as páginas

def tag(nome, tipo, params, gatilhos, consent=None, setup=None, uma_vez=False):
    t = {"accountId": "0", "containerId": "0", "tagId": str(next(nid)), "name": nome, "type": tipo, "parameter": params,
         "firingTriggerId": gatilhos, "tagFiringOption": "ONCE_PER_LOAD" if uma_vez else "ONCE_PER_EVENT"}
    if consent:
        t["consentSettings"] = {"consentStatus": "NEEDED", "consentType": {"type": "LIST", "list": [{"type": "TEMPLATE", "value": c} for c in consent]}}
    else:
        t["consentSettings"] = {"consentStatus": "NOT_NEEDED"}
    if setup: t["setupTag"] = [{"tagName": setup, "stopOnSetupFailure": True}]
    tags.append(t)

tag("Google tag - GA4", "googtag", [T("tagId", "{{const - GA4_ID}}")], [INIT])
tag("Google tag - Google Ads", "googtag", [T("tagId", "{{const - ADS_ID}}")], [INIT])
tag("Google Ads - Vinculador de conversões", "gclidw", [B("enableCrossDomain", False), B("enableUrlPassthrough", True), B("enableCookieOverrides", False)], [ALL])
tabela = {"type": "LIST", "key": "eventSettingsTable", "list": [{"type": "MAP", "map": [T("parameter", p), T("parameterValue", "{{dlv - %s}}" % p)]} for p in PARAMS]}
tag("GA4 - eventos da página", "gaawe", [T("eventName", "{{Event}}"), T("measurementIdOverride", "{{const - GA4_ID}}"), B("sendEcommerceData", False), tabela], [ids[e] for e in EVENTOS])
def awct(nome, rotulo, gatilho, pedido=True):
    p = [T("conversionId", "{{const - ADS_ID}}"), T("conversionLabel", "{{const - %s}}" % rotulo), B("enableConversionLinker", True), B("enableNewCustomerReporting", False), B("enableProductReporting", False), B("rdp", False)]
    if pedido: p.append(T("orderId", "{{dlv - lead_id}}"))
    tag(nome, "awct", p, [gatilho])
awct("Google Ads - Lead WhatsApp - Judicial", "Ads rótulo Lead Judicial", t_lead_jud)
awct("Google Ads - Lead WhatsApp - Marketplace", "Ads rótulo Lead Marketplace", t_lead_mkt)
awct("Google Ads - Ligação pelo site", "Ads rótulo Ligação", ids["phone_click"], pedido=False)

def html(nome, codigo, gatilhos, consent, setup=None, uma_vez=False):
    tag(nome, "html", [T("html", codigo), B("supportDocumentWrite", False)], gatilhos, consent, setup, uma_vez)
PIXEL = """<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '{{const - META_PIXEL_ID}}');
fbq('track', 'PageView');
</script>"""
html("Meta Pixel - base (PageView)", PIXEL, [ALL, t_aceite], ["ad_storage"], uma_vez=True)
html("Meta - Lead", "<script>fbq('track','Lead',{content_category:{{dlv - pagina}}},{eventID:{{dlv - lead_id}}});</script>", [ids["whatsapp_click"]], ["ad_storage"], "Meta Pixel - base (PageView)")
html("Meta - LeadDesqualificado", "<script>fbq('trackCustom','LeadDesqualificado',{content_category:{{dlv - pagina}},faixa_valor:{{dlv - faixa_valor}}});</script>", [ids["lead_desqualificado"]], ["ad_storage"], "Meta Pixel - base (PageView)")
html("Meta - Contact", "<script>fbq('track','Contact');</script>", [ids["phone_click"]], ["ad_storage"], "Meta Pixel - base (PageView)")
html("Meta - ViewContent (50%)", "<script>fbq('track','ViewContent',{content_category:{{dlv - pagina}}});</script>", [t_scroll50], ["ad_storage"], "Meta Pixel - base (PageView)")
CLARITY = """<script>
(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","{{const - CLARITY_ID}}");
</script>"""
html("Microsoft Clarity", CLARITY, [ALL, t_aceite], ["analytics_storage"], uma_vez=True)

cont = {"exportFormatVersion": 2, "exportTime": "2026-10-23 12:00:00",
        "containerVersion": {"path": "accounts/0/containers/0/versions/0", "accountId": "0", "containerId": "0", "containerVersionId": "0",
                             "container": {"path": "accounts/0/containers/0", "accountId": "0", "containerId": "0", "name": "Modus - desbloqueio e marketplace", "publicId": "GTM-XXXXXXX", "usageContext": ["WEB"]},
                             "tag": tags, "trigger": acionadores, "variable": variaveis,
                             "builtInVariable": [{"accountId": "0", "containerId": "0", "type": "EVENT", "name": "Event"}, {"accountId": "0", "containerId": "0", "type": "PAGE_URL", "name": "Page URL"}]}}
open(D + 'gtm-conteiner-modus.json', 'w').write(json.dumps(cont, ensure_ascii=False, indent=1))
open(D + 'modelo-importacao-google-ads.csv', 'w').write('Parameters:TimeZone=America/Sao_Paulo,,,,\nGoogle Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency\nTESTE123,Cliente fechado - Judicial,2026-10-30 15:00:00,1500,BRL\n')
open(D + 'modelo-importacao-meta.csv', 'w').write('event_name,event_time,event_id,value,currency,fbc,fbp,action_source,content_category\nPurchase,1793386800,DJ-4821,1500,BRL,,fb.1.1792771236155.4501017347,system_generated,judicial\n')
print(len(tags), 'tags,', len(acionadores), 'acionadores,', len(variaveis), 'variáveis')
