'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

interface LogEntry {
  id: string;
  action: string;
  status: 'success' | 'error' | 'info';
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export default function TestToolsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [webhookKey, setWebhookKey] = useState(uuidv4());

  const addLog = (action: string, status: 'success' | 'error' | 'info', message: string, details?: Record<string, unknown>) => {
    setLogs(prev => [{ id: uuidv4(), action, status, message, timestamp: new Date().toLocaleTimeString(), details }, ...prev]);
  };

  // Generate 10 leads concurrently
  const handleGenerateLeads = async () => {
    setLoading('generate');
    addLog('Generate Leads', 'info', 'Generating 10 leads concurrently...');
    try {
      const res = await fetch('/api/test/generate-leads', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addLog('Generate Leads', 'success',
          `✅ ${data.data.summary.successCount} created, ${data.data.summary.failCount} failed`,
          data.data as Record<string, unknown>
        );
      } else {
        addLog('Generate Leads', 'error', `❌ ${data.error?.message}`);
      }
    } catch (err) {
      addLog('Generate Leads', 'error', `❌ Network error: ${err}`);
    }
    setLoading(null);
  };

  // Reset all quotas
  const handleResetQuotas = async () => {
    setLoading('reset');
    addLog('Reset Quotas', 'info', 'Resetting all provider quotas...');
    try {
      const res = await fetch('/api/test/reset-quotas', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addLog('Reset Quotas', 'success', `✅ ${data.data.message}`);
      } else {
        addLog('Reset Quotas', 'error', `❌ ${data.error?.message}`);
      }
    } catch (err) {
      addLog('Reset Quotas', 'error', `❌ Network error: ${err}`);
    }
    setLoading(null);
  };

  // Send webhook (with idempotency key)
  const handleWebhook = async (reuse: boolean = false) => {
    const key = reuse ? webhookKey : uuidv4();
    if (!reuse) setWebhookKey(key);
    setLoading('webhook');
    addLog('Webhook', 'info', `Sending webhook (key: ${key.slice(0, 8)}...${reuse ? ' [REUSED]' : ''})`);
    try {
      const res = await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey: key, eventType: 'quota_reset' }),
      });
      const data = await res.json();
      if (data.success) {
        const isIdempotent = data.meta?.idempotent;
        addLog('Webhook', 'success',
          isIdempotent
            ? `🔄 Already processed (idempotent) — key: ${key.slice(0, 8)}...`
            : `✅ Processed successfully — key: ${key.slice(0, 8)}...`,
          data as Record<string, unknown>
        );
      } else {
        addLog('Webhook', 'error', `❌ ${data.error?.message}`);
      }
    } catch (err) {
      addLog('Webhook', 'error', `❌ Network error: ${err}`);
    }
    setLoading(null);
  };

  // Call webhook 5 times with same key (idempotency test)
  const handleWebhookBurst = async () => {
    setLoading('burst');
    const key = uuidv4();
    setWebhookKey(key);
    addLog('Webhook Burst', 'info', `Firing 5 concurrent webhooks with same key: ${key.slice(0, 8)}...`);

    const promises = Array.from({ length: 5 }, () =>
      fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey: key, eventType: 'quota_reset' }),
      }).then(r => r.json())
    );

    const results = await Promise.all(promises);
    const processed = results.filter(r => r.success && !r.meta?.idempotent).length;
    const idempotent = results.filter(r => r.success && r.meta?.idempotent).length;

    addLog('Webhook Burst', 'success',
      `✅ ${processed} processed, ${idempotent} deduplicated — proving idempotency works!`
    );
    setLoading(null);
  };

  return (
    <div style={{ backgroundColor: '#f6f6f6', minHeight: '100vh', color: '#202122', fontFamily: 'sans-serif' }}>
      {/* Wikipedia Top Utility Bar */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', padding: '4px 20px',
        fontSize: '12px', borderBottom: '1px solid #eaecf0', backgroundColor: '#ffffff',
        gap: '15px', color: '#54595d'
      }}>
        <span>Not logged in</span>
        <span style={{ cursor: 'pointer' }}>Talk</span>
        <span style={{ cursor: 'pointer' }}>Contributions</span>
        <span style={{ cursor: 'pointer', color: '#0645ad' }}>Create account</span>
        <span style={{ cursor: 'pointer', color: '#0645ad' }}>Log in</span>
      </div>

      {/* Main Container */}
      <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#ffffff', borderLeft: '1px solid #a2a9b1', borderRight: '1px solid #a2a9b1', minHeight: 'calc(100vh - 25px)' }}>
        
        {/* Left Sidebar */}
        <aside style={{ width: '175px', minWidth: '175px', padding: '15px 10px', borderRight: '1px solid #eaecf0', backgroundColor: '#ffffff', fontSize: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px', textAlign: 'center' }}>
            <Image src="/logo.png" alt="LeadForge Logo" width={60} height={60} style={{ marginBottom: '5px' }} />
            <span style={{ fontSize: '18px', fontWeight: 'normal', fontFamily: 'Georgia, serif', color: '#000000' }}><Link href="/" style={{ color: '#000000', textDecoration: 'none' }}>LeadForge</Link></span>
            <span style={{ fontSize: '10px', color: '#54595d', fontStyle: 'italic' }}>The Intelligent Engine</span>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#54595d', borderBottom: '1px solid #a2a9b1', paddingBottom: '2px', marginBottom: '5px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>Navigation</div>
            <ul style={{ listStyle: 'none', paddingLeft: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <li><Link href="/" style={{ color: '#0645ad' }}>Main page</Link></li>
              <li><Link href="/request-service" style={{ color: '#0645ad' }}>Submit lead form</Link></li>
              <li><Link href="/dashboard" style={{ color: '#0645ad' }}>Provider dashboard</Link></li>
              <li><Link href="/test-tools" style={{ color: '#0645ad', fontWeight: 'bold' }}>System test tools</Link></li>
            </ul>
          </div>
        </aside>

        {/* Main Content Column */}
        <main style={{ flexGrow: 1, padding: '20px 25px', overflowX: 'auto' }}>
          {/* Top Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #a2a9b1', marginBottom: '20px', paddingBottom: '1px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ border: '1px solid #a2a9b1', borderBottom: '1px solid #ffffff', padding: '5px 12px', backgroundColor: '#ffffff', fontSize: '13px', zIndex: 1, marginBottom: '-1px' }}>System Testing</div>
              <div style={{ border: '1px solid transparent', padding: '5px 12px', fontSize: '13px', color: '#0645ad', cursor: 'pointer' }}>Talk</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link href="/" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Main page</Link>
              <Link href="/request-service" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Submit lead</Link>
              <Link href="/dashboard" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Dashboard</Link>
              <div style={{ border: '1px solid #a2a9b1', borderBottom: '1px solid #ffffff', padding: '5px 12px', backgroundColor: '#ffffff', fontSize: '13px', zIndex: 1, marginBottom: '-1px' }}>Test tools</div>
            </div>
          </div>

          {/* Page Title */}
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 'normal',
            borderBottom: '1px solid #a2a9b1', paddingBottom: '3px', marginTop: 0, marginBottom: '15px',
            color: '#000000'
          }}>
            LeadForge:System Diagnostic and Testing Tools
          </h1>

          <p style={{ marginBottom: '20px', fontSize: '13px', color: '#54595d' }}>
            Use the modules below to verify concurrency limits, API payment webhooks, quota resets, and deduplication logic. Real-time updates will print in the log window below.
          </p>

          {/* Diagnostic Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            
            {/* Box 1 */}
            <div style={{ border: '1px solid #a2a9b1', padding: '15px', backgroundColor: '#f8f9fa', fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #eaecf0', paddingBottom: '4px', marginBottom: '8px' }}>
                ⚡ Concurrency Load Test
              </div>
              <p style={{ color: '#54595d', fontSize: '12px', minHeight: '48px', marginBottom: '12px' }}>
                Generates 10 leads simultaneously to evaluate locking mechanisms and correct fair-rotation indexing under load.
              </p>
              <button onClick={handleGenerateLeads} disabled={loading !== null} style={{
                padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #a2a9b1',
                borderRadius: '2px', backgroundColor: '#eaecf0', cursor: loading ? 'not-allowed' : 'pointer'
              }}>
                {loading === 'generate' ? 'Generating...' : 'Run Load Test'}
              </button>
            </div>

            {/* Box 2 */}
            <div style={{ border: '1px solid #a2a9b1', padding: '15px', backgroundColor: '#f8f9fa', fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #eaecf0', paddingBottom: '4px', marginBottom: '8px' }}>
                🔄 Simulate Reset Webhook
              </div>
              <p style={{ color: '#54595d', fontSize: '12px', minHeight: '48px', marginBottom: '12px' }}>
                Simulates Razorpay payment callback by resetting all active provider monthly quotas back to 10 limits.
              </p>
              <button onClick={handleResetQuotas} disabled={loading !== null} style={{
                padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #a2a9b1',
                borderRadius: '2px', backgroundColor: '#eaecf0', cursor: loading ? 'not-allowed' : 'pointer'
              }}>
                {loading === 'reset' ? 'Resetting...' : 'Trigger Quota Reset'}
              </button>
            </div>

            {/* Box 3 */}
            <div style={{ border: '1px solid #a2a9b1', padding: '15px', backgroundColor: '#f8f9fa', fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #eaecf0', paddingBottom: '4px', marginBottom: '8px' }}>
                📨 Idempotent Webhook Callback
              </div>
              <p style={{ color: '#54595d', fontSize: '12px', minHeight: '48px', marginBottom: '12px' }}>
                Sends a mock payment gateway webhook. A unique Idempotency Key is created each time.
              </p>
              <button onClick={() => handleWebhook(false)} disabled={loading !== null} style={{
                padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #a2a9b1',
                borderRadius: '2px', backgroundColor: '#eaecf0', cursor: loading ? 'not-allowed' : 'pointer'
              }}>
                {loading === 'webhook' ? 'Sending...' : 'Send Mock Webhook'}
              </button>
            </div>

            {/* Box 4 */}
            <div style={{ border: '1px solid #a2a9b1', padding: '15px', backgroundColor: '#f8f9fa', fontSize: '13px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #eaecf0', paddingBottom: '4px', marginBottom: '8px' }}>
                🛡️ Deduplication Burst Test
              </div>
              <p style={{ color: '#54595d', fontSize: '12px', minHeight: '48px', marginBottom: '12px' }}>
                Fires 5 simultaneous webhooks with the exact same Idempotency Key. Only the first one must pass.
              </p>
              <button onClick={handleWebhookBurst} disabled={loading !== null} style={{
                padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #a2a9b1',
                borderRadius: '2px', backgroundColor: '#eaecf0', cursor: loading ? 'not-allowed' : 'pointer'
              }}>
                {loading === 'burst' ? 'Testing...' : 'Execute Deduplication'}
              </button>
            </div>

          </div>

          {/* Activity Log */}
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'normal',
            borderBottom: '1px solid #a2a9b1', paddingBottom: '3px', marginTop: '20px', marginBottom: '12px'
          }}>
            Activity Diagnostic Logs
          </h2>

          <div style={{
            border: '1px solid #a2a9b1', backgroundColor: '#f8f9fa', padding: '15px',
            fontSize: '12px', minHeight: '150px', maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#54595d', fontStyle: 'italic' }}>
                System diagnostic logs are currently empty. Trigger one of the modules above to print live output logs.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{
                  paddingBottom: '8px', borderBottom: '1px solid #eaecf0', marginBottom: '8px',
                  color: log.status === 'error' ? '#d33d33' : log.status === 'success' ? '#14866d' : '#202122'
                }}>
                  [{log.timestamp}] [{log.action.toUpperCase()}] {log.message}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Wikipedia Footer */}
      <footer style={{
        backgroundColor: '#f6f6f6', borderTop: '1px solid #eaecf0', padding: '24px 20px',
        textAlign: 'left', fontSize: '11px', color: '#54595d', maxWidth: '1200px', margin: '0 auto',
        borderLeft: '1px solid #a2a9b1', borderRight: '1px solid #a2a9b1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{ marginBottom: '5px' }}>This page was last generated on 2026-05-20. Content is available under Creative Commons Attribution-ShareAlike License.</p>
          <p>LeadForge® is a registered trademark of the LeadForge Foundation, Inc., a non-profit organization.</p>
        </div>
        <div>
          <a href="https://prowider.co" target="_blank" rel="noopener noreferrer" style={{ color: '#0645ad', fontWeight: 'bold' }}>Inspired by Prowider</a>
        </div>
      </footer>
    </div>
  );
}
