// api/auth/login.js
// Initiates the OAuth 2.0 flow for Google or Apple.

module.exports = async (req, res) => {
  // Support CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const { provider } = req.query || {};

  if (!provider || (provider !== 'google' && provider !== 'apple')) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid or missing provider parameter. Expected "google" or "apple".' }));
    return;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback`;

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Check if configured
    if (!clientId || !clientSecret) {
      // Redirect to diagnostics page
      const missing = [];
      if (!clientId) missing.push('GOOGLE_CLIENT_ID');
      if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
      
      const diagnosticsUrl = `${appUrl}/social-login-diagnostics.html?provider=google&missing=${missing.join(',')}`;
      res.statusCode = 302;
      res.setHeader('Location', diagnosticsUrl);
      res.end();
      return;
    }

    // Redirect to Google Consent screen
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=google_auth_state` +
      `&prompt=select_account`;

    res.statusCode = 302;
    res.setHeader('Location', googleAuthUrl);
    res.end();
  } else if (provider === 'apple') {
    const clientId = process.env.APPLE_CLIENT_ID;
    const clientSecret = process.env.APPLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      const missing = [];
      if (!clientId) missing.push('APPLE_CLIENT_ID');
      if (!clientSecret) missing.push('APPLE_CLIENT_SECRET');
      
      const diagnosticsUrl = `${appUrl}/social-login-diagnostics.html?provider=apple&missing=${missing.join(',')}`;
      res.statusCode = 302;
      res.setHeader('Location', diagnosticsUrl);
      res.end();
      return;
    }

    // Redirect to Apple Sign In screen
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('name email')}` +
      `&state=apple_auth_state` +
      `&response_mode=form_post`; // Apple redirects with POST if name/email is requested

    res.statusCode = 302;
    res.setHeader('Location', appleAuthUrl);
    res.end();
  }
};
