import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/models/Service';

export async function GET() {
  try {
    await dbConnect();
    const services = await Service.find({}).sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch services' } },
      { status: 500 }
    );
  }
}
