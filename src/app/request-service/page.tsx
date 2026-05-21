'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Service {
  _id: string;
  name: string;
  slug: string;
}

interface AllocationResult {
  lead: { id: string; customerName: string; phoneNumber: string; city: string; service: string; status: string };
  allocation: { totalAssigned: number; providers: Array<{ providerName: string; assignmentType: string; reason: string }>; warnings: string[] };
}

export default function RequestServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ customerName: '', phoneNumber: '', city: '', serviceSlug: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AllocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/services').then(r => r.json()).then(d => { if (d.success) setServices(d.data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        setForm({ customerName: '', phoneNumber: '', city: '', serviceSlug: '', description: '' });
      } else {
        setError(data.error?.message || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f6f6f6', minHeight: '100vh', color: '#202122', fontFamily: 'sans-serif' }}>

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
              <li><Link href="/request-service" style={{ color: '#0645ad', fontWeight: 'bold' }}>Submit lead form</Link></li>
              <li><Link href="/dashboard" style={{ color: '#0645ad' }}>Provider dashboard</Link></li>
              <li><Link href="/test-tools" style={{ color: '#0645ad' }}>System test tools</Link></li>
            </ul>
          </div>
        </aside>

        {/* Main Content Column */}
        <main style={{ flexGrow: 1, padding: '20px 25px', overflowX: 'auto' }}>
          {/* Top Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #a2a9b1', marginBottom: '20px', paddingBottom: '1px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ border: '1px solid #a2a9b1', borderBottom: '1px solid #ffffff', padding: '5px 12px', backgroundColor: '#ffffff', fontSize: '13px', zIndex: 1, marginBottom: '-1px' }}>Request Submission</div>
              <div style={{ border: '1px solid transparent', padding: '5px 12px', fontSize: '13px', color: '#0645ad', cursor: 'pointer' }}>Talk</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link href="/" style={{ padding: '5px 12px', fontSize: '13px', color: '#0645ad' }}>Main page</Link>
              <div style={{ border: '1px solid #a2a9b1', borderBottom: '1px solid #ffffff', padding: '5px 12px', backgroundColor: '#ffffff', fontSize: '13px', zIndex: 1, marginBottom: '-1px' }}>Submit lead</div>
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
            Submit Service Request
          </h1>

          <p style={{ marginBottom: '20px', fontSize: '13px', color: '#54595d' }}>
            Fill out the form below to register a customer inquiry. Leads are instantly routed using Phase 1 (mandatory rules) and Phase 2 (fair round-robin rotation) parameters.
          </p>

          {/* Result Alert Boxes (Wikipedia Classic Message Style) */}
          {error && (
            <div style={{
              border: '1px solid #d33d33', backgroundColor: '#fdf1f1', padding: '12px',
              fontSize: '13px', color: '#d33d33', marginBottom: '20px'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div style={{
              border: '1px solid #14866d', backgroundColor: '#f4fbf9', padding: '16px',
              fontSize: '13px', color: '#202122', marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#14866d', fontSize: '14px', marginBottom: '8px' }}>
                ✓ Enquiry Successfully Recorded and Assigned
              </div>
              <p style={{ marginBottom: '8px' }}>
                Lead ID: <code>{result.lead.id}</code> | Customer: <strong>{result.lead.customerName}</strong> | Service: {result.lead.service}
              </p>
              
              <div style={{ fontWeight: 'bold', marginBottom: '5px', marginTop: '10px' }}>Assigned Providers:</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #a2a9b1', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #a2a9b1', padding: '6px', textAlign: 'left' }}>Provider</th>
                    <th style={{ border: '1px solid #a2a9b1', padding: '6px', textAlign: 'left' }}>Allocation Type</th>
                    <th style={{ border: '1px solid #a2a9b1', padding: '6px', textAlign: 'left' }}>Logic Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {result.allocation.providers.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eaecf0' }}>
                      <td style={{ border: '1px solid #a2a9b1', padding: '6px', fontWeight: 'bold' }}>{p.providerName}</td>
                      <td style={{ border: '1px solid #a2a9b1', padding: '6px', color: p.assignmentType === 'mandatory' ? '#ac6600' : '#0645ad' }}>
                        {p.assignmentType === 'mandatory' ? '⭐ Mandatory' : '🔄 Fair Rotation'}
                      </td>
                      <td style={{ border: '1px solid #a2a9b1', padding: '6px', color: '#54595d' }}>{p.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {result.allocation.warnings.length > 0 && (
                <div style={{ marginTop: '12px', color: '#ac6600', fontWeight: 'bold' }}>
                  Warnings:
                  <ul style={{ paddingLeft: '20px', fontWeight: 'normal' }}>
                    {result.allocation.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <div style={{
            maxWidth: '550px', border: '1px solid #a2a9b1', backgroundColor: '#f8f9fa',
            padding: '20px', fontSize: '13px'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Customer Name *</label>
                <input
                  type="text" required value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  placeholder="e.g. John Doe"
                  style={{ width: '100%', padding: '6px', border: '1px solid #a2a9b1', borderRadius: '2px', backgroundColor: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Phone Number *</label>
                <input
                  type="tel" required value={form.phoneNumber}
                  onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  style={{ width: '100%', padding: '6px', border: '1px solid #a2a9b1', borderRadius: '2px', backgroundColor: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>City *</label>
                <input
                  type="text" required value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Mumbai"
                  style={{ width: '100%', padding: '6px', border: '1px solid #a2a9b1', borderRadius: '2px', backgroundColor: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Service Type *</label>
                <select
                  required value={form.serviceSlug}
                  onChange={e => setForm(f => ({ ...f, serviceSlug: e.target.value }))}
                  style={{ width: '100%', padding: '6px', border: '1px solid #a2a9b1', borderRadius: '2px', backgroundColor: '#ffffff' }}
                >
                  <option value="">-- Choose target service --</option>
                  {services.map(s => <option key={s._id} value={s.slug}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Detailed Requirements (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Provide scope, budget, and timeline details..."
                  rows={4}
                  style={{ width: '100%', padding: '6px', border: '1px solid #a2a9b1', borderRadius: '2px', backgroundColor: '#ffffff', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button type="submit" disabled={loading} style={{
                  padding: '6px 16px', fontWeight: 'bold', border: '1px solid #a2a9b1',
                  borderRadius: '2px', backgroundColor: '#eaecf0', cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#202122'
                }}>
                  {loading ? 'Submitting request...' : 'Submit Request'}
                </button>
              </div>
            </form>
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
