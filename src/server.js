const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { config } = require('./config');
const { getClaudeReply } = require('./services/claude');
const {
  buildLinkedInAuthUrl,
  generateState,
  exchangeCodeForAccessToken,
  getLinkedInProfile,
  getRecentMessages,
  sendLinkedInMessage
} = require('./services/linkedin');

const app = express();
app.use(cors());
app.use(express.json());

const stateStore = new Map();
const tokenStore = new Map();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'linkedin-claude-automation' });
});

app.get('/api/linkedin/auth', (req, res) => {
  if (!config.linkedin.clientId || !config.linkedin.clientSecret) {
    return res.status(500).json({
      error: 'Missing LinkedIn credentials. Check your .env file.'
    });
  }

  const state = generateState();
  stateStore.set(state, Date.now());

  const authUrl = buildLinkedInAuthUrl(state);

  return res.json({ authUrl });
});

app.get('/api/linkedin/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error, message: 'LinkedIn denied the authorization request.' });
  }

  if (!state || !stateStore.has(state)) {
    return res.status(400).json({ error: 'Invalid OAuth state.' });
  }

  try {
    const tokenData = await exchangeCodeForAccessToken(code);
    const profile = await getLinkedInProfile(tokenData.access_token);

    const sessionId = crypto.randomUUID();
    tokenStore.set(sessionId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      profile
    });

    stateStore.delete(state);

    return res.json({
      message: 'LinkedIn authentication successful',
      sessionId,
      profile,
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in
      }
    });
  } catch (err) {
    console.error('LinkedIn callback error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Failed to exchange code for LinkedIn access token.',
      details: err.response?.data || err.message
    });
  }
});

app.post('/api/claude/reply', async (req, res) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'A message body is required.' });
  }

  try {
    const reply = await getClaudeReply({ message, context });
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate a Claude response.', details: err.message });
  }
});

app.get('/api/linkedin/messages', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');

  if (!accessToken) {
    return res.status(400).json({ error: 'An access token is required in the Authorization header.' });
  }

  try {
    const messages = await getRecentMessages(accessToken);
    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch LinkedIn messages.', details: err.response?.data || err.message });
  }
});

app.post('/api/linkedin/send-message', async (req, res) => {
  const { accessToken, recipientUrn, text } = req.body;

  if (!accessToken || !recipientUrn || !text) {
    return res.status(400).json({ error: 'accessToken, recipientUrn, and text are required.' });
  }

  try {
    const result = await sendLinkedInMessage({ accessToken, recipientUrn, text });
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send LinkedIn message.', details: err.response?.data || err.message });
  }
});

app.post('/api/automation/handle-incoming-message', async (req, res) => {
  const { message, accessToken, recipientUrn, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Incoming message is required.' });
  }

  try {
    const reply = await getClaudeReply({ message, context });

    const sendResult = accessToken && recipientUrn
      ? await sendLinkedInMessage({ accessToken, recipientUrn, text: reply })
      : null;

    return res.json({
      reply,
      sentToLinkedIn: Boolean(sendResult),
      sendResult
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to handle incoming LinkedIn message.', details: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
