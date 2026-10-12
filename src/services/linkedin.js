const axios = require('axios');
const crypto = require('crypto');
const { config } = require('../config');

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';

// Build OAuth authorization URL
function buildLinkedInAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.linkedin.clientId,
    redirect_uri: config.linkedin.redirectUri,
    state,
    scope: 'r_liteprofile r_emailaddress w_member_social rw_organization_admin'
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

// Generate secure state token
function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

// Exchange authorization code for access token
async function exchangeCodeForAccessToken(code) {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.linkedin.redirectUri,
      client_id: config.linkedin.clientId,
      client_secret: config.linkedin.clientSecret
    });

    const response = await axios.post(LINKEDIN_TOKEN_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    throw new Error(`Failed to exchange code: ${error.response?.data?.error_description || error.message}`);
  }
}

// Get LinkedIn profile information
async function getLinkedInProfile(accessToken) {
  try {
    const response = await axios.get(`${LINKEDIN_API_BASE}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error.response?.data || error.message);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
}

// Get user's connections
async function getConnections(accessToken, start = 0, count = 10) {
  try {
    const response = await axios.get(`${LINKEDIN_API_BASE}/connections`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      params: {
        start,
        count
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching connections:', error.response?.data || error.message);
    throw new Error(`Failed to fetch connections: ${error.message}`);
  }
}

// Send connection invitation
async function sendConnectionInvitation(accessToken, targetPersonUrn, message = '') {
  try {
    const payload = {
      invitations: [
        {
          invitee: {
            'com.linkedin.voyager.identity.shared.MemberIdentity': {
              memberUrn: targetPersonUrn
            }
          }
        }
      ]
    };

    if (message) {
      payload.invitations[0].message = message;
    }

    const response = await axios.post(`${LINKEDIN_API_BASE}/invitations`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error sending connection invitation:', error.response?.data || error.message);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
}

// Get recent messages (conversations)
async function getConversations(accessToken, start = 0, count = 10) {
  try {
    const response = await axios.get(`${LINKEDIN_API_BASE}/conversations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      params: {
        start,
        count
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error.response?.data || error.message);
    // LinkedIn conversations API may be restricted; return empty array if not available
    return { elements: [] };
  }
}

// Send a message to a connection
async function sendMessage(accessToken, recipientUrn, messageText) {
  try {
    const payload = {
      recipients: {
        'com.linkedin.voyager.messaging.shared.RecipientIdentifier': {
          memberIdentifier: {
            'com.linkedin.voyager.identity.shared.MemberIdentity': {
              memberUrn: recipientUrn
            }
          }
        }
      },
      messageContent: {
        'com.linkedin.voyager.messaging.shared.TextContent': {
          text: messageText
        }
      }
    };

    const response = await axios.post(`${LINKEDIN_API_BASE}/messages`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

// Search for people on LinkedIn
async function searchPeople(accessToken, keywords, count = 10) {
  try {
    const response = await axios.get(`${LINKEDIN_API_BASE}/search/queries`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      params: {
        q: 'people',
        keywords,
        count
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error searching people:', error.response?.data || error.message);
    throw new Error(`Failed to search people: ${error.message}`);
  }
}

// Get profile by URN
async function getProfileByUrn(accessToken, urn) {
  try {
    const response = await axios.get(`${LINKEDIN_API_BASE}/${urn}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching profile by URN:', error.response?.data || error.message);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
}

// Batch get profiles
async function getProfilesBatch(accessToken, urns) {
  try {
    const ids = urns.map(urn => `ids=List(${urn})`).join('&');
    const response = await axios.get(`${LINKEDIN_API_BASE}/?${ids}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching batch profiles:', error.response?.data || error.message);
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }
}

// Rate limiting helper
const rateLimitStore = new Map();

function checkRateLimit(key, limit = 10, windowMs = 60000) {
  const now = Date.now();
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key).filter(time => now - time < windowMs);
  requests.push(now);
  rateLimitStore.set(key, requests);

  return requests.length <= limit;
}

module.exports = {
  buildLinkedInAuthUrl,
  generateState,
  exchangeCodeForAccessToken,
  getLinkedInProfile,
  getConnections,
  sendConnectionInvitation,
  getConversations,
  sendMessage,
  searchPeople,
  getProfileByUrn,
  getProfilesBatch,
  checkRateLimit
};
