import { NextResponse } from 'next/server';
import { createOAuthClient, getBaseUrl } from '@/lib/google';
import pool from '@/lib/db';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const baseUrl = getBaseUrl(request);

  if (errorParam) {
    console.error('Google OAuth returned error:', errorParam, errorDescription);
    const detail = errorDescription || errorParam;
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorParam)}&message=${encodeURIComponent(detail)}`, baseUrl)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=NoCode&message=Authorization+code+was+not+returned+by+Google', baseUrl)
    );
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/callback`;
    const client = createOAuthClient(redirectUri);

    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({
      auth: client,
      version: 'v2',
    });

    const userInfoResponse = await oauth2.userinfo.get();
    const userInfo = userInfoResponse.data;

    if (!userInfo.id || !userInfo.email) {
      throw new Error('Could not retrieve user info from Google');
    }

    // Save or update user in Postgres DB
    await pool.query(`
      INSERT INTO Users (id, email, name, picture, accessToken, refreshToken)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(id) DO UPDATE SET
        accessToken = EXCLUDED.accessToken,
        refreshToken = COALESCE(EXCLUDED.refreshToken, Users.refreshToken),
        name = EXCLUDED.name,
        picture = EXCLUDED.picture
    `, [
      userInfo.id,
      userInfo.email,
      userInfo.name || '',
      userInfo.picture || '',
      tokens.access_token || '',
      tokens.refresh_token || null
    ]);

    // Set a simple cookie for frontend authentication (1 year expiry)
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl));
    response.cookies.set('userId', userInfo.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.redirect(
      new URL(`/?error=AuthFailed&message=${encodeURIComponent(msg)}`, baseUrl)
    );
  }
}
