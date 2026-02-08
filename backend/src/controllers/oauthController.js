const pool = require('../config/db');
const oauthService = require('../services/oauthService');
const jwt = require('jsonwebtoken');

exports.googleStart = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      const redirectBase = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${redirectBase}/auth/google/callback?error=missing_code`);
    }

    const tokenResp = await oauthService.exchangeCode(code);
    const idToken = tokenResp.id_token;
    const profile = oauthService.decodeIdToken(idToken);

    if (!profile || !profile.sub) return res.status(400).send('Invalid id_token');

    // upsert user by google_sub or email
    const googleSub = profile.sub;
    const email = profile.email;
    const name = profile.name || profile.email;

    let userRes = await pool.query('SELECT * FROM users WHERE google_sub=$1 OR email=$2', [googleSub, email]);
    let user;
    if (userRes.rows.length) {
      user = userRes.rows[0];
      // ensure google_sub is set
      await pool.query('UPDATE users SET google_sub=$1, auth_provider=$2 WHERE id=$3', [googleSub, 'google', user.id]);
    } else {
      const insert = await pool.query(
        `INSERT INTO users(name,email,auth_provider,google_sub)
         VALUES($1,$2,$3,$4) RETURNING id,name,email`,
        [name, email, 'google', googleSub]
      );
      user = insert.rows[0];
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // redirect to frontend callback with token in query string
    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${redirectBase}/auth/google/callback?token=${encodeURIComponent(token)}`;
    return res.redirect(redirectUrl);
  } catch (e) {
    console.error('Google callback error', e.message || e);
    const redirectBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${redirectBase}/auth/google/callback?error=oauth_failed`);
  }
};
