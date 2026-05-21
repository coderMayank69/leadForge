import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Service from '@/models/Service';
import AuditLog from '@/models/AuditLog';
import { leadFormSchema } from '@/lib/validations';
import { allocateLead } from '@/lib/allocation';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    await dbConnect();
    const leads = await Lead.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch leads' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4();
  const startTime = Date.now();

  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = rateLimit(`lead:${ip}`, 10, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
          requestId,
        },
        { status: 429 }
      );
    }

    await dbConnect();

    // Parse and validate body
    const body = await request.json();
    const validation = leadFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form data',
            details: validation.error.flatten().fieldErrors,
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const { customerName, phoneNumber, city, serviceSlug, description } = validation.data;

    // Find the service
    const service = await Service.findOne({ slug: serviceSlug });
    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SERVICE',
            message: `Service '${serviceSlug}' not found`,
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // Create the lead (unique compound index enforces duplicate rule)
    let lead;
    try {
      lead = await Lead.create({
        customerName,
        phoneNumber,
        city,
        serviceId: service._id,
        serviceName: service.name,
        description: description || '',
        status: 'pending',
        assignedProviderCount: 0,
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_LEAD',
              message: `A lead with phone number ${phoneNumber} already exists for ${service.name}`,
              details: { phoneNumber, service: service.name },
            },
            requestId,
          },
          { status: 409 }
        );
      }
      throw err;
    }

    // Audit log for lead creation
    await AuditLog.create({
      action: 'lead_created',
      entityType: 'lead',
      entityId: lead._id,
      details: { customerName, phoneNumber, city, serviceSlug, description },
      requestId,
      timestamp: new Date(),
    });

    // Allocate lead to providers
    const allocation = await allocateLead(
      lead._id,
      serviceSlug,
      service._id,
      requestId
    );

    // Update lead status
    await Lead.findByIdAndUpdate(lead._id, {
      status: allocation.success ? 'assigned' : 'failed',
      assignedProviderCount: allocation.totalAssigned,
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          lead: {
            id: lead._id,
            customerName,
            phoneNumber,
            city,
            service: service.name,
            status: allocation.success ? 'assigned' : 'failed',
          },
          allocation: {
            totalAssigned: allocation.totalAssigned,
            providers: allocation.assignedProviders,
            warnings: allocation.warnings,
          },
        },
        meta: {
          requestId,
          durationMs,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[${requestId}] Failed to create lead:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create lead. Please try again.',
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
