import { google } from 'googleapis';
import { oauth2Client } from './google';

export async function fetchRecentEmails(accessToken: string, refreshToken: string) {
  // Set credentials for this user
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // Fetch last 10 messages (you can adjust query to 'is:unread' if preferred)
    // We fetch a small batch to process. We'll filter out already processed ones in the sync logic.
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      // No explicit query – fetch recent messages from all folders
    });

    const messages = res.data.messages || [];
    const fullMessages = [];

    for (const msg of messages) {
      if (!msg.id) continue;
      
      const msgRes = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });
      
      const payload = msgRes.data.payload;
      const headers = payload?.headers || [];
      
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

      // Extract body
      let bodyText = '';
      if (payload?.parts) {
        const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        } else {
          // fallback to html and strip tags simply
          const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
          if (htmlPart?.body?.data) {
             const html = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
             bodyText = html.replace(/<[^>]*>?/gm, ''); // Very basic strip tags
          }
        }
      } else if (payload?.body?.data) {
        bodyText = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }

      fullMessages.push({
        id: msg.id,
        subject,
        from,
        date,
        snippet: msgRes.data.snippet,
        bodyText: bodyText.trim().substring(0, 3000), // Limit size for AI
      });
    }

    return fullMessages;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}
