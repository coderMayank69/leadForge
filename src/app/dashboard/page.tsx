'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ProviderInfo {
  _id: string;
  name: string;
  slug: string;
  monthlyQuota: number;
  currentMonthLeads: number;
  remainingQuota: number;
}

interface LeadInfo {
  _id: string;
  customerName: string;
  phoneNumber: string;
  city: string;
  serviceName: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Assignment {
  _id: string;
  assignmentType: string;
  assignmentReason: string;
  assignedAt: string;
  lead: LeadInfo | null;
}

interface ProviderData {
  provider: ProviderInfo;
  assignments: Assignment[];
  stats: { totalLeads: number; remainingQuota: number; quotaUsed: number; monthlyQuota: number };
}

export default function DashboardPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load all providers
  useEffect(() => {
    fetch('/api/providers').then(r => r.json()).then(d => {
      if (d.success) {
        setProviders(d.data);
        if (d.data.length > 0 && !selected) setSelected(d.data[0].slug);
      }
    });
  }, [selected]);

  // SSE connection for real-time updates
  const connectSSE = useCallback((slug: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`/api/providers/${slug}/sse`);
    eventSourceRef.current = es;

    es.onopen = () => setSseConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          console.error('SSE error:', data.error);
          return;
        }
        setProviderData(data);
        setLastUpdate(new Date().toLocaleTimeString());
        // Also update the provider list
        setProviders(prev => prev.map(p =>
          p.slug === slug ? { ...p, currentMonthLeads: data.stats.quotaUsed, remainingQuota: data.stats.remainingQuota } : p
        ));
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    es.onerror = () => {
      setSseConnected(false);
      // EventSource auto-reconnects
    };
  }, []);

  useEffect(() => {
    if (selected) connectSSE(selected);
    return () => { if (eventSourceRef.current) eventSourceRef.current.close(); };
  }, [selected, connectSSE]);

  return (
    <div style={{ backgroundColor: '#f6f6f6', minHeight: '100vh', color: '#202122', fontFamily: 'sans-serif' }}>
      {/* Wikipedia Top Utility Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '4px 20px',
        fontSize: '12px', borderBottom: '1px solid #eaecf0', backgroundColor: '#ffffff',
        gap: '15px', color: '#54595d', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
            backgroundColor: sseConnected ? '#14866d' : '#d33d33'
          }} />
          <span style={{ fontSize: '11px', color: '#54595d' }}>
            {sseConnected ? 'SSE Connection Live' : 'SSE Connection Disconnected'} {lastUpdate && `(Last updated: ${lastUpdate})`}
          </span>
        </div>
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
              <li><Link href="/dashboard" style={{ color: '#0645ad', fontWeight: 'bold' }}>Provider dashboard</Link></li>
              <li><Link href="/test-tools" style={{ color: '#0645ad' }}>System test tools</Link></li>
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#54595d', borderBottom: '1px solid #a2a9b1', paddingBottom: '2px', marginBottom: '5px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>Active Providers</div>
            <ul style={{ listStyle: 'none', paddingLeft: '5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {providers.map(p => (
                <li key={p.slug}>
                  <button
                    onClick={() => setSelected(p.slug)}
                    style={{
                      border: 'none', background: 'none', padding: 0, margin: 0, textAlign: 'left',
                      color: selected === p.slug ? '#000000' : '#0645ad',
                      fontWeight: selected === p.slug ? 'bold' : 'normal',
                      cursor: 'pointer', fontSize: '12px', width: '100%',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}
                  >
                    • {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content Column */}
        <main style={{ flexGrow: 1, padding: '20px 25px', overflowX: 'auto' }}>
          {/* Top Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #a2a9b1', marginBottom: '20px', paddingBottom: '1px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ border: '1px solid #a2a9b1', borderBottom: '1px solid #ffffff', padding: '5px 12px', backgroundColor: '#ffffff', fontSize: '13px', zIndex: 1, marginBottom: '-1px' }}>Provider Report</div>
              <div style={{ border: '1px solid transparent', padding: '5px 12px', fontSize: '13px', color: '#0645ad', cursor: 'pointer' }}>Talk</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link href="/" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Main page</Link>
              <Link href="/request-service" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Submit lead</Link>
              <div style={{ border: '1px solid #a2a9b1', borderBottom: '1px solid #ffffff', padding: '5px 12px', backgroundColor: '#ffffff', fontSize: '13px', zIndex: 1, marginBottom: '-1px' }}>Dashboard</div>
              <Link href="/test-tools" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Test tools</Link>
            </div>
          </div>

          {providerData ? (
            <div>
              {/* Page Title */}
              <h1 style={{
                fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 'normal',
                borderBottom: '1px solid #a2a9b1', paddingBottom: '3px', marginTop: 0, marginBottom: '15px',
                color: '#000000'
              }}>
                Dashboard: {providerData.provider.name}
              </h1>

              <p style={{ marginBottom: '20px', fontSize: '13px', color: '#54595d' }}>
                This is the real-time activity and lead assignment registry for <strong>{providerData.provider.name}</strong>. Data updates automatically when new enquiries matching the provider's capabilities are processed.
              </p>

              {/* Stats Box (Wikipedia Style Infobox Table) */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '25px' }}>
                
                {/* Infobox */}
                <table style={{
                  border: '1px solid #a2a9b1', borderCollapse: 'collapse',
                  fontSize: '12px', width: '280px', backgroundColor: '#f8f9fa'
                }}>
                  <thead>
                    <tr>
                      <th colSpan={2} style={{
                        backgroundColor: '#eaecf0', borderBottom: '1px solid #a2a9b1',
                        padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px'
                      }}>
                        Provider Registry Info
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px', borderBottom: '1px solid #a2a9b1', fontWeight: 'bold', width: '120px' }}>Name:</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #a2a9b1' }}>{providerData.provider.name}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', borderBottom: '1px solid #a2a9b1', fontWeight: 'bold' }}>Monthly Quota:</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #a2a9b1' }}>{providerData.stats.monthlyQuota} leads</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', borderBottom: '1px solid #a2a9b1', fontWeight: 'bold' }}>Quota Consumed:</td>
                      <td style={{ padding: '6px', borderBottom: '1px solid #a2a9b1' }}>{providerData.stats.quotaUsed} leads</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', borderBottom: '1px solid #a2a9b1', fontWeight: 'bold' }}>Remaining:</td>
                      <td style={{
                        padding: '6px', borderBottom: '1px solid #a2a9b1', fontWeight: 'bold',
                        color: providerData.stats.remainingQuota <= 2 ? '#d33d33' : '#14866d'
                      }}>
                        {providerData.stats.remainingQuota} leads
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px', fontWeight: 'bold' }}>Total Ever Received:</td>
                      <td style={{ padding: '6px' }}>{providerData.stats.totalLeads} leads</td>
                    </tr>
                  </tbody>
                </table>

                {/* Quota Bar and Description */}
                <div style={{ flex: 1, minWidth: '280px', border: '1px solid #a2a9b1', padding: '15px', backgroundColor: '#f8f9fa' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>Quota Utilization Progress</div>
                  <div style={{
                    height: '14px', border: '1px solid #a2a9b1', borderRadius: '2px',
                    backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden', marginBottom: '10px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (providerData.stats.quotaUsed / providerData.stats.monthlyQuota) * 100)}%`,
                      backgroundColor: providerData.stats.remainingQuota <= 2 ? '#d33d33' : '#14866d',
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#54595d' }}>
                    Currently at <strong>{Math.round((providerData.stats.quotaUsed / providerData.stats.monthlyQuota) * 100)}%</strong> usage.
                    {providerData.stats.remainingQuota <= 2 && (
                      <span style={{ color: '#d33d33', fontWeight: 'bold', display: 'block', marginTop: '5px' }}>
                        ⚠️ Warning: Low remaining quota. Fair rotation algorithm will exclude this provider once limit is reached.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Table of Leads */}
              <h2 style={{
                fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'normal',
                borderBottom: '1px solid #a2a9b1', paddingBottom: '3px', marginTop: '20px', marginBottom: '12px'
              }}>
                Lead Assignments Log
              </h2>

              {providerData.assignments.length === 0 ? (
                <div style={{ border: '1px dashed #a2a9b1', padding: '25px', textAlign: 'center', fontSize: '13px', color: '#54595d' }}>
                  No lead assignments recorded for this provider in the current session.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #a2a9b1', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #a2a9b1' }}>
                      <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Customer Name</th>
                      <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Phone</th>
                      <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>City</th>
                      <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Service Category</th>
                      <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Assignment Type</th>
                      <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Allocation Reason</th>
                      <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerData.assignments.map((a) => (
                      <tr key={a._id} style={{ borderBottom: '1px solid #eaecf0' }}>
                        <td style={{ border: '1px solid #a2a9b1', padding: '8px', fontWeight: 'bold' }}>{a.lead?.customerName || '—'}</td>
                        <td style={{ border: '1px solid #a2a9b1', padding: '8px' }}><code>{a.lead?.phoneNumber || '—'}</code></td>
                        <td style={{ border: '1px solid #a2a9b1', padding: '8px' }}>{a.lead?.city || '—'}</td>
                        <td style={{ border: '1px solid #a2a9b1', padding: '8px' }}>{a.lead?.serviceName || '—'}</td>
                        <td style={{ border: '1px solid #a2a9b1', padding: '8px' }}>
                          <span style={{
                            fontWeight: 'bold',
                            color: a.assignmentType === 'mandatory' ? '#ac6600' : '#0645ad'
                          }}>
                            {a.assignmentType === 'mandatory' ? 'Mandatory' : 'Rotation'}
                          </span>
                        </td>
                        <td style={{ border: '1px solid #a2a9b1', padding: '8px', color: '#54595d' }}>{a.assignmentReason || '—'}</td>
                        <td style={{ border: '1px solid #a2a9b1', padding: '8px', color: '#54595d' }}>{new Date(a.assignedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#54595d' }}>
              <div style={{ fontSize: '14px' }}>Loading registry dashboard data...</div>
            </div>
          )}
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
