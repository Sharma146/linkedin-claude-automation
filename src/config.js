require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  claudeApiKey: process.env.CLAUDE_API_KEY,
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/linkedin/callback',
    stateSecret: process.env.LINKEDIN_STATE_SECRET || 'dev-state-secret'
  }
};

module.exports = { config };
