import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';
import AuditLog from '@/models/AuditLog';

export async function POST() {
  const requestId = uuidv4();
  try {
    await dbConnect();
    const result = await Provider.updateMany({}, {
      $set: { currentMonthLeads: 0, quotaResetAt: new Date() },
    });
    await AuditLog.create({
      action: 'quota_reset_all',
      entityType: 'provider',
      entityId: null,
      details: { providersReset: result.modifiedCount },
      requestId,
      timestamp: new Date(),
    });
    return NextResponse.json({
      success: true,
      data: { message: `Quota reset for ${result.modifiedCount} providers`, providersReset: result.modifiedCount },
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Quota reset failed:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'RESET_FAILED', message: 'Failed to reset quotas' }, requestId },
      { status: 500 }
    );
  }
}
