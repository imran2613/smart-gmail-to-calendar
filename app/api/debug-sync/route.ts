import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { fetchRecentEmails } from '@/lib/gmail';
import { analyzeEmail } from '@/lib/ai';

export async function GET() {
  const steps: Array<{ step: string; status: string; detail?: unknown }> = [];

  // Step 1: Check DB connection
  try {
    const result = await pool.query('SELECT NOW()');
    steps.push({ step: '1. Database Connection', status: '✅ OK', detail: result.rows[0] });
  } catch (e) {
    steps.push({ step: '1. Database Connection', status: '❌ FAILED', detail: String(e) });
    return NextResponse.json({ steps });
  }

  // Step 2: Check users in DB
  let users: any[] = [];
  try {
    const result = await pool.query('SELECT id, email, accesstoken, refreshtoken FROM Users');
    users = result.rows;
    steps.push({ 
      step: '2. Users in Database', 
      status: users.length > 0 ? '✅ Found' : '⚠️ No users found (need to login first)', 
      detail: users.map(u => ({ 
        id: u.id, 
        email: u.email, 
        hasAccessToken: !!u.accesstoken, 
        hasRefreshToken: !!u.refreshtoken,
        accessTokenPreview: u.accesstoken ? u.accesstoken.substring(0, 20) + '...' : 'MISSING',
        refreshTokenPreview: u.refreshtoken ? u.refreshtoken.substring(0, 20) + '...' : 'MISSING',
      }))
    });
  } catch (e) {
    steps.push({ step: '2. Users in Database', status: '❌ FAILED', detail: String(e) });
    return NextResponse.json({ steps });
  }

  if (users.length === 0) {
    return NextResponse.json({ steps, message: 'No users found. Please login first.' });
  }

  // Step 3: Try fetching emails for first user
  const user = users[0];
  let emails: any[] = [];
  try {
    emails = await fetchRecentEmails(user.accesstoken, user.refreshtoken);
    steps.push({ 
      step: '3. Gmail Fetch', 
      status: '✅ OK', 
      detail: { 
        count: emails.length, 
        subjects: emails.map((e: any) => e.subject) 
      } 
    });
  } catch (e: any) {
    steps.push({ 
      step: '3. Gmail Fetch', 
      status: '❌ FAILED', 
      detail: { 
        message: e.message, 
        code: e.code,
        errors: e.errors,
        response: e.response?.data 
      } 
    });
    return NextResponse.json({ steps });
  }

  // Step 4: Check processed emails
  try {
    const result = await pool.query('SELECT messageId FROM ProcessedEmails WHERE userId = $1', [user.id]);
    const processedIds = result.rows.map((r: any) => r.messageid);
    const unprocessedEmails = emails.filter((e: any) => !processedIds.includes(e.id));
    steps.push({ 
      step: '4. Processed Emails Check', 
      status: '✅ OK', 
      detail: { 
        totalEmails: emails.length, 
        alreadyProcessed: processedIds.length,
        newToProcess: unprocessedEmails.length,
        processedIds: processedIds
      } 
    });
    emails = unprocessedEmails;
  } catch (e) {
    steps.push({ step: '4. Processed Emails Check', status: '❌ FAILED', detail: String(e) });
  }

  // Step 5: Try AI analysis on first unprocessed email
  if (emails.length > 0) {
    const testEmail = emails[0];
    try {
      const aiResult = await analyzeEmail(testEmail.subject, testEmail.from, testEmail.bodyText);
      steps.push({ 
        step: '5. AI Analysis', 
        status: aiResult ? '✅ OK' : '❌ Returned null', 
        detail: { 
          emailSubject: testEmail.subject, 
          aiResult 
        } 
      });
    } catch (e: any) {
      steps.push({ 
        step: '5. AI Analysis', 
        status: '❌ FAILED', 
        detail: { message: e.message, emailSubject: testEmail.subject } 
      });
    }
  } else {
    steps.push({ 
      step: '5. AI Analysis', 
      status: '⚠️ Skipped', 
      detail: 'No unprocessed emails to analyze' 
    });
  }

  return NextResponse.json({ steps });
}
