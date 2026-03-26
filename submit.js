// ============================================================
// Netlify Serverless Function — submit.js
// رابط Google Sheet محفوظ كـ Environment Variable
// لا أحد يستطيع رؤيته من المتصفح
// ============================================================

exports.handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ip = event.headers['x-forwarded-for'] || 'unknown';

  try {
    const data = JSON.parse(event.body);

    // التحقق من الحقول الأساسية فقط (بدون nationalId)
    const required = ['refNum', 'qaidNum', 'personName', 'neighborhood'];
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `حقل مطلوب: ${field}` })
        };
      }
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    if (!GOOGLE_SCRIPT_URL) {
      console.error('GOOGLE_SCRIPT_URL not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'خطأ في إعداد السيرفر' })
      };
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Google Script error: ${response.status}`);
    }

    console.log(`New registration: ${data.refNum} | Doc: ${data.docType} | IP: ${ip}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.SITE_URL || '*',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify({ status: 'OK', ref: data.refNum })
    };

  } catch (error) {
    console.error('Function error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'خطأ في الخادم، حاول مجدداً' })
    };
  }
};
