// Cloudflare Pages Function: POST /api/contact
// Sends the contact form to the inbox via Resend (https://resend.com).
// Environment variables (Cloudflare Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY  required, secret
//   CONTACT_TO      optional, default muai2005@naver.com
//   CONTACT_FROM    optional, default "트러스트브릿지 문의 <onboarding@resend.dev>"

var SERVICES = { mes: '클라우드 MES 전환', auto: '사무업무 자동화', web: '홈페이지·앱 제작' };
var LIMITS = { company: 100, name: 50, phone: 30, email: 120, message: 3000 };

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function clean(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function onRequestPost(context) {
  var env = context.env;
  var data;
  try {
    data = await context.request.json();
  } catch (e) {
    return json({ ok: false, error: 'invalid_body' }, 400);
  }

  // Honeypot: real visitors never fill this hidden field.
  if (data.website) { return json({ ok: true }); }

  var f = {
    company: clean(data.company, LIMITS.company),
    name: clean(data.name, LIMITS.name),
    phone: clean(data.phone, LIMITS.phone),
    email: clean(data.email, LIMITS.email),
    message: clean(data.message, LIMITS.message)
  };
  var services = (Array.isArray(data.services) ? data.services : [])
    .filter(function (id) { return SERVICES.hasOwnProperty(id); })
    .map(function (id) { return SERVICES[id]; });

  if (!f.name || !f.phone || data.agree !== true) {
    return json({ ok: false, error: 'missing_fields' }, 400);
  }
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }
  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: 'not_configured' }, 500);
  }

  var rows = [
    ['관심 서비스', services.join(', ') || '-'],
    ['회사명', f.company || '-'],
    ['담당자명', f.name],
    ['연락처', f.phone],
    ['이메일', f.email || '-']
  ];
  var html =
    '<h2 style="margin:0 0 16px;font-size:18px">새 상담 신청이 접수되었습니다</h2>' +
    '<table cellpadding="8" style="border-collapse:collapse;font-size:14px">' +
    rows.map(function (r) {
      return '<tr><th align="left" style="background:#F4F5F7;border:1px solid #E3E6EA;white-space:nowrap">' + r[0] +
        '</th><td style="border:1px solid #E3E6EA">' + escapeHtml(r[1]) + '</td></tr>';
    }).join('') +
    '</table>' +
    '<h3 style="margin:24px 0 8px;font-size:15px">문의 내용</h3>' +
    '<div style="white-space:pre-wrap;font-size:14px;line-height:1.6">' + escapeHtml(f.message || '-') + '</div>';
  var text = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + '\n\n문의 내용:\n' + (f.message || '-');

  var mail = {
    from: env.CONTACT_FROM || '트러스트브릿지 문의 <onboarding@resend.dev>',
    to: [env.CONTACT_TO || 'muai2005@naver.com'],
    subject: '[상담 신청] ' + (f.company ? f.company + ' · ' : '') + f.name,
    html: html,
    text: text
  };
  if (f.email) { mail.reply_to = f.email; }

  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'authorization': 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify(mail)
  });
  if (!res.ok) {
    console.log('Resend error', res.status, await res.text());
    return json({ ok: false, error: 'send_failed' }, 502);
  }
  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
