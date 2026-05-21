import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/db';
import Service from '@/models/Service';
import Lead from '@/models/Lead';
import AuditLog from '@/models/AuditLog';
import { allocateLead } from '@/lib/allocation';
import { rateLimit } from '@/lib/rate-limit';

// Indian first names for generating test data
const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Sai', 'Arnav', 'Dhruv', 'Kabir'];
const LAST_NAMES = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Joshi', 'Mishra', 'Reddy', 'Nair'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  const prefix = ['6', '7', '8', '9'][Math.floor(Math.random() * 4)];
  let number = prefix;
  for (let i = 0; i < 9; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4();

  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = rateLimit(`test:${ip}`, 5, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many test requests' }, requestId },
        { status: 429 }
      );
    }

    await dbConnect();
    const services = await Service.find({}).lean();

    if (services.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_SERVICES', message: 'No services found. Please run seed first.' }, requestId },
        { status: 400 }
      );
    }

    // Generate 10 leads concurrently to test concurrency
    const leadPromises = Array.from({ length: 10 }, async (_, i) => {
      const service = services[i % services.length];
      const customerName = `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
      const phoneNumber = generatePhone();
      const city = randomItem(CITIES);

      try {
        const lead = await Lead.create({
          customerName,
          phoneNumber,
          city,
          serviceId: service._id,
          serviceName: service.name,
          description: `Test lead #${i + 1} generated at ${new Date().toISOString()}`,
          status: 'pending',
          assignedProviderCount: 0,
        });

        const allocation = await allocateLead(
          lead._id,
          service.slug,
          service._id,
          requestId
        );

        await Lead.findByIdAndUpdate(lead._id, {
          status: allocation.success ? 'assigned' : 'failed',
          assignedProviderCount: allocation.totalAssigned,
        });

        return {
          success: true,
          leadId: lead._id,
          customerName,
          phoneNumber,
          service: service.name,
          assigned: allocation.totalAssigned,
          providers: allocation.assignedProviders.map((p) => p.providerName),
        };
      } catch (err: unknown) {
        const mongoErr = err as { code?: number };
        if (mongoErr.code === 11000) {
          return {
            success: false,
            error: 'Duplicate phone+service combination',
            phoneNumber,
            service: service.name,
          };
        }
        return {
          success: false,
          error: 'Failed to create lead',
          phoneNumber,
          service: service.name,
        };
      }
    });

    // Execute ALL concurrently (tests concurrency handling)
    const results = await Promise.all(leadPromises);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // Audit log
    await AuditLog.create({
      action: 'bulk_test_generated',
      entityType: 'lead',
      entityId: null,
      details: { successCount, failCount, totalAttempted: 10 },
      requestId,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAttempted: 10,
          successCount,
          failCount,
        },
        results,
      },
      requestId,
    });
  } catch (error) {
    console.error(`[${requestId}] Bulk lead generation failed:`, error);
    return NextResponse.json(
      { success: false, error: { code: 'GENERATION_FAILED', message: 'Failed to generate test leads' }, requestId },
      { status: 500 }
    );
  }
}
