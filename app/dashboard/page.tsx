'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [syncResult, setSyncResult] = useState<{ 
    processedCount: number; 
    eventsCreated: number;
    createdEvents?: Array<{ title: string; date: string }>;
  } | null>(null);

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
      if (!res.ok) {
        alert(`Sync failed (${res.status}): ${data.error || JSON.stringify(data)}`);
        return;
      }
      if (data.success) {
        setSyncResult({ 
          processedCount: data.processedCount, 
          eventsCreated: data.eventsCreated,
          createdEvents: data.createdEvents 
        });
        setShowModal(true);
      } else {
        alert(`Sync returned failure: ${JSON.stringify(data)}`);
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
        </div>
      </div>

      {/* Sync Success Modal */}
      {showModal && syncResult && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#10b981' }}>
              <CheckCircle2 size={28} />
              <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', margin: 0 }}>Sync Complete!</h2>
            </div>
            
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginBottom: '1.5rem' }}>
              Scanned <strong>{syncResult.processedCount}</strong> events and added <strong>{syncResult.eventsCreated}</strong> events to your calendar.
            </p>

            {syncResult.createdEvents && syncResult.createdEvents.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {syncResult.createdEvents.map((event, idx) => (
                    <div key={idx} style={{ borderBottom: idx < syncResult.createdEvents!.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingBottom: idx < syncResult.createdEvents!.length - 1 ? '0.75rem' : '0' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{event.title}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {event.date !== 'No specific date' ? new Date(event.date).toLocaleString() : 'No specific date'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-primary"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
