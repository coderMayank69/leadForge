import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';

export async function GET() {
  try {
    await dbConnect();
    const providers = await Provider.find({ isActive: true })
      .sort({ slug: 1 })
      .lean();

    // Add remaining quota virtual
    const providersWithQuota = providers.map((p) => ({
      ...p,
      remainingQuota: Math.max(0, p.monthlyQuota - p.currentMonthLeads),
    }));

    return NextResponse.json({
      success: true,
      data: providersWithQuota,
    });
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch providers' } },
      { status: 500 }
    );
  }
}
