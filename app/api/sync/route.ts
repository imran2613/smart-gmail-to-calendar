import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { fetchRecentEmails } from '@/lib/gmail';
import { analyzeEmail } from '@/lib/ai';
import { createCalendarEvent } from '@/lib/calendar';

export async function GET(request: Request) {
  // Simple cron security check can go here (e.g., checking a secret header)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // For local dev, we might allow bypassing this. Let's just warn if in prod
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  console.log('Starting background sync...');

  try {
    const users = db.prepare('SELECT id, accessToken, refreshToken FROM Users WHERE refreshToken IS NOT NULL').all() as any[];

    let processedCount = 0;
    let eventsCreated = 0;

    for (const user of users) {
      console.log(`Processing user: ${user.id}`);
      
      try {
        const emails = await fetchRecentEmails(user.accessToken, user.refreshToken);
        console.log(`Fetched ${emails.length} recent emails.`);

        for (const email of emails) {
          // Check if already processed
          const checkStmt = db.prepare('SELECT id FROM ProcessedEmails WHERE messageId = ? AND userId = ?');
          const exists = checkStmt.get(email.id, user.id);

          if (exists) {
             continue; // Already processed
          }

          console.log(`Analyzing email: ${email.subject}`);
          const aiResult = await analyzeEmail(email.subject, email.from, email.bodyText);

          if (aiResult && aiResult.isActionable) {
             console.log(`Email is actionable! Creating calendar event...`);
             await createCalendarEvent(user.accessToken, user.refreshToken, aiResult);
             eventsCreated++;
          }

          // Mark as processed
          const insertStmt = db.prepare('INSERT INTO ProcessedEmails (id, userId, messageId) VALUES (?, ?, ?)');
          // Using a simple random string for ID for now, normally use UUID
          insertStmt.run(Math.random().toString(36).substring(7), user.id, email.id);
          processedCount++;
        }

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
      }
    }

    return NextResponse.json({ success: true, processedCount, eventsCreated });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
