import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';

const startTime = Date.now();

export async function GET() {
  try {
    await dbConnect();
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    return NextResponse.json({
      success: true,
      data: {
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        database: dbStatus,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        name: 'LeadForge',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, data: { status: 'unhealthy', database: 'disconnected' } },
      { status: 503 }
    );
  }
}
