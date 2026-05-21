/**
 * Business Rules Configuration
 * 
 * This file defines the mandatory assignment rules and fair rotation pools
 * as specified in the assignment requirements.
 */

// Mandatory providers for each service
// Key: service slug, Value: array of provider slugs that MUST receive every lead
export const MANDATORY_RULES: Record<string, string[]> = {
  'service-1': ['provider-1'],
  'service-2': ['provider-5'],
  'service-3': ['provider-1', 'provider-4'],
};

// Fair rotation pools for each service
// Key: service slug, Value: array of provider slugs eligible for fair rotation
export const FAIR_POOLS: Record<string, string[]> = {
  'service-1': ['provider-2', 'provider-3', 'provider-4'],
  'service-2': ['provider-6', 'provider-7', 'provider-8'],
  'service-3': ['provider-2', 'provider-3', 'provider-5', 'provider-6', 'provider-7', 'provider-8'],
};

// Total providers each lead must be assigned to
export const REQUIRED_ASSIGNMENTS = 3;

// Default monthly quota per provider
export const DEFAULT_MONTHLY_QUOTA = 10;

// Total number of providers
export const TOTAL_PROVIDERS = 8;

// Services to seed
export const SEED_SERVICES = [
  { name: 'Service 1', slug: 'service-1', description: 'First service category' },
  { name: 'Service 2', slug: 'service-2', description: 'Second service category' },
  { name: 'Service 3', slug: 'service-3', description: 'Third service category' },
];

// Providers to seed
export const SEED_PROVIDERS = Array.from({ length: TOTAL_PROVIDERS }, (_, i) => ({
  name: `Provider ${i + 1}`,
  slug: `provider-${i + 1}`,
  monthlyQuota: DEFAULT_MONTHLY_QUOTA,
  currentMonthLeads: 0,
  isActive: true,
}));
