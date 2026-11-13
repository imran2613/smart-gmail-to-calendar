import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Mail, Calendar, Bot, ArrowRight, AlertCircle, Info } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId');

  if (userId) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const error = params?.error;
  const message = params?.message;

  return (
    <main className="container">
      {error && (
        <div
          style={{
            maxWidth: '750px',
            margin: '2rem auto 0 auto',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '1rem',
            padding: '1.5rem',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ color: '#fca5a5', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Google Sign-In Error ({error})
              </h3>
              <p style={{ color: '#fecaca', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                {message || 'Google account connection could not be completed.'}
              </p>

              {error === 'access_denied' && (
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                  <strong>How to fix this in Google Cloud Console:</strong>
                  <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Google Cloud Console → OAuth consent screen</a>.</li>
                    <li>Scroll down to the <strong>Test users</strong> section.</li>
                    <li>Click <strong>+ ADD USERS</strong> and enter your Google account email address.</li>
                    <li>Click <strong>Save</strong> and retry connecting your account.</li>
                  </ol>
                </div>
              )}

              {error === 'redirect_uri_mismatch' && (
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                  <strong>How to fix this in Google Cloud Console:</strong>
                  <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Google Cloud Console → Credentials</a>.</li>
                    <li>Click on your <strong>OAuth 2.0 Client ID</strong>.</li>
                    <li>Under <strong>Authorized redirect URIs</strong>, ensure <code>http://localhost:3000/api/auth/callback</code> (or your production callback URL) is added.</li>
                    <li>Click <strong>Save</strong>.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="hero">
        <h1>Smart Email Assistant</h1>
        <p>
          Connect your Gmail and Google Calendar. Let AI find your bills, meetings, and deadlines, and automatically
          schedule reminders for you.
        </p>

        <a
          href="/api/auth/login"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem',
            fontSize: '1.125rem',
          }}
        >
          Connect Google Account <ArrowRight size={20} />
        </a>

        <div style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
          <Info size={16} />
          <span>If prompted with "Google hasn't verified this app", click <strong>Advanced → Go to app (unsafe)</strong> to proceed.</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '4rem',
        }}
      >
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '1rem',
              color: '#3b82f6',
              marginBottom: '1rem',
            }}
          >
            <Mail size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Auto-Reads Emails</h3>
          <p style={{ color: '#94a3b8' }}>Securely scans your inbox for actionable items without any manual effort.</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1rem',
              background: 'rgba(192, 132, 252, 0.1)',
              borderRadius: '1rem',
              color: '#c084fc',
              marginBottom: '1rem',
            }}
          >
            <Bot size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI Extraction</h3>
          <p style={{ color: '#94a3b8' }}>Uses advanced NLP to understand context, amounts, and due dates accurately.</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '1rem',
              color: '#10b981',
              marginBottom: '1rem',
            }}
          >
            <Calendar size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Smart Scheduling</h3>
          <p style={{ color: '#94a3b8' }}>Creates events and sets optimal reminders based on priority.</p>
        </div>
      </div>
    </main>
  );
}
