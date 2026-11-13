# 🚀 Smart Gmail to Calendar (gmail2cal) — Complete Project Documentation

> **Autonomous AI-powered assistant that transforms unorganized inbox emails into structured, actionable Google Calendar events with smart reminder alerts.**

---

## 📑 Table of Contents
1. [Executive Summary & Real-World Problem](#1-executive-summary--real-world-problem)
2. [How It Solves the Real-World Problem (End-to-End Walkthrough)](#2-how-it-solves-the-real-world-problem-end-to-end-walkthrough)
3. [Technology Stack (Pin-to-Pin A to Z)](#3-technology-stack-pin-to-pin-a-to-z)
4. [System Architecture & Data Flow Diagrams](#4-system-architecture--data-flow-diagrams)
5. [Directory & File Structure](#5-directory--file-structure)
6. [Core Source Code Walkthrough (Complete & In-Depth)](#6-core-source-code-walkthrough-complete--in-depth)
   - [6.1 Google OAuth2 Configuration (`lib/google.ts`)](#61-google-oauth2-configuration-libgooglets)
   - [6.2 PostgreSQL Database Layer (`lib/db.ts`)](#62-postgresql-database-layer-libdbts)
   - [6.3 Gmail Fetch & MIME Parser (`lib/gmail.ts`)](#63-gmail-fetch--mime-parser-libgmailts)
   - [6.4 Gemini AI NLP Analysis Engine (`lib/ai.ts`)](#64-gemini-ai-nlp-analysis-engine-libaits)
   - [6.5 Google Calendar Event Scheduler (`lib/calendar.ts`)](#65-google-calendar-event-scheduler-libcalendarts)
   - [6.6 Authentication Routes (`login`, `callback`, `logout`)](#66-authentication-routes-login-callback-logout)
   - [6.7 Sync Engine Route (`app/api/sync/route.ts`)](#67-sync-engine-route-appapisyncroutets)
   - [6.8 User Interface & Dashboard (`app/page.tsx`, `app/dashboard/page.tsx`)](#68-user-interface--dashboard-apppagetsx-appdashboardpagetsx)
   - [6.9 Automated Cron Configuration (`vercel.json`)](#69-automated-cron-configuration-verceljson)
7. [Database Schema & State Management](#7-database-schema--state-management)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Environment Variables & Setup Guide](#9-environment-variables--setup-guide)
10. [Resilience & Edge-Case Engineering](#10-resilience--edge-case-engineering)
11. [Roadmap & Enhancements](#11-roadmap--enhancements)

---

## 1. Executive Summary & Real-World Problem

### The Problem
In the modern digital workspace, communication is dominated by email. Professionals, students, and businesses receive dozens to hundreds of emails daily, including:
- **Utility and service bills** (Electricity, Wi-Fi, Cloud hosting, Credit Cards)
- **Deadlines and project milestones** (Submissions, contract expiries, client deliverables)
- **Meetings and interviews** (Calls mentioned casually in email text without an attached calendar invite)
- **Course assignments and university schedules**

#### Why Traditional Solutions Fail:
1. **Human Cognitive Overload:** People skim or archive emails intending to "deal with it later", resulting in late payment penalties, missed interviews, or overlooked project deadlines.
2. **Calendar Invite Limitations:** Standard Google Calendar integrations only recognize formal `.ics` meeting attachments. If an email says *"Your bill of \$120 is due by next Tuesday at 5 PM"* or *"Let's sync Thursday morning"*, traditional mail clients fail to add it to the calendar.
3. **Manual Entry Friction:** Manually copying dates, times, amounts, and descriptions into a calendar app takes significant effort and is prone to human error.

---

## 2. How It Solves the Real-World Problem (End-to-End Walkthrough)

**Smart Gmail to Calendar** provides a zero-click, automated background pipeline:

```
[ User Connects Google Account ] (One-time OAuth consent)
               │
               ▼
[ Background Cron or Manual Trigger ] (/api/sync)
               │
               ▼
[ Fetch Unread / Recent Emails via Gmail API v1 ]
               │
               ▼
[ Parse Multipart MIME, Extract Plain Text & Metadata ]
               │
               ▼
[ Filter Previously Processed Emails via PostgreSQL ]
               │
               ▼
[ Google Gemini AI Extraction (NLP / Structured JSON) ]
  • Is it actionable? (Bill, Meeting, Assignment, Deadline)
  • Extracts exact ISO dueDate, Amount, Priority, and Title
               │
               ▼
[ Insert Event into Google Calendar with Priority Reminders ]
  • High Priority: 3-day popup + email reminder
  • Medium Priority: 1-day popup + email reminder
  • Low Priority: 1-hour popup + email reminder
               │
               ▼
[ Record messageId in PostgreSQL ] (Guarantees zero duplicates)
               │
               ▼
[ Real-Time UI Notification & Dashboard Summary ]
```

### Real-World Example Scenario:
1. An electricity provider emails: *"Dear Customer, your electricity bill of ₹1,850 for August is due on 2026-08-28. Please pay to avoid disconnection."*
2. **Smart Gmail to Calendar** scans the email automatically.
3. **Gemini AI** extracts:
   ```json
   {
     "isActionable": true,
     "category": "Bill",
     "amount": "₹1,850",
     "dueDate": "2026-08-28T10:00:00Z",
     "title": "Electricity Bill Payment Due (₹1,850)",
     "priority": "High"
   }
   ```
4. **Google Calendar** receives a new scheduled event with a 3-day advance alert and a 1-day advance alert.
5. The user never misses the bill and pays zero late fees!

---

## 3. Technology Stack (Pin-to-Pin A to Z)

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | 16.3.1 | Server Components, API routes, streaming, and fullstack architecture |
| **UI Library** | React | 19.2.8 | Client-side dashboard, modals, state management |
| **Language** | TypeScript | 5.x | Strict type safety across AI schemas, database rows, and API contracts |
| **Styling** | Vanilla CSS + Glassmorphism | Custom | Dark futuristic glassmorphic UI, responsive layout, animated transitions |
| **Icons** | Lucide React | ^1.33.0 | Modern SVG iconography (`Mail`, `Calendar`, `Bot`, `RefreshCw`, `LogOut`) |
| **AI / LLM Engine** | Google Gemini API (Direct REST) | 3.5-flash / flash-lite | Intelligent entity extraction, date/time normalization, and JSON structured output |
| **Date Manipulation** | Date-fns | ^4.4.0 | Date arithmetic and reminder calculation |
| **Google Cloud APIs** | Google APIs Node.js Client (`googleapis`) | ^176.0.0 | Gmail API v1 & Google Calendar API v3 integrations |
| **Database** | PostgreSQL (`pg` connection pool) | ^8.23.0 | Relational persistence for user OAuth tokens and processed email audit logs |
| **Task Scheduling** | Vercel Cron | `vercel.json` | Automatic daily background synchronization (`0 0 * * *`) |
| **Deployment Target** | Vercel / Render / Node.js | Any | Dynamic host URL resolution (`getBaseUrl()`) for cloud proxies |

---

## 4. System Architecture & Data Flow Diagrams

### High-Level Architecture Diagram
```mermaid
flowchart TD
    User([User / Browser]) <-->|OAuth 2.0 & Dashboard UI| NextApp[Next.js 16 Web Application]
    
    subgraph Google Cloud Services
        GmailAPI[Gmail API v1]
        CalendarAPI[Google Calendar API v3]
        Gemini[Google Gemini 3.5 Flash REST API]
    end
    
    subgraph Persistence Layer
        Postgres[(PostgreSQL Database)]
    end
    
    subgraph Automation
        Cron[Vercel Cron Schedule: 0 0 * * *]
    end
    
    NextApp <-->|Store / Fetch Tokens & Processed IDs| Postgres
    Cron -->|Trigger /api/sync| NextApp
    NextApp -->|Fetch Messages & Payloads| GmailAPI
    NextApp -->|Structured Extraction Prompt| Gemini
    Gemini -->|Strict JSON Extracted Data| NextApp
    NextApp -->|Insert Events & Set Reminders| CalendarAPI
```

### Detailed Sequence Diagram
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Next.js App
    participant DB as PostgreSQL
    participant Gmail as Gmail API v1
    participant AI as Gemini 3.5 Flash
    participant Cal as Google Calendar v3

    User->>App: Clicks "Connect Google Account"
    App->>User: Redirects to Google OAuth Consent (scopes: Gmail, Calendar, Profile)
    User->>App: Approves consent & redirects with ?code=...
    App->>DB: Upserts User (id, email, accessToken, refreshToken)
    App->>User: Sets HTTP-Only Cookie & Redirects to /dashboard

    Note over App,Cal: Triggered either via Dashboard button or Vercel Cron
    App->>DB: Query users with active refresh tokens
    DB-->>App: List of registered users
    
    loop For each user
        App->>Gmail: users.messages.list(maxResults: 20)
        Gmail-->>App: List of email message headers & bodies
        loop For each email
            App->>DB: Check if email.id exists in ProcessedEmails
            alt Already Processed
                App->>App: Skip email
            else New Email
                App->>AI: Send prompt with Subject, Sender, and BodyText
                AI-->>App: Returns JSON { isActionable, category, amount, dueDate, title, priority }
                alt isActionable == true && dueDate != null
                    App->>Cal: calendar.events.insert(title, description, start, end, reminders)
                    Cal-->>App: Event created successfully
                end
                App->>DB: INSERT INTO ProcessedEmails (id, userId, messageId)
            end
        end
    end
    App-->>User: Returns summary { processedCount, eventsCreated, createdEvents }
```

---

## 5. Directory & File Structure

```
c:\PROJECTS\gmail2cal
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts  # Handles OAuth2 callback, token exchange & database upsert
│   │   │   ├── login/route.ts     # Generates Google OAuth URL and initiates login
│   │   │   └── logout/route.ts    # Clears HTTP-only session cookies
│   │   ├── debug-env/route.ts     # Diagnostic endpoint to verify env vars in production
│   │   ├── debug-sync/route.ts    # Comprehensive step-by-step diagnostic test pipeline
│   │   └── sync/route.ts          # Core background sync runner (Cron + Manual trigger)
│   ├── dashboard/
│   │   └── page.tsx               # Authenticated user dashboard with live force-sync modal
│   ├── favicon.ico
│   ├── globals.css                # Global glassmorphism stylesheet & responsive variables
│   ├── layout.tsx                 # Root layout with Inter font and HTML metadata
│   ├── page.module.css
│   └── page.tsx                   # Public landing page with features showcase & login CTA
├── lib/
│   ├── ai.ts                      # Direct REST Gemini API client with fallback cascade
│   ├── calendar.ts                # Google Calendar v3 event builder and reminder calculator
│   ├── db.ts                      # PostgreSQL connection pool and table initializer
│   ├── gmail.ts                   # Gmail v1 message list & base64/HTML body extractor
│   └── google.ts                  # OAuth2 client instance, scopes, and dynamic URL resolver
├── public/                        # Static SVG assets
├── .env.local                     # Local secret credentials (git-ignored)
├── .gitignore                     # Git ignore rules
├── next.config.ts                 # Next.js runtime configuration
├── package.json                   # Dependencies, scripts, and project metadata
├── tsconfig.json                  # TypeScript compiler settings
├── vercel.json                    # Cron job schedule definition
└── PROJECT_DOCUMENTATION.md       # Complete master documentation file
```

---

## 6. Core Source Code Walkthrough (Complete & In-Depth)

### 6.1 Google OAuth2 Configuration (`lib/google.ts`)
This file configures the OAuth 2.0 client, resolves deployment URLs dynamically across localhost, Vercel, and Render, and defines the exact scopes required:

```typescript
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Dynamically resolves host URL across Vercel, Render, or Localhost
export const getBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  return envUrl || 'http://localhost:3000';
};

const REDIRECT_URI = `${getBaseUrl()}/api/auth/callback`;

export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Explicit OAuth Scopes required for Gmail reading & Calendar writing
export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Demands refresh_token for persistent background sync
    scope: SCOPES,
    prompt: 'consent',     // Guarantees refresh_token generation on every sign-in
  });
}
```

---

### 6.2 PostgreSQL Database Layer (`lib/db.ts`)
Creates a resilient connection pool using `pg` and automatically creates necessary relational tables on startup:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        accessToken TEXT,
        refreshToken TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ProcessedEmails (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        messageId VARCHAR(255) NOT NULL,
        processedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES Users(id)
      );
    `);
    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
};

export default pool;

// Auto-initialize tables when this module is loaded
initDb().catch(console.error);
```

---

### 6.3 Gmail Fetch & MIME Parser (`lib/gmail.ts`)
Fetches messages from Gmail API v1, traverses the MIME multipart tree, decodes base64 url-safe payloads, strips HTML formatting, and produces a sanitized text representation ready for AI processing:

```typescript
import { google } from 'googleapis';

export async function fetchRecentEmails(accessToken: string, refreshToken: string) {
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
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
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

      // Extract body from multipart MIME or direct body
      let bodyText = '';
      if (payload?.parts) {
        const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        } else {
          // Fallback to html and strip tags
          const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
          if (htmlPart?.body?.data) {
             const html = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
             bodyText = html.replace(/<[^>]*>?/gm, '');
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
        bodyText: bodyText.trim().substring(0, 3000), // Limit size to fit LLM window efficiently
      });
    }

    return fullMessages;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}
```

---

### 6.4 Gemini AI NLP Analysis Engine (`lib/ai.ts`)
Calls Google's Gemini models via direct REST API with an automated fallback cascade (`gemini-3.5-flash` and `gemini-3.5-flash-lite`), enforcing strict JSON structured output:

```typescript
export interface ExtractedEmailData {
  isActionable: boolean;
  category?: 'Bill' | 'Payment' | 'Meeting' | 'Assignment' | 'Deadline' | 'Other';
  amount?: string;
  dueDate?: string; // ISO Date String
  title?: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export async function analyzeEmail(subject: string, from: string, bodyText: string): Promise<ExtractedEmailData | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set!');
    return null;
  }

  const prompt = `
You are a Smart Email Assistant. Your job is to read an email and extract important actionable details if they exist.
Actionable items include: Bills, Payments due, Meetings, Assignments, or Deadlines.

Analyze the following email:
From: ${from}
Subject: ${subject}
Body:
${bodyText}

Output the result as a strict JSON object with the following schema:
{
  "isActionable": boolean,
  "category": string, // One of: "Bill", "Payment", "Meeting", "Assignment", "Deadline", "Other"
  "amount": string, // e.g. "₹1,850" or null if not applicable
  "dueDate": string, // ISO Date string (e.g. "2026-08-28T10:00:00Z") or null
  "title": string, // A concise, descriptive title for a calendar event
  "priority": string // "High", "Medium", or "Low"
}

Respond ONLY with the JSON object. No markdown formatting or backticks.
`;

  // Try multiple API versions and models via direct REST calls
  const attempts = [
    { version: 'v1beta', model: 'gemini-3.5-flash' },
    { version: 'v1beta', model: 'gemini-3.5-flash-lite' },
    { version: 'v1', model: 'gemini-3.5-flash' },
    { version: 'v1', model: 'gemini-3.5-flash-lite' },
  ];

  for (const { version, model } of attempts) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Gemini ${version}/${model} returned ${res.status}: ${errBody}`);
        continue; // Fallback to next candidate
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) continue;

      const sanitized = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(sanitized) as ExtractedEmailData;
    } catch (error) {
      console.error(`Gemini ${version}/${model} fetch error:`, error);
    }
  }

  console.error('All Gemini API attempts failed.');
  return null;
}
```

---

### 6.5 Google Calendar Event Scheduler (`lib/calendar.ts`)
Converts extracted data into a Google Calendar event, configuring reminders according to item priority:

```typescript
import { google } from 'googleapis';
import { ExtractedEmailData } from './ai';

export async function createCalendarEvent(accessToken: string, refreshToken: string, data: ExtractedEmailData) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth });

  if (!data.dueDate) {
    throw new Error('Cannot create event without a dueDate');
  }

  const eventDate = new Date(data.dueDate);
  const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1-hour event duration

  // Dynamic priority reminders
  let reminderMinutes = 24 * 60; // Default: 1 day before
  if (data.priority === 'High') {
    reminderMinutes = 3 * 24 * 60; // 3 days before
  } else if (data.priority === 'Low') {
    reminderMinutes = 60; // 1 hour before
  }

  const event = {
    summary: data.title || 'Actionable Item',
    description: `Created automatically by Smart Email Assistant.\nCategory: ${data.category}\nPriority: ${data.priority}\nAmount: ${data.amount || 'N/A'}`,
    start: {
      dateTime: eventDate.toISOString(),
    },
    end: {
      dateTime: endDate.toISOString(),
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: reminderMinutes },
        { method: 'email', minutes: reminderMinutes },
      ],
    },
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });
  return res.data;
}
```

---

### 6.6 Authentication Routes (`login`, `callback`, `logout`)

#### `app/api/auth/login/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google';

export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
```

#### `app/api/auth/callback/route.ts`
Exchanges authorization code for tokens, retrieves user profile, persists credentials using an upsert query (preserving existing `refreshToken` via `COALESCE`), and sets an HTTP-only authentication cookie:
```typescript
import { NextResponse } from 'next/server';
import { oauth2Client, getBaseUrl } from '@/lib/google';
import pool from '@/lib/db';
import { google } from 'googleapis';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=NoCode', getBaseUrl()));
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfoResponse = await oauth2.userinfo.get();
    const userInfo = userInfoResponse.data;

    if (!userInfo.id || !userInfo.email) {
      throw new Error('Could not retrieve user info');
    }

    // Save or update user in PostgreSQL DB
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

    const response = NextResponse.redirect(new URL('/dashboard', getBaseUrl()));
    response.cookies.set('userId', userInfo.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: 'AuthFailed' }, { status: 500 });
  }
}
```

#### `app/api/auth/logout/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('userId');
  return response;
}
```

---

### 6.7 Sync Engine Route (`app/api/sync/route.ts`)
The heartbeat of the application. Processes all users with valid refresh tokens, runs the pipeline, prevents duplicates, and returns structured execution metrics:

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { fetchRecentEmails } from '@/lib/gmail';
import { analyzeEmail } from '@/lib/ai';
import { createCalendarEvent } from '@/lib/calendar';

export const maxDuration = 60; // 60s max execution for Vercel serverless functions

export async function GET(request: Request) {
  // Authorization: Valid CRON_SECRET or authenticated logged-in user
  const authHeader = request.headers.get('authorization');
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (process.env.NODE_ENV === 'production') {
    const hasValidCronSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isLoggedInUser = !!userId;
    if (!hasValidCronSecret && !isLoggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const usersResult = await pool.query('SELECT id, accesstoken, refreshtoken FROM Users WHERE refreshtoken IS NOT NULL');
    const users = usersResult.rows;

    let processedCount = 0;
    let eventsCreated = 0;
    const createdEventsDetails: Array<{ title: string; date: string }> = [];

    for (const user of users) {
      try {
        const emails = await fetchRecentEmails(user.accesstoken, user.refreshtoken);

        for (const email of emails) {
          // Idempotency: skip if already processed
          const checkResult = await pool.query('SELECT id FROM ProcessedEmails WHERE messageId = $1 AND userId = $2', [email.id, user.id]);
          if (checkResult.rows.length > 0) continue;

          const aiResult = await analyzeEmail(email.subject, email.from, email.bodyText);
          if (aiResult === null) continue; // Allow retry on transient failure

          if (aiResult.isActionable && aiResult.dueDate) {
             await createCalendarEvent(user.accesstoken, user.refreshtoken, aiResult);
             eventsCreated++;
             createdEventsDetails.push({
               title: aiResult.title || 'Actionable Item',
               date: aiResult.dueDate || 'No specific date'
             });
          }

          // Mark email as processed
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
```

---

### 6.8 User Interface & Dashboard (`app/page.tsx`, `app/dashboard/page.tsx`)

#### Landing Page (`app/page.tsx`)
Features a dark theme with glassmorphism cards and highlights three core pillars:
1. **Auto-Reads Emails:** Reads and analyzes inbox securely.
2. **AI Extraction:** Natural language entity parsing via Gemini.
3. **Smart Scheduling:** Calendar booking with priority-based alerts.

#### Dashboard (`app/dashboard/page.tsx`)
Provides an active status indicator, a **Force Sync Now** button with loading animation (`RefreshCw`), and an interactive modal displaying scanned email counts and a list of created calendar events.

---

### 6.9 Automated Cron Configuration (`vercel.json`)
Triggers the synchronization endpoint once every 24 hours at midnight UTC:

```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 7. Database Schema & State Management

### Tables & Relationships
```sql
-- Table: Users
-- Stores user identity and persistent OAuth tokens
CREATE TABLE IF NOT EXISTS Users (
  id VARCHAR(255) PRIMARY KEY,              -- Google User ID (sub)
  email VARCHAR(255) UNIQUE NOT NULL,       -- Primary Google email address
  name VARCHAR(255),                        -- Display name
  picture TEXT,                             -- Profile avatar URL
  accessToken TEXT,                         -- Expiring Google OAuth access token
  refreshToken TEXT,                        -- Persistent refresh token for offline cron sync
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: ProcessedEmails
-- Prevents duplicate event creation across recurring sync jobs
CREATE TABLE IF NOT EXISTS ProcessedEmails (
  id VARCHAR(255) PRIMARY KEY,              -- Unique random record identifier
  userId VARCHAR(255) NOT NULL,             -- Associated User foreign key
  messageId VARCHAR(255) NOT NULL,          -- Gmail Message ID
  processedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES Users(id) ON DELETE CASCADE
);
```

---

## 8. API Endpoints Reference

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth/login` | `GET` | Public | Generates Google OAuth URL and initiates login flow |
| `/api/auth/callback` | `GET` | Public (Google redirect) | Exchanges authorization code, saves tokens, sets session cookie |
| `/api/auth/logout` | `POST` | Authenticated | Clears `userId` session cookie and logs user out |
| `/api/sync` | `GET` | Cron Secret or Cookie | Runs end-to-end sync across all connected users |
| `/api/debug-env` | `GET` | Admin / Developer | Checks availability of critical environment variables |
| `/api/debug-sync` | `GET` | Admin / Developer | Step-by-step diagnostic test (DB -> Gmail -> AI -> Calendar) |

---

## 9. Environment Variables & Setup Guide

Create a `.env.local` file in the project root:

```bash
# Google Cloud OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret

# Google Gemini API Key
GEMINI_API_KEY=AIzaSyYourGeminiApiKey

# PostgreSQL Database Connection String (Neon, Supabase, Render, or Local)
DATABASE_URL=postgresql://username:password@ep-host.region.aws.neon.tech/neondb?sslmode=require

# Base Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Secret token for Vercel Cron or external triggers (optional in local dev)
CRON_SECRET=your-random-cron-secret-token
```

### Google Cloud Console Configuration:
1. Enable **Gmail API** and **Google Calendar API** in your Google Cloud Project.
2. Configure **OAuth Consent Screen** with scopes:
   - `userinfo.profile`
   - `userinfo.email`
   - `gmail.readonly`
   - `calendar.events`
3. Add Authorized Redirect URI:
   - `http://localhost:3000/api/auth/callback` (for local development)
   - `https://your-domain.vercel.app/api/auth/callback` (for production)

---

## 10. Resilience & Edge-Case Engineering

1. **Direct REST Fallback for Gemini:** Avoids SDK version mismatches and deprecation errors by issuing raw HTTP calls across `gemini-3.5-flash` and `gemini-3.5-flash-lite`.
2. **PostgreSQL Column Lowercasing:** Node's `pg` library converts unquoted column identifiers to lowercase (e.g. `accesstoken`). All references in JavaScript strictly use `user.accesstoken` and `user.refreshtoken` to avoid `undefined` crashes.
3. **RefreshToken Preservation (`COALESCE`):** Google does not return a new `refresh_token` if the user is already authenticated unless prompted. The database query uses `COALESCE(EXCLUDED.refreshToken, Users.refreshToken)` so existing offline refresh tokens are never overwritten with null.
4. **Idempotent Sync:** Every processed Gmail `messageId` is stored in the database. Even if the sync runs every hour, no duplicate calendar events are created.
5. **Dynamic Proxy Resolution (`getBaseUrl`):** Automatically detects `VERCEL_PROJECT_PRODUCTION_URL` or `RENDER_EXTERNAL_URL` to prevent OAuth redirect mismatches in serverless environments.

---

## 11. Roadmap & Enhancements

- [ ] **Custom Category Filters:** Allow users to toggle which categories to sync (e.g., sync Bills only, ignore Assignments).
- [ ] **Multi-Calendar Support:** Allow users to choose a specific target calendar (e.g., "Personal" vs "Work") instead of defaulting to `primary`.
- [ ] **Natural Language Query UI:** Chat interface allowing users to ask *"What bills are due this week?"*
- [ ] **Slack & WhatsApp Alerts:** Send instant notifications when a high-priority deadline is scheduled.

---

*Authored for the Smart Gmail to Calendar (`smart-gmail-to-calendar`) project.*

