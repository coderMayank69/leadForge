import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';
import WebhookEvent from '@/models/WebhookEvent';
import AuditLog from '@/models/AuditLog';
import { webhookSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const requestId = uuidv4();

  try {
    // Rate limiting for webhook endpoint
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = rateLimit(`webhook:${ip}`, 30, 60000);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many webhook calls' }, requestId },
        { status: 429 }
      );
    }

    await dbConnect();
    const body = await request.json();

    // Validate webhook payload
    const validation = webhookSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid webhook payload',
            details: validation.error.flatten().fieldErrors,
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const { idempotencyKey, eventType, providerId } = validation.data;

    // ─── Idempotency Check ───
    // Try to create webhook event (unique index on idempotencyKey)
    try {
      await WebhookEvent.create({
        idempotencyKey,
        eventType,
        providerId: providerId || null,
        payload: body,
        status: 'processing',
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        // Already processed — return idempotent response
        const existing = await WebhookEvent.findOne({ idempotencyKey }).lean();
        
        await AuditLog.create({
          action: 'webhook_duplicate',
          entityType: 'webhook',
          entityId: null,
          details: { idempotencyKey, eventType, providerId, originalStatus: existing?.status },
          requestId,
          timestamp: new Date(),
        });

        return NextResponse.json({
          success: true,
          data: {
            message: 'Webhook already processed (idempotent)',
            originalProcessedAt: existing?.processedAt,
            status: existing?.status,
          },
          meta: { idempotent: true, requestId },
        });
      }
      throw err;
    }

    // ─── Process the Webhook ───
    let result;

    if (eventType === 'quota_reset') {
      if (providerId) {
        // Reset single provider quota
        let provider;
        if (providerId.match(/^[0-9a-fA-F]{24}$/)) {
          provider = await Provider.findById(providerId);
        } else {
          provider = await Provider.findOne({ slug: providerId });
        }

        if (!provider) {
          await WebhookEvent.findOneAndUpdate(
            { idempotencyKey },
            { status: 'failed', processedAt: new Date() }
          );
          return NextResponse.json(
            { success: false, error: { code: 'PROVIDER_NOT_FOUND', message: 'Provider not found' }, requestId },
            { status: 404 }
          );
        }

        await Provider.findByIdAndUpdate(provider._id, {
          currentMonthLeads: 0,
          quotaResetAt: new Date(),
        });

        result = { provider: provider.name, previousLeads: provider.currentMonthLeads, newQuota: 10 };
      } else {
        // Reset ALL providers
        const updateResult = await Provider.updateMany(
          {},
          { $set: { currentMonthLeads: 0, quotaResetAt: new Date() } }
        );
        result = { providersReset: updateResult.modifiedCount, newQuota: 10 };
      }
    }

    // Mark webhook as processed
    await WebhookEvent.findOneAndUpdate(
      { idempotencyKey },
      { status: 'processed', processedAt: new Date() }
    );

    // Audit log
    await AuditLog.create({
      action: 'webhook_processed',
      entityType: 'webhook',
      entityId: null,
      details: { idempotencyKey, eventType, providerId, result },
      requestId,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Webhook processed successfully',
        eventType,
        result,
      },
      meta: { idempotent: false, requestId },
    });
  } catch (error) {
    console.error(`[${requestId}] Webhook processing failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'WEBHOOK_FAILED', message: 'Failed to process webhook' },
        requestId,
      },
      { status: 500 }
    );
  }
}
