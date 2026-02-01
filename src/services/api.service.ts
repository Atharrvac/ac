import { supabase } from '@/integrations/supabase/client';
import { validateData, sanitizeInput } from '@/lib/validation';
import type { 
  WasteDetectionInput, 
  BookingInput, 
  RewardRedemptionInput,
  PaginationParams 
} from '@/lib/validation';
import { handleError, ERROR_CODES } from '@/lib/errorHandling';

/**
 * Production-ready API service layer
 * Handles all backend communication with proper error handling, validation, and rate limiting
 */

export class ApiService {
  private static instance: ApiService;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Check rate limit before making API calls
   */
  private async checkRateLimit(action: string, maxRequests: number = 100, windowMinutes: number = 15): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_action: action,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow on error to not block users
    }
  }

  /**
   * Create waste detection atomically with profile update
   */
  async createWasteDetection(input: WasteDetectionInput): Promise<string> {
    // Validate input
    const validation = validateData(wasteDetectionSchema, input);
    if (!validation.success) {
      throw handleError(new Error('Validation failed'), {
        context: 'createWasteDetection',
        errors: validation.errors.errors,
      });
    }

    // Check rate limit (max 50 detections per hour)
    const allowed = await this.checkRateLimit('waste_detection', 50, 60);
    if (!allowed) {
      throw handleError(new Error('Rate limit exceeded. Please try again later.'), {
        context: 'createWasteDetection',
        errorCode: ERROR_CODES.TIMEOUT_ERROR,
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw handleError(new Error('User not authenticated'), {
        context: 'createWasteDetection',
        errorCode: ERROR_CODES.AUTH_FAILED,
      });
    }

    try {
      const { data, error } = await supabase.rpc('create_waste_detection_atomic', {
        p_user_id: user.id,
        p_detected_item: sanitizeInput(input.detected_item),
        p_category: input.category,
        p_hazard_level: input.hazard_level,
        p_disposal_method: input.disposal_method ? sanitizeInput(input.disposal_method) : null,
        p_image_url: input.image_url,
        p_eco_coins_earned: input.eco_coins_earned,
        p_weight_kg: input.weight_kg,
        p_co2_saved_kg: input.co2_saved_kg,
      });

      if (error) throw error;
      return data as string;
    } catch (error) {
      throw handleError(error, {
        context: 'createWasteDetection',
        userId: user.id,
      });
    }
  }

  /**
   * Redeem reward atomically with balance check
   */
  async redeemReward(input: RewardRedemptionInput): Promise<string> {
    // Validate input
    const validation = validateData(rewardRedemptionSchema, input);
    if (!validation.success) {
      throw handleError(new Error('Validation failed'), {
        context: 'redeemReward',
        errors: validation.errors.errors,
      });
    }

    // Check rate limit (max 20 redemptions per day)
    const allowed = await this.checkRateLimit('reward_redemption', 20, 1440);
    if (!allowed) {
      throw handleError(new Error('Rate limit exceeded. Please try again later.'), {
        context: 'redeemReward',
        errorCode: ERROR_CODES.TIMEOUT_ERROR,
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw handleError(new Error('User not authenticated'), {
        context: 'redeemReward',
        errorCode: ERROR_CODES.AUTH_FAILED,
      });
    }

    try {
      const { data, error } = await supabase.rpc('redeem_reward_atomic', {
        p_user_id: user.id,
        p_reward_id: input.reward_id,
        p_coins_spent: input.coins_spent,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Insufficient EcoCoins')) {
          throw handleError(new Error(error.message), {
            context: 'redeemReward',
            errorCode: ERROR_CODES.INSUFFICIENT_COINS,
          });
        }
        throw error;
      }

      return data as string;
    } catch (error) {
      throw handleError(error, {
        context: 'redeemReward',
        userId: user.id,
      });
    }
  }

  /**
   * Get paginated waste detections
   */
  async getWasteDetections(params: PaginationParams = { page: 1, limit: 20 }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw handleError(new Error('User not authenticated'), {
        context: 'getWasteDetections',
        errorCode: ERROR_CODES.AUTH_FAILED,
      });
    }

    const offset = (params.page - 1) * params.limit;

    try {
      const { data, error, count } = await supabase
        .from('waste_detections')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page: params.page,
          limit: params.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / params.limit),
        },
      };
    } catch (error) {
      throw handleError(error, {
        context: 'getWasteDetections',
        userId: user.id,
      });
    }
  }

  /**
   * Get paginated bookings with collector details
   */
  async getBookings(params: PaginationParams = { page: 1, limit: 20 }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw handleError(new Error('User not authenticated'), {
        context: 'getBookings',
        errorCode: ERROR_CODES.AUTH_FAILED,
      });
    }

    const offset = (params.page - 1) * params.limit;

    try {
      const { data, error, count } = await supabase
        .from('bookings')
        .select(`
          *,
          collectors (
            name,
            phone,
            rating,
            specialties,
            address,
            city
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + params.limit - 1);

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page: params.page,
          limit: params.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / params.limit),
        },
      };
    } catch (error) {
      throw handleError(error, {
        context: 'getBookings',
        userId: user.id,
      });
    }
  }

  /**
   * Get leaderboard with pagination
   */
  async getLeaderboard(params: PaginationParams = { page: 1, limit: 50 }) {
    const offset = (params.page - 1) * params.limit;

    try {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_limit: params.limit,
        p_offset: offset,
      });

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          page: params.page,
          limit: params.limit,
        },
      };
    } catch (error) {
      throw handleError(error, {
        context: 'getLeaderboard',
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      throw handleError(new Error('User not authenticated'), {
        context: 'getUserStatistics',
        errorCode: ERROR_CODES.AUTH_FAILED,
      });
    }

    try {
      const { data, error } = await supabase.rpc('get_user_statistics', {
        p_user_id: targetUserId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleError(error, {
        context: 'getUserStatistics',
        userId: targetUserId,
      });
    }
  }

  /**
   * Soft delete booking
   */
  async deleteBooking(bookingId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw handleError(new Error('User not authenticated'), {
        context: 'deleteBooking',
        errorCode: ERROR_CODES.AUTH_FAILED,
      });
    }

    try {
      const { data, error } = await supabase.rpc('soft_delete_booking', {
        p_booking_id: bookingId,
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      throw handleError(error, {
        context: 'deleteBooking',
        userId: user.id,
        bookingId,
      });
    }
  }

  /**
   * Upload file to storage with validation
   */
  async uploadFile(file: File, bucket: string = 'avatars'): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw handleError(new Error('User not authenticated'), {
        context: 'uploadFile',
        errorCode: ERROR_CODES.AUTH_FAILED,
      });
    }

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      throw handleError(new Error('File size exceeds 10MB limit'), {
        context: 'uploadFile',
        errorCode: ERROR_CODES.FILE_TOO_LARGE,
      });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw handleError(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), {
        context: 'uploadFile',
        errorCode: ERROR_CODES.INVALID_FILE_TYPE,
      });
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${bucket}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      throw handleError(error, {
        context: 'uploadFile',
        userId: user.id,
        errorCode: ERROR_CODES.UPLOAD_FAILED,
      });
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();

// Re-export validation schemas for convenience
export { wasteDetectionSchema, bookingSchema, rewardRedemptionSchema } from '@/lib/validation';
