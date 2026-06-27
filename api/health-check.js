const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check missing environment variables
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM', 'SMTP_FROM_NAME'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  const diagnostics = {
    missingEnvironmentVariables: missing,
    smtpHost: process.env.SMTP_HOST || 'not configured',
    smtpPort: process.env.SMTP_PORT || 'not configured',
    smtpUser: process.env.SMTP_USER || 'not configured',
    stage: 'initialization'
  };

  if (missing.length > 0) {
    return res.status(400).json({
      status: 'failed',
      message: 'Missing required SMTP environment variables.',
      diagnostics
    });
  }

  try {
    diagnostics.stage = 'connection';
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000 // 5 seconds timeout for health check
    });

    diagnostics.stage = 'verify';
    // Verify connection configuration
    await transporter.verify();

    diagnostics.stage = 'test-send';
    // Send a test email to the user itself
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_USER,
      subject: 'Movana SMTP Health Check',
      text: 'This is an automated SMTP health check email from Movana.',
      html: '<p>This is an automated SMTP health check email from Movana.</p>'
    });

    return res.status(200).json({
      status: 'success',
      message: 'SMTP configuration verified and test email sent successfully.',
      messageId: info.messageId,
      diagnostics: {
        ...diagnostics,
        stage: 'complete',
        response: info.response
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: 'failed',
      message: error.message,
      diagnostics: {
        ...diagnostics,
        errorName: error.name,
        errorCode: error.code,
        errorCommand: error.command,
        errorMessage: error.message
      }
    });
  }
};
