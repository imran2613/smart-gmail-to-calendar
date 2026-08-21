import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { fetchRecentEmails } from '@/lib/gmail';
import { analyzeEmail } from '@/lib/ai';
import { createCalendarEvent } from '@/lib/calendar';

export const maxDuration = 60; // Allow Vercel to run this function for up to 60 seconds (Hobby limit)

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
    // PostgreSQL lowercases unquoted column names in the result set
    const usersResult = await pool.query('SELECT id, accesstoken, refreshtoken FROM Users WHERE refreshtoken IS NOT NULL');
    const users = usersResult.rows;

    let processedCount = 0;
    let eventsCreated = 0;
    const createdEventsDetails: Array<{ title: string; date: string }> = [];

    for (const user of users) {
      console.log(`Processing user: ${user.id}`);
      
      try {
        // Use lowercase keys because pg returns them lowercased
        const emails = await fetchRecentEmails(user.accesstoken, user.refreshtoken);
        console.log(`Fetched ${emails.length} recent emails.`);

        for (const email of emails) {
          // Check if already processed
          const checkResult = await pool.query('SELECT id FROM ProcessedEmails WHERE messageId = $1 AND userId = $2', [email.id, user.id]);
          const exists = checkResult.rows.length > 0;

          if (exists) {
             continue; // Already processed
          }

          console.log(`Analyzing email: ${email.subject}`);
          const aiResult = await analyzeEmail(email.subject, email.from, email.bodyText);

          if (aiResult === null) {
             console.error('Failed to analyze email due to AI error, skipping mark as processed.');
             continue; // Skip the insert into ProcessedEmails so we can retry later
          }

          if (aiResult.isActionable) {
             console.log(`Email is actionable! Creating calendar event...`);
             await createCalendarEvent(user.accesstoken, user.refreshtoken, aiResult);
             eventsCreated++;
             createdEventsDetails.push({
               title: aiResult.title || 'Actionable Item',
               date: aiResult.dueDate || 'No specific date'
             });
          }

          // Mark as processed
          await pool.query('INSERT INTO ProcessedEmails (id, userId, messageId) VALUES ($1, $2, $3)', [
            Math.random().toString(36).substring(7), 
            user.id, 
            email.id
          ]);
          processedCount++;
        }

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processedCount, 
      eventsCreated,
      createdEvents: createdEventsDetails 
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
