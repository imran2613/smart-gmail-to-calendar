import { NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/google';
import pool from '@/lib/db';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=NoCode', request.url));
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const userInfoResponse = await oauth2.userinfo.get();
    const userInfo = userInfoResponse.data;

    if (!userInfo.id || !userInfo.email) {
      throw new Error('Could not retrieve user info');
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
      tokens.refresh_token || null // Important: Might be undefined if not first time
    ]);

    // Set a simple cookie for frontend authentication (1 year expiry)
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('userId', userInfo.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ 
      error: 'AuthFailed', 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    }, { status: 500 });
  }
}
