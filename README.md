# 📅 Smart Gmail to Calendar (`smart-gmail-to-calendar`)

An autonomous AI-powered assistant that reads your Gmail inbox, extracts actionable deadlines, meetings, bills, and assignments using **Google Gemini AI**, and automatically schedules them into **Google Calendar** with intelligent priority reminders.

---

## 🌟 Highlights & Key Features

- 🤖 **Gemini AI NLP Extraction:** Parses unorganized emails into structured JSON with category, title, exact due date, monetary amount, and priority.
- ⚡ **Zero-Click Google Calendar Sync:** Automatically creates calendar events with 1-hour, 1-day, or 3-day popup and email reminders depending on urgency.
- 🔄 **Idempotent Background Sync:** Prevents duplicate calendar events using a PostgreSQL audit registry (`ProcessedEmails`).
- 🔐 **Secure Google OAuth 2.0:** Offline token exchange enables uninterrupted 24/7 background cron synchronization.
- 🎨 **Futuristic Glassmorphism UI:** Built with Next.js 16 (App Router), React 19, and Lucide React icons.

---

## 📖 Complete Documentation

For an exhaustive, pin-to-pin architectural guide with full source code, database schemas, sequence diagrams, and real-world use cases, see:

👉 **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)**

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.3.1 (App Router), React 19, TypeScript
- **AI Engine:** Google Gemini REST API (`gemini-3.5-flash`, `gemini-3.5-flash-lite`)
- **APIs:** Google Gmail API v1, Google Calendar API v3 (`googleapis`)
- **Database:** PostgreSQL (`pg` connection pool)
- **Styling:** Custom CSS Glassmorphism & Lucide Icons
- **Cron Automation:** Vercel Cron (`vercel.json`)

---

## 📁 Project Structure

```text
smart-gmail-to-calendar/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts  # Handles OAuth2 callback, token exchange & database upsert
│   │   │   ├── login/route.ts     # Generates Google OAuth URL and initiates login
│   │   │   └── logout/route.ts    # Clears HTTP-only session cookies
│   │   ├── debug-env/route.ts     # Diagnostic endpoint to verify env vars in production
│   │   ├── debug-sync/route.ts    # Comprehensive step-by-step diagnostic test pipeline
│   │   └── sync/route.ts          # Core background sync runner (Cron + Manual trigger)
│   ├── dashboard/page.tsx         # Authenticated user dashboard with live force-sync modal
│   ├── globals.css                # Global glassmorphism stylesheet & responsive variables
│   ├── layout.tsx                 # Root layout with Inter font and HTML metadata
│   └── page.tsx                   # Public landing page with features showcase & login CTA
├── lib/
│   ├── ai.ts                      # Direct REST Gemini API client with fallback cascade
│   ├── calendar.ts                # Google Calendar v3 event builder and reminder calculator
│   ├── db.ts                      # PostgreSQL connection pool and table initializer
│   ├── gmail.ts                   # Gmail v1 message list & base64/HTML body extractor
│   └── google.ts                  # OAuth2 client instance, scopes, and dynamic URL resolver
├── PROJECT_DOCUMENTATION.md       # Pin-to-pin comprehensive project documentation
├── vercel.json                    # Cron job schedule definition
└── package.json
```

---

## ⚙️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/imran2613/smart-gmail-to-calendar.git
cd smart-gmail-to-calendar
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` in the project root:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CRON_SECRET=your-cron-secret
```

### 4. Run the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to launch the application.

---

## 📄 License & Attribution

Built with Next.js, Google Gemini, and TypeScript.
