import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Dynamically resolves the base URL of the incoming request or environment.
 * Prioritizes request headers (host & protocol) to handle dynamic ports (3000, 3001, etc.)
 * and cloud reverse proxies (Vercel, Render), with fallback to env vars and localhost.
 */
export const getBaseUrl = (req?: Request) => {
  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host');
    const host = forwardedHost || req.headers.get('host');
    if (host) {
      const proto =
        req.headers.get('x-forwarded-proto') ||
        (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
      return `${proto}://${host}`;
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  return envUrl || 'http://localhost:3000';
};

// Define the scopes we need
export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Creates an isolated Google OAuth2 client with the specified redirect URI.
 */
export function createOAuthClient(redirectUri?: string) {
  const uri = redirectUri || `${getBaseUrl()}/api/auth/callback`;
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    uri
  );
}

// Global default instance for backwards-compatibility
export const oauth2Client = createOAuthClient();

/**
 * Generates the Google OAuth consent URL with offline access and force consent.
 */
export function getAuthUrl(req?: Request) {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/callback`;
  const client = createOAuthClient(redirectUri);

  return client.generateAuthUrl({
    access_type: 'offline', // Required to get a refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to always get refresh token
  });
}
