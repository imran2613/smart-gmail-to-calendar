import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Mail, Calendar, Bot, ArrowRight } from 'lucide-react';

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId');

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <main className="container">
      <div className="hero">
        <h1>Smart Email Assistant</h1>
        <p>Connect your Gmail and Google Calendar. Let AI find your bills, meetings, and deadlines, and automatically schedule reminders for you.</p>
        
        <a href="/api/auth/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '1.125rem' }}>
          Connect Google Account <ArrowRight size={20} />
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '1rem', color: '#3b82f6', marginBottom: '1rem' }}>
            <Mail size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Auto-Reads Emails</h3>
          <p style={{ color: '#94a3b8' }}>Securely scans your inbox for actionable items without any manual effort.</p>
        </div>
        
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(192, 132, 252, 0.1)', borderRadius: '1rem', color: '#c084fc', marginBottom: '1rem' }}>
            <Bot size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI Extraction</h3>
          <p style={{ color: '#94a3b8' }}>Uses advanced NLP to understand context, amounts, and due dates accurately.</p>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', color: '#10b981', marginBottom: '1rem' }}>
            <Calendar size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Smart Scheduling</h3>
          <p style={{ color: '#94a3b8' }}>Creates events and sets optimal reminders based on priority.</p>
        </div>
      </div>
    </main>
  );
}
