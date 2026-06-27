// api/auth/callback.js
// Handles the OAuth callback from Google or Apple, exchanges the code for user info,
// and posts user info back to the parent window.

module.exports = async (req, res) => {
  // Support CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback`;

  // Determine provider by req.query or req.body state
  // Google redirects with GET query params: code, state
  // Apple redirects with POST body params: code, state, user
  let code = '';
  let state = '';
  let provider = 'google';
  let appleUser = null; // Apple user name/email info is only sent in the first login POST in `user` param

  if (req.method === 'POST') {
    // Parse body for Apple POST response
    const body = req.body || {};
    code = body.code;
    state = body.state;
    provider = 'apple';
    if (body.user) {
      try {
        appleUser = typeof body.user === 'string' ? JSON.parse(body.user) : body.user;
      } catch (e) {
        console.error("Failed to parse Apple user info:", e);
      }
    }
  } else {
    // GET request (Google callback)
    const query = req.query || {};
    code = query.code;
    state = query.state;
    // Determine provider from state parameter
    if (state && state.startsWith('apple')) {
      provider = 'apple';
    } else {
      provider = 'google';
    }
  }

  if (!code) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/html');
    res.end(renderErrorHtml('Authentication failed: missing authorization code.'));
    return;
  }

  try {
    let email = '';
    let name = '';
    let picture = '';

    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      // Exchange code for Google tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Google token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Fetch user info from Google API
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch Google user info.');
      }

      const userData = await userInfoResponse.json();
      email = userData.email;
      name = userData.name || userData.given_name || email.split('@')[0];
      picture = userData.picture || '';

    } else if (provider === 'apple') {
      const clientId = process.env.APPLE_CLIENT_ID;
      const clientSecret = process.env.APPLE_CLIENT_SECRET;

      // Exchange code for Apple tokens
      const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Apple token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      const idToken = tokenData.id_token;

      // Decode Apple ID Token (JWT) to get user identifier & email
      // A standard JWT has 3 parts: header, payload, signature
      const payloadBase64 = idToken.split('.')[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);

      email = payload.email;
      
      // Apple only returns name info once (in req.body.user during the very first sign-in consent)
      if (appleUser && appleUser.name) {
        name = `${appleUser.name.firstName || ''} ${appleUser.name.lastName || ''}`.trim();
      }
      if (!name) {
        name = email ? email.split('@')[0] : 'Apple User';
      }
    }

    // Success! Render HTML page that transmits data and closes popup
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(renderSuccessHtml(provider, email, name, picture));

  } catch (err) {
    console.error("OAuth callback error:", err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end(renderErrorHtml(err.message));
  }
};

// HTML templates to render inside the popup
function renderSuccessHtml(provider, email, name, picture) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connecting...</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding-top: 50px; background-color: #f8fafc; color: #0f172a; }
        .spinner { border: 3px solid #e2e8f0; border-top: 3px solid #1a73e8; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <h2>Sign in successful!</h2>
      <p>Returning you to Movana...</p>
      <div class="spinner"></div>
      <script>
        const profile = {
          email: ${JSON.stringify(email)},
          name: ${JSON.stringify(name)},
          avatar: ${JSON.stringify(picture)},
          provider: ${JSON.stringify(provider)}
        };
        if (window.opener) {
          window.opener.postMessage({
            type: 'social-auth-verified',
            user: profile
          }, window.location.origin);
        } else {
          console.error("Parent window opener not found.");
        }
        window.close();
      </script>
    </body>
    </html>
  `;
}

function renderErrorHtml(errorMessage) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Error</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px 20px; background-color: #fff5f5; color: #c53030; }
        .card { max-width: 400px; margin: 0 auto; background: white; border: 1px solid #fed7d7; padding: 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h2 { margin-top: 0; }
        button { background: #c53030; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: 600; cursor: pointer; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Authentication Error</h2>
        <p>${escapeHtml(errorMessage)}</p>
        <button onclick="window.close()">Close Window</button>
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
