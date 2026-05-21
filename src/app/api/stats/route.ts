import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Provider from '@/models/Provider';
import LeadAssignment from '@/models/LeadAssignment';

export async function GET() {
  try {
    await dbConnect();
    const [totalLeads, assignedLeads, totalAssignments, providers] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'assigned' }),
      LeadAssignment.countDocuments(),
      Provider.find({}).lean(),
    ]);
    const totalQuotaUsed = providers.reduce((sum, p) => sum + p.currentMonthLeads, 0);
    const totalQuotaAvailable = providers.reduce((sum, p) => sum + p.monthlyQuota, 0);
    return NextResponse.json({
      success: true,
      data: {
        leads: { total: totalLeads, assigned: assignedLeads, pending: totalLeads - assignedLeads },
        assignments: { total: totalAssignments },
        quota: { used: totalQuotaUsed, available: totalQuotaAvailable, percentage: Math.round((totalQuotaUsed / totalQuotaAvailable) * 100) },
        providers: providers.map(p => ({
          name: p.name, slug: p.slug, used: p.currentMonthLeads, quota: p.monthlyQuota,
          remaining: p.monthlyQuota - p.currentMonthLeads,
        })),
      },
    });
  } catch (error) {
    console.error('Stats fetch failed:', error);
    return NextResponse.json({ success: false, error: { message: 'Failed to fetch stats' } }, { status: 500 });
  }
}
