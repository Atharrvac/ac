import { z } from 'zod';

// Profile validation schemas
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  avatar_url: z.string().url('Invalid URL').optional(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// Waste detection validation
export const wasteDetectionSchema = z.object({
  detected_item: z.string().min(1).max(200),
  category: z.enum([
    'Smartphones',
    'Laptops',
    'Tablets',
    'Batteries',
    'Cables',
    'Chargers',
    'Gaming',
    'Audio',
    'Computer Parts',
    'Storage',
  ]),
  hazard_level: z.enum(['low', 'medium', 'high', 'critical']),
  disposal_method: z.string().max(1000).optional(),
  image_url: z.string().url(),
  eco_coins_earned: z.number().int().min(0).max(10000),
  weight_kg: z.number().min(0).max(1000),
  co2_saved_kg: z.number().min(0).max(10000),
});

export type WasteDetectionInput = z.infer<typeof wasteDetectionSchema>;

// Booking validation
export const bookingSchema = z.object({
  collector_id: z.string().uuid().optional(),
  pickup_address: z.string().min(10, 'Address must be at least 10 characters').max(500),
  pickup_date: z.string().datetime('Invalid date format'),
  items_description: z.string().max(1000).optional(),
  estimated_weight: z.number().min(0).max(10000).optional(),
  notes: z.string().max(1000).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

// Reward redemption validation
export const rewardRedemptionSchema = z.object({
  reward_id: z.string().uuid('Invalid reward ID'),
  coins_spent: z.number().int().min(1, 'Coins must be positive'),
});

export type RewardRedemptionInput = z.infer<typeof rewardRedemptionSchema>;

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  category: z.string().optional(),
  sortBy: z.enum(['date', 'coins', 'relevance']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type SearchParams = z.infer<typeof searchSchema>;

// Validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
