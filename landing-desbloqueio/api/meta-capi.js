/*
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
  if (!/^(DJ|MK)-\d{4}$/.test(eventId)) { res.statusCode = 400; return res.end(); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const user = { client_ip_address: ip || undefined, client_user_agent: String(req.headers['user-agent'] || '').slice(0, 400) };
  if (/^fb\.1\.\d+\.\d+$/.test(b.fbp || '')) user.fbp = b.fbp;
  if (/^fb\.1\.\d+\..+$/.test(b.fbc || '')) user.fbc = String(b.fbc).slice(0, 500);
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
