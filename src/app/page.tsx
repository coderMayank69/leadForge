'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Stats {
  leads: { total: number; assigned: number; pending: number };
  quota: { used: number; available: number; percentage: number };
  providers: Array<{ name: string; slug: string; used: number; quota: number; remaining: number }>;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.data); });
  }, []);

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
        
        {/* Left Sidebar (Wikipedia Style) */}
        <aside style={{ width: '175px', minWidth: '175px', padding: '15px 10px', borderRight: '1px solid #eaecf0', backgroundColor: '#ffffff', fontSize: '12px' }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px', textAlign: 'center' }}>
            <Image src="/logo.png" alt="LeadForge Logo" width={60} height={60} style={{ marginBottom: '5px' }} />
            <span style={{ fontSize: '18px', fontWeight: 'normal', fontFamily: 'Georgia, serif', color: '#000000' }}>LeadForge</span>
            <span style={{ fontSize: '10px', color: '#54595d', fontStyle: 'italic' }}>The Intelligent Engine</span>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#54595d', borderBottom: '1px solid #a2a9b1', paddingBottom: '2px', marginBottom: '5px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>Navigation</div>
            <ul style={{ listStyle: 'none', paddingLeft: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <li><Link href="/" style={{ color: '#0645ad', fontWeight: 'bold' }}>Main page</Link></li>
              <li><Link href="/request-service" style={{ color: '#0645ad' }}>Submit lead form</Link></li>
              <li><Link href="/dashboard" style={{ color: '#0645ad' }}>Provider dashboard</Link></li>
              <li><Link href="/test-tools" style={{ color: '#0645ad' }}>System test tools</Link></li>
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#54595d', borderBottom: '1px solid #a2a9b1', paddingBottom: '2px', marginBottom: '5px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>External Links</div>
            <ul style={{ listStyle: 'none', paddingLeft: '5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <li><a href="https://prowider.co" target="_blank" rel="noopener noreferrer" style={{ color: '#0645ad' }}>Prowider Official</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0645ad' }}>GitHub Repository</a></li>
            </ul>
          </div>
        </aside>

        {/* Main Content Column */}
        <main style={{ flexGrow: 1, padding: '20px 25px', overflowX: 'auto' }}>
          {/* Top Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #a2a9b1', marginBottom: '20px', paddingBottom: '1px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ border: '1px solid #a2a9b1', borderBottom: '1px solid #ffffff', padding: '5px 12px', backgroundColor: '#ffffff', fontSize: '13px', zIndex: 1, marginBottom: '-1px' }}>Page</div>
              <div style={{ border: '1px solid transparent', padding: '5px 12px', fontSize: '13px', color: '#0645ad', cursor: 'pointer' }}>Discussion</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ border: '1px solid #a2a9b1', borderBottom: '1px solid #ffffff', padding: '5px 12px', backgroundColor: '#ffffff', fontSize: '13px', zIndex: 1, marginBottom: '-1px' }}>Read</div>
              <Link href="/request-service" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Submit lead</Link>
              <Link href="/dashboard" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Dashboard</Link>
              <Link href="/test-tools" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Test tools</Link>
            </div>
          </div>

          {/* Page Title */}
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 'normal',
            borderBottom: '1px solid #a2a9b1', paddingBottom: '3px', marginTop: 0, marginBottom: '15px',
            color: '#000000'
          }}>
            LeadForge
          </h1>

          {/* Infobox (Wikipedia Classic Floating Infobox) */}
          <div style={{
            float: 'right', width: '290px', border: '1px solid #a2a9b1',
            backgroundColor: '#f8f9fa', padding: '8px', marginLeft: '20px', marginBottom: '20px',
            fontSize: '12px', color: '#202122'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#eaecf0', padding: '5px', marginBottom: '8px', border: '1px solid #a2a9b1' }}>
              LeadForge
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <Image src="/logo.png" alt="LeadForge Logo" width={100} height={100} style={{ border: '1px solid #eaecf0' }} />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eaecf0' }}>
                  <th style={{ textAlign: 'left', padding: '4px', width: '45%' }}>Developer</th>
                  <td style={{ padding: '4px' }}>Mayank Singh</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eaecf0' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>System Model</th>
                  <td style={{ padding: '4px' }}>Lead Distribution</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eaecf0' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Database</th>
                  <td style={{ padding: '4px' }}>MongoDB Atlas</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eaecf0' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Server Stack</th>
                  <td style={{ padding: '4px' }}>Next.js 14</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eaecf0' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Real-time Link</th>
                  <td style={{ padding: '4px' }}>Server-Sent Events</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eaecf0' }}>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Inspiration</th>
                  <td style={{ padding: '4px' }}><a href="https://prowider.co" target="_blank" rel="noopener noreferrer" style={{ color: '#0645ad' }}>Prowider</a></td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px' }}>Status</th>
                  <td style={{ padding: '4px', color: '#14866d', fontWeight: 'bold' }}>● Operational</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Lead Intro text */}
          <p style={{ marginBottom: '15px', fontSize: '14px', lineHeight: '1.6' }}>
            <strong>LeadForge</strong> is a simplified, high-concurrency lead generation and automated distribution platform. 
            The system acts as a middleware connecting incoming client service enquiries to vetted service providers. 
            By implementing a dual-phase allocation algorithm, the system guarantees that high-priority providers are matched 
            to specific inquiries, while remaining allocations are distributed using a fair round-robin rotation.
          </p>

          <p style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.6' }}>
            The system is designed with modern distributed systems principles, specifically targeting transactional safety, 
            concurrency controls, double-allocation prevention, and idempotency guarantees for external payment webhooks.
          </p>

          {/* Section: Live System Status */}
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'normal',
            borderBottom: '1px solid #a2a9b1', paddingBottom: '3px', marginTop: '30px', marginBottom: '15px',
            color: '#000000'
          }}>
            Live System Status
          </h2>
          
          {stats ? (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
              <div style={{ flex: 1, border: '1px solid #a2a9b1', backgroundColor: '#f8f9fa', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#54595d', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Enquiries</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>{stats.leads.total}</div>
              </div>
              <div style={{ flex: 1, border: '1px solid #a2a9b1', backgroundColor: '#f8f9fa', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#54595d', fontWeight: 'bold', textTransform: 'uppercase' }}>Assigned Leads</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#14866d' }}>{stats.leads.assigned}</div>
              </div>
              <div style={{ flex: 1, border: '1px solid #a2a9b1', backgroundColor: '#f8f9fa', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#54595d', fontWeight: 'bold', textTransform: 'uppercase' }}>Overall Quota Used</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#ac6600' }}>{stats.quota.percentage}%</div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#54595d', marginBottom: '20px' }}>Loading real-time status from database...</p>
          )}

          {/* Section: Provider Registry */}
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'normal',
            borderBottom: '1px solid #a2a9b1', paddingBottom: '3px', marginTop: '30px', marginBottom: '15px',
            color: '#000000'
          }}>
            Vetted Providers Quota Status
          </h2>
          
          {stats ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #a2a9b1', marginBottom: '25px', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#eaecf0', borderBottom: '1px solid #a2a9b1' }}>
                  <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Provider Name</th>
                  <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Quota Allocation</th>
                  <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Remaining Quota</th>
                  <th style={{ border: '1px solid #a2a9b1', padding: '8px', textAlign: 'left' }}>Status Bar</th>
                </tr>
              </thead>
              <tbody>
                {stats.providers.map((p) => {
                  const usedPct = Math.min(100, (p.used / p.quota) * 100);
                  return (
                    <tr key={p.slug} style={{ borderBottom: '1px solid #eaecf0' }}>
                      <td style={{ border: '1px solid #a2a9b1', padding: '8px', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ border: '1px solid #a2a9b1', padding: '8px' }}>{p.used} / {p.quota} leads used</td>
                      <td style={{ border: '1px solid #a2a9b1', padding: '8px', color: p.remaining <= 2 ? '#d33d33' : '#202122' }}>{p.remaining} remaining</td>
                      <td style={{ border: '1px solid #a2a9b1', padding: '8px' }}>
                        <div style={{ width: '120px', height: '10px', backgroundColor: '#eaecf0', border: '1px solid #a2a9b1', position: 'relative' }}>
                          <div style={{
                            width: `${usedPct}%`, height: '100%',
                            backgroundColor: p.remaining <= 2 ? '#d33d33' : p.remaining <= 5 ? '#ac6600' : '#14866d'
                          }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#54595d', marginBottom: '25px' }}>Provider list loading...</p>
          )}

          {/* Section: Technical Infrastructure Highlights */}
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 'normal',
            borderBottom: '1px solid #a2a9b1', paddingBottom: '3px', marginTop: '30px', marginBottom: '15px',
            color: '#000000'
          }}>
            Technical Specifications
          </h2>
          <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8', marginBottom: '25px' }}>
            <li>
              <strong>Atomic Allocation:</strong> Lead matching leverages MongoDB <code>findOneAndUpdate</code> increments wrapped in strict conditional bounds, avoiding race-conditions and over-allocation.
            </li>
            <li>
              <strong>Fair Round-Robin:</strong> Rotation indices are persisted inside the <code>rotationstates</code> collection, surviving app server restarts and container scale-downs.
            </li>
            <li>
              <strong>Real-Time Updates:</strong> Built-in support for Server-Sent Events (SSE) ensures active providers receive instant notification of matched leads within 2 seconds.
            </li>
            <li>
              <strong>Webhook Idempotency:</strong> Every transaction is tracked via UUID keys; duplicate requests are automatically resolved to prevent duplicate quota increments.
            </li>
            <li>
              <strong>Full System Audit trail:</strong> Crucial mutations and system changes are tracked in a dedicated audit collection.
            </li>
          </ul>

          {/* Section: References & Footnotes */}
          <h2 style={{
            fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 'bold',
            borderBottom: '1px solid #a2a9b1', paddingBottom: '2px', marginTop: '35px', marginBottom: '10px',
            color: '#000000'
          }}>
            References
          </h2>
          <ol style={{ paddingLeft: '20px', fontSize: '12px', color: '#54595d', lineHeight: '1.6' }}>
            <li>Prowider Lead Distribution platform, available online: <a href="https://prowider.co" target="_blank" rel="noopener noreferrer" style={{ color: '#0645ad' }}>prowider.co</a>.</li>
            <li>MongoDB atomic document updates guidelines: <a href="https://mongodb.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0645ad' }}>mongodb.com</a>.</li>
            <li>Server-Sent Events browser specification: <a href="https://w3.org" target="_blank" rel="noopener noreferrer" style={{ color: '#0645ad' }}>w3.org/TR/eventsource</a>.</li>
          </ol>
        </main>
      </div>

      {/* Wikipedia Classic Footer */}
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
