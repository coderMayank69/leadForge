import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';
import LeadAssignment from '@/models/LeadAssignment';
import Lead from '@/models/Lead';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Find provider by slug or id
    let provider;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      provider = await Provider.findById(id).lean();
    } else {
      provider = await Provider.findOne({ slug: id }).lean();
    }

    if (!provider) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Provider not found' } },
        { status: 404 }
      );
    }

    // Get all assignments for this provider
    const assignments = await LeadAssignment.find({ providerId: provider._id })
      .sort({ assignedAt: -1 })
      .lean();

    // Get lead details for each assignment
    const leadIds = assignments.map((a) => a.leadId);
    const leads = await Lead.find({ _id: { $in: leadIds } }).lean();
    const leadMap = new Map(leads.map((l) => [l._id.toString(), l]));

    const enrichedAssignments = assignments.map((a) => ({
      ...a,
      lead: leadMap.get(a.leadId.toString()) || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        provider: {
          ...provider,
          remainingQuota: Math.max(0, provider.monthlyQuota - provider.currentMonthLeads),
        },
        assignments: enrichedAssignments,
        stats: {
          totalLeads: assignments.length,
          remainingQuota: Math.max(0, provider.monthlyQuota - provider.currentMonthLeads),
          quotaUsed: provider.currentMonthLeads,
          monthlyQuota: provider.monthlyQuota,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch provider:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch provider details' } },
      { status: 500 }
    );
  }
}
