const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_REDIRECT_URI } = process.env;

async function exchangeCode(code) {
  const url = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('client_id', GOOGLE_CLIENT_ID);
  params.append('client_secret', GOOGLE_CLIENT_SECRET);
  params.append('redirect_uri', OAUTH_REDIRECT_URI);
  params.append('grant_type', 'authorization_code');

  const res = await fetch(url, { method: 'POST', body: params });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed exchanging code: ${res.status} ${txt}`);
  }

  const data = await res.json();
  return data; // contains access_token, id_token, refresh_token
}

function decodeIdToken(id_token) {
  // decode without verification (we trust Google here because token endpoint was used)
  const decoded = jwt.decode(id_token);
  return decoded;
}

module.exports = {
  exchangeCode,
  decodeIdToken
};
