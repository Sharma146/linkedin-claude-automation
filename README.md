# LinkedIn + Claude Automation Starter

This repository is a starter project for integrating Anthropic Claude with LinkedIn for automated message handling and connection workflows.

It includes:
- LinkedIn OAuth 2.0 starter flow
- Claude API integration
- Express server endpoints
- sample automation for drafting replies to incoming LinkedIn messages
- environment configuration

Important: LinkedIn's messaging and connection APIs are tightly controlled and may require app approval, specific scopes, and compliance review. This starter is designed to help you build the integration and validate the flow, not to bypass LinkedIn restrictions.

## Features

- LinkedIn login with OAuth 2.0
- Claude message drafting for inbound LinkedIn messages
- Endpoint to send a generated reply back to LinkedIn
- Health checks and demo automation routes
- Ready-to-edit project structure

## Tech Stack

- Node.js
- Express
- Axios
- Anthropic SDK

## Prerequisites

- Node.js 18+
- A LinkedIn Developer app
- A Claude API key from Anthropic
- A valid redirect URI configured in LinkedIn

## Setup

1. Clone the repo
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

4. Start the app:

```bash
npm run dev
```

5. Open the app and begin the LinkedIn OAuth flow:

```bash
http://localhost:3000/api/linkedin/auth
```

## Required environment variables

```env
PORT=3000
CLAUDE_API_KEY=your_claude_api_key
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
LINKEDIN_STATE_SECRET=change_this_value
```

## LinkedIn app setup

1. Go to https://www.linkedin.com/developers/
2. Create an app
3. Add a redirect URL matching your app callback
4. Request the scopes needed for your use case
5. Save the client ID and secret

Common scopes include:
- `r_liteprofile`
- `r_emailaddress`
- `w_member_social`
- `rw_organization_admin`

Note: direct message automation availability depends on LinkedIn review and current API access.

## Endpoints

### GET /api/health
Returns service status.

### GET /api/linkedin/auth
Starts the LinkedIn OAuth flow and returns the auth URL.

### GET /api/linkedin/callback
Handles the LinkedIn OAuth callback and exchanges the code for tokens.

### POST /api/claude/reply
Generates a Claude-crafted response from a message.

Example body:

```json
{
  "message": "Hi, I'd love to connect and discuss a potential partnership.",
  "context": "Act as a helpful business development assistant. Keep the answer concise and professional."
}
```

### POST /api/linkedin/send-message
Sends a message via the LinkedIn API when your app has the required permissions.

Example body:

```json
{
  "accessToken": "TOKEN",
  "recipientUrn": "urn:li:person:abc123",
  "text": "Thanks for reaching out! I'd be happy to connect."
}
```

### POST /api/automation/handle-incoming-message
Example workflow for:
- receiving a LinkedIn message
- generating a Claude response
- optionally sending the message back through LinkedIn

## Security notes

- Never commit real credentials to GitHub
- Use environment variables
- Store tokens securely if you continue this into production
- Review LinkedIn policies and API restrictions before automating outreach or messaging

## Deployment

This starter is ready to deploy to Render, Railway, Fly.io, or Heroku.

## Disclaimer

This project is for development and experimentation. LinkedIn enforces strict rules around automation, messaging, and account behavior. Use this responsibly and ensure your app complies with LinkedIn's developer policies.

## License

MIT
