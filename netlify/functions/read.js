// ============================================================
// Netlify Function — read.js
// يدعم:
//   ?action=stats
//   ?action=search&by=ref&q=DAL-2026-DB-123456
//   ?action=search&by=combo&name=محمد أحمد...&doc=123456
// ============================================================

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': process.env.SITE_URL || '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS')
    return { statusCode: 200, headers: cors, body: '' };

  if (event.httpMethod !== 'GET')
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'GET فقط' }) };

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
  if (!GOOGLE_SCRIPT_URL)
    return { statusCode: 500, headers: cors,
             body: JSON.stringify({ status: 'ERROR', msg: 'GOOGLE_SCRIPT_URL غير مضبوط' }) };

  try {
    const p = event.queryStringParameters || {};

    // ── إحصائيات ──
    if (p.action === 'stats') {
      const res  = await fetch(`${GOOGLE_SCRIPT_URL}?action=stats`);
      const data = await res.json();
      return { statusCode: 200, headers: cors, body: JSON.stringify(data) };
    }

    // ── بحث ──
    if (p.action === 'search') {

      // طريقة 1: الرقم المرجعي — مطابقة كاملة تماماً
      if (p.by === 'ref') {
        if (!p.q || p.q.trim().length < 10)
          return { statusCode: 400, headers: cors,
                   body: JSON.stringify({ status: 'ERROR', msg: 'الرقم المرجعي غير صحيح' }) };

        const res  = await fetch(`${GOOGLE_SCRIPT_URL}?action=search&by=ref&q=${encodeURIComponent(p.q.trim())}`);
        const data = await res.json();
        return { statusCode: 200, headers: cors, body: JSON.stringify(data) };
      }

      // طريقة 2: الاسم + رقم الوثيقة — كلاهما مطلوب ومطابقة دقيقة
      if (p.by === 'combo') {
        const name = (p.name || '').trim();
        const doc  = (p.doc  || '').trim();

        if (!name || !doc)
          return { statusCode: 400, headers: cors,
                   body: JSON.stringify({ status: 'ERROR', msg: 'الاسم ورقم الوثيقة مطلوبان معاً' }) };

        // الحد الأدنى: اسمان على الأقل (أول + أب)
        if (name.split(' ').filter(Boolean).length < 2)
          return { statusCode: 400, headers: cors,
                   body: JSON.stringify({ status: 'ERROR', msg: 'أدخل الاسم كاملاً' }) };

        const url  = `${GOOGLE_SCRIPT_URL}?action=search&by=combo`
                   + `&name=${encodeURIComponent(name)}&doc=${encodeURIComponent(doc)}`;
        const res  = await fetch(url);
        const data = await res.json();
        return { statusCode: 200, headers: cors, body: JSON.stringify(data) };
      }

      return { statusCode: 400, headers: cors,
               body: JSON.stringify({ status: 'ERROR', msg: 'by غير صحيح' }) };
    }

    return { statusCode: 400, headers: cors,
             body: JSON.stringify({ status: 'ERROR', msg: 'action غير معروف' }) };

  } catch(err) {
    console.error('read error:', err.message);
    return { statusCode: 500, headers: cors,
             body: JSON.stringify({ status: 'ERROR', msg: 'خطأ في الخادم' }) };
  }
};
