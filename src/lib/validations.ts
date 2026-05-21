import { z } from 'zod';

export const leadFormSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number')
    .trim(),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters')
    .trim(),
  serviceSlug: z
    .string()
    .min(1, 'Please select a service'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .default(''),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

export const webhookSchema = z.object({
  idempotencyKey: z
    .string()
    .uuid('Invalid idempotency key — must be a valid UUID'),
  eventType: z
    .enum(['quota_reset', 'payment_confirmed']),
  providerId: z
    .string()
    .optional(),
  payload: z
    .record(z.string(), z.unknown())
    .optional()
    .default({}),
});

export type WebhookData = z.infer<typeof webhookSchema>;
