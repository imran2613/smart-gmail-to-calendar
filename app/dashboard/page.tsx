'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ processedCount: number; eventsCreated: number } | null>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (data.success) {
        setSyncResult({ processedCount: data.processedCount, eventsCreated: data.eventsCreated });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <main className="container">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Your Assistant</h1>
          <div className="status-badge" style={{ marginTop: '0.5rem' }}>
            <div className="status-dot"></div>
            Connected & Active
          </div>
        </div>
        <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Disconnect
          </span>
        </button>
      </div>

      <div className="glass-card" style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Background Sync</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          The assistant is running in the background. It will automatically check your recent emails, identify bills and meetings, and create calendar events for you.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="btn btn-primary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', opacity: isSyncing ? 0.7 : 1 }}
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} /> 
            {isSyncing ? 'Syncing...' : 'Force Sync Now'}
          </button>
          
          {syncResult && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.75rem 1rem', borderRadius: '0.5rem' }}>
              <CheckCircle2 size={18} />
              Processed {syncResult.processedCount} emails. Created {syncResult.eventsCreated} events!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
