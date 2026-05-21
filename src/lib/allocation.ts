/**
 * Lead Allocation Engine
 * 
 * Core business logic for distributing leads to providers.
 * Implements:
 * 1. Mandatory assignment based on business rules
 * 2. Fair round-robin rotation for remaining slots
 * 3. Concurrency-safe atomic operations
 * 4. Quota enforcement
 */

import { Types } from 'mongoose';
import Provider, { IProvider } from '@/models/Provider';
import LeadAssignment from '@/models/LeadAssignment';
import RotationState from '@/models/RotationState';
import AuditLog from '@/models/AuditLog';
import { MANDATORY_RULES, FAIR_POOLS, REQUIRED_ASSIGNMENTS } from './rules';

interface AllocationResult {
  success: boolean;
  assignedProviders: Array<{
    providerId: string;
    providerName: string;
    assignmentType: 'mandatory' | 'fair_rotation';
    reason: string;
  }>;
  totalAssigned: number;
  warnings: string[];
}

/**
 * Allocates a lead to exactly 3 providers following business rules.
 * 
 * Algorithm:
 * 1. Phase 1: Assign mandatory providers (if quota available)
 * 2. Phase 2: Fill remaining slots via fair round-robin rotation
 * 3. All quota increments are atomic (findOneAndUpdate with $inc)
 * 4. Unique indexes prevent duplicate assignments even under concurrency
 */
export async function allocateLead(
  leadId: Types.ObjectId,
  serviceSlug: string,
  serviceId: Types.ObjectId,
  requestId: string = ''
): Promise<AllocationResult> {
  const result: AllocationResult = {
    success: false,
    assignedProviders: [],
    totalAssigned: 0,
    warnings: [],
  };

  let slotsNeeded = REQUIRED_ASSIGNMENTS;
  const assignedProviderIds: Set<string> = new Set();

  // ─── Phase 1: Mandatory Assignments ───
  const mandatoryProviderSlugs = MANDATORY_RULES[serviceSlug] || [];

  for (const providerSlug of mandatoryProviderSlugs) {
    if (slotsNeeded <= 0) break;

    const provider = await Provider.findOne({ slug: providerSlug, isActive: true });
    if (!provider) {
      result.warnings.push(`Mandatory provider ${providerSlug} not found or inactive`);
      continue;
    }

    // Atomic quota check + increment
    const updated = await atomicAssignProvider(
      provider,
      leadId,
      serviceId,
      'mandatory',
      `Mandatory rule: ${serviceSlug} → ${providerSlug}`
    );

    if (updated) {
      assignedProviderIds.add(provider._id.toString());
      result.assignedProviders.push({
        providerId: provider._id.toString(),
        providerName: provider.name,
        assignmentType: 'mandatory',
        reason: `Mandatory rule: ${serviceSlug} → ${providerSlug}`,
      });
      slotsNeeded--;
    } else {
      result.warnings.push(`Mandatory provider ${providerSlug} at quota limit — skipped`);
    }
  }

  // ─── Phase 2: Fair Rotation ───
  if (slotsNeeded > 0) {
    const pool = FAIR_POOLS[serviceSlug] || [];
    
    if (pool.length === 0) {
      result.warnings.push(`No fair rotation pool defined for ${serviceSlug}`);
    } else {
      // Get current rotation state (persisted in DB)
      let rotationState = await RotationState.findOne({ serviceSlug });
      if (!rotationState) {
        rotationState = await RotationState.create({ serviceSlug, poolIndex: 0 });
      }

      let startIndex = rotationState.poolIndex;
      let lastAssignedIndex = startIndex;

      // Iterate through entire pool trying to fill remaining slots
      for (let i = 0; i < pool.length && slotsNeeded > 0; i++) {
        const candidateIndex = (startIndex + i) % pool.length;
        const candidateSlug = pool[candidateIndex];

        // Load provider
        const candidate = await Provider.findOne({ slug: candidateSlug, isActive: true });
        if (!candidate) continue;

        // Skip if already assigned to this lead
        if (assignedProviderIds.has(candidate._id.toString())) continue;

        // Atomic quota check + increment
        const assigned = await atomicAssignProvider(
          candidate,
          leadId,
          serviceId,
          'fair_rotation',
          `Fair rotation: pool position ${candidateIndex} for ${serviceSlug}`
        );

        if (assigned) {
          assignedProviderIds.add(candidate._id.toString());
          result.assignedProviders.push({
            providerId: candidate._id.toString(),
            providerName: candidate.name,
            assignmentType: 'fair_rotation',
            reason: `Fair rotation: pool position ${candidateIndex} for ${serviceSlug}`,
          });
          slotsNeeded--;
          lastAssignedIndex = (candidateIndex + 1) % pool.length;
        }
      }

      // Persist rotation state for next allocation
      await RotationState.findOneAndUpdate(
        { serviceSlug },
        { $set: { poolIndex: lastAssignedIndex, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  }

  result.totalAssigned = result.assignedProviders.length;
  result.success = result.totalAssigned > 0;

  if (result.totalAssigned < REQUIRED_ASSIGNMENTS) {
    result.warnings.push(
      `Only ${result.totalAssigned}/${REQUIRED_ASSIGNMENTS} providers assigned (insufficient quota available)`
    );
  }

  // Audit log
  await AuditLog.create({
    action: 'lead_allocated',
    entityType: 'lead',
    entityId: leadId,
    details: {
      serviceSlug,
      assignedProviders: result.assignedProviders,
      totalAssigned: result.totalAssigned,
      warnings: result.warnings,
    },
    requestId,
    timestamp: new Date(),
  });

  return result;
}

/**
 * Atomically assigns a provider to a lead.
 * Uses findOneAndUpdate with $lt condition to prevent over-quota assignment.
 * Uses unique index on (leadId, providerId) to prevent duplicate assignments.
 * 
 * Returns true if assignment was successful, false if quota was exhausted
 * or assignment already exists.
 */
async function atomicAssignProvider(
  provider: IProvider,
  leadId: Types.ObjectId,
  serviceId: Types.ObjectId,
  assignmentType: 'mandatory' | 'fair_rotation',
  reason: string
): Promise<boolean> {
  try {
    // Step 1: Atomic quota increment (only if under limit)
    const updated = await Provider.findOneAndUpdate(
      {
        _id: provider._id,
        currentMonthLeads: { $lt: provider.monthlyQuota },
      },
      {
        $inc: { currentMonthLeads: 1 },
      },
      { new: true }
    );

    if (!updated) {
      // Provider has hit quota — cannot assign
      return false;
    }

    // Step 2: Create assignment record (unique index prevents duplicates)
    try {
      await LeadAssignment.create({
        leadId,
        providerId: provider._id,
        serviceId,
        assignmentType,
        assignmentReason: reason,
        assignedAt: new Date(),
      });
      return true;
    } catch (err: unknown) {
      // If duplicate assignment (race condition), rollback the quota increment
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        await Provider.findByIdAndUpdate(provider._id, {
          $inc: { currentMonthLeads: -1 },
        });
        return false;
      }
      // Rollback quota on any other error too
      await Provider.findByIdAndUpdate(provider._id, {
        $inc: { currentMonthLeads: -1 },
      });
      throw err;
    }
  } catch (err) {
    console.error(`Failed to assign provider ${provider.slug}:`, err);
    return false;
  }
}
