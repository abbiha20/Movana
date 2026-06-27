const https = require('https');

module.exports = async (req, res) => {
  // Enforce CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse body safely
  let payload = {};
  if (typeof req.body === 'object') {
    payload = req.body;
  } else {
    try {
      payload = JSON.parse(req.body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON request body' });
    }
  }

  const { to, subject, html, text } = payload;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required parameters: to, subject, html' });
  }

  // Read environment keys
  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || (resendKey ? 'onboarding@resend.dev' : 'noreply@movana.com');

  if (!resendKey && !sendgridKey) {
    return res.status(500).json({ error: 'Mail delivery keys are not configured. Configure RESEND_API_KEY or SENDGRID_API_KEY in Vercel settings.' });
  }

  if (resendKey) {
    // Delivery via Resend API
    const data = JSON.stringify({
      from: `Movana Marketplace <${senderEmail}>`,
      to: [to],
      subject: subject,
      html: html,
      text: text || ''
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const reqPost = https.request(options, (resPost) => {
      let body = '';
      resPost.on('data', chunk => body += chunk);
      resPost.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (resPost.statusCode >= 200 && resPost.statusCode < 300) {
            return res.status(200).json({ provider: 'resend', response: parsed });
          } else {
            return res.status(resPost.statusCode).json({ error: parsed.message || 'Resend API returned failure' });
          }
        } catch (e) {
          return res.status(resPost.statusCode).json({ error: `Resend response parsing failed: ${body}` });
        }
      });
    });

    reqPost.on('error', (err) => {
      return res.status(500).json({ error: `Connection to Resend failed: ${err.message}` });
    });

    reqPost.write(data);
    reqPost.end();

  } else if (sendgridKey) {
    // Delivery via SendGrid API
    const data = JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: senderEmail, name: 'Movana Marketplace' },
      subject: subject,
      content: [
        { type: 'text/plain', value: text || '' },
        { type: 'text/html', value: html }
      ]
    });

    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const reqPost = https.request(options, (resPost) => {
      let body = '';
      resPost.on('data', chunk => body += chunk);
      resPost.on('end', () => {
        if (resPost.statusCode >= 200 && resPost.statusCode < 300) {
          return res.status(200).json({ provider: 'sendgrid', message: 'Mail sent successfully' });
        } else {
          try {
            const parsed = JSON.parse(body);
            return res.status(resPost.statusCode).json({ error: parsed.errors || 'SendGrid API returned failure' });
          } catch (e) {
            return res.status(resPost.statusCode).json({ error: `SendGrid response failed: ${resPost.statusCode}` });
          }
        }
      });
    });

    reqPost.on('error', (err) => {
      return res.status(500).json({ error: `Connection to SendGrid failed: ${err.message}` });
    });

    reqPost.write(data);
    reqPost.end();
  }
};
