import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';
import LeadAssignment from '@/models/LeadAssignment';
import Lead from '@/models/Lead';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await dbConnect();

        let provider;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
          provider = await Provider.findById(id).lean();
        } else {
          provider = await Provider.findOne({ slug: id }).lean();
        }

        if (!provider) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Provider not found' })}\n\n`));
          controller.close();
          return;
        }

        let lastCount = 0;

        const pollInterval = parseInt(process.env.SSE_POLL_INTERVAL_MS || '2000', 10);

        // Send initial data
        const sendUpdate = async () => {
          try {
            await dbConnect();

            // Refetch provider for latest quota
            const freshProvider = await Provider.findById(provider._id).lean();
            if (!freshProvider) return;

            const assignments = await LeadAssignment.find({ providerId: provider._id })
              .sort({ assignedAt: -1 })
              .lean();

            // Only send if data has changed
            if (assignments.length !== lastCount) {
              lastCount = assignments.length;

              const leadIds = assignments.map((a) => a.leadId);
              const leads = await Lead.find({ _id: { $in: leadIds } }).lean();
              const leadMap = new Map(leads.map((l) => [l._id.toString(), l]));

              const enrichedAssignments = assignments.map((a) => ({
                ...a,
                lead: leadMap.get(a.leadId.toString()) || null,
              }));

              const data = {
                provider: {
                  ...freshProvider,
                  remainingQuota: Math.max(0, freshProvider.monthlyQuota - freshProvider.currentMonthLeads),
                },
                assignments: enrichedAssignments,
                stats: {
                  totalLeads: assignments.length,
                  remainingQuota: Math.max(0, freshProvider.monthlyQuota - freshProvider.currentMonthLeads),
                  quotaUsed: freshProvider.currentMonthLeads,
                  monthlyQuota: freshProvider.monthlyQuota,
                },
                timestamp: new Date().toISOString(),
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            }
          } catch (err) {
            console.error('SSE poll error:', err);
          }
        };

        // Send initial data immediately
        await sendUpdate();

        // Poll for changes
        intervalId = setInterval(sendUpdate, pollInterval);

        // Clean up on abort
        request.signal.addEventListener('abort', () => {
          if (intervalId) clearInterval(intervalId);
          controller.close();
        });
      } catch (err) {
        console.error('SSE setup error:', err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'SSE setup failed' })}\n\n`));
        controller.close();
      }
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
