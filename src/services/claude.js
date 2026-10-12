const Anthropic = require('@anthropic-ai/sdk');
const { config } = require('./config');

const anthropic = new Anthropic({
  apiKey: config.claudeApiKey
});

async function getClaudeReply({ message, context = '' }) {
  if (!config.claudeApiKey) {
    throw new Error('CLAUDE_API_KEY is missing. Add it to your .env file.');
  }

  const systemPrompt = context || 'You are a professional assistant helping a user manage LinkedIn interactions. Keep responses warm, concise, and professional.';

  const result = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: message
      }
    ]
  });

  const text = result.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  return text;
}

module.exports = { getClaudeReply };
