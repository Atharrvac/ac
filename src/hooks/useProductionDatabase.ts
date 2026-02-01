import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api.service';
import type { WasteDetectionInput, BookingInput, RewardRedemptionInput, PaginationParams } from '@/lib/validation';
import { handleError } from '@/lib/errorHandling';

/**
 * Production-ready database hooks with proper error handling,
 * optimistic updates, and pagination
 */

// Profile hooks
export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onError: (error) => {
      const appError = handleError(error, { context: 'useProfile' });
      console.error('Profile fetch failed:', appError);
    },
  });
};

// Waste detection hooks with pagination
export const useWasteDetections = (params: PaginationParams = { page: 1, limit: 20 }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['waste-detections', user?.id, params.page, params.limit],
    queryFn: () => apiService.getWasteDetections(params),
    enabled: !!user?.id,
    keepPreviousData: true, // Keep previous page data while loading next
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateWasteDetection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WasteDetectionInput) => apiService.createWasteDetection(input),
    onMutate: async (newDetection) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['waste-detections'] });
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      // Snapshot previous values
      const previousDetections = queryClient.getQueryData(['waste-detections']);
      const previousProfile = queryClient.getQueryData(['profile']);

      // Optimistically update profile
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          eco_coins: old.eco_coins + newDetection.eco_coins_earned,
          total_items_recycled: old.total_items_recycled + 1,
          total_co2_saved: old.total_co2_saved + newDetection.co2_saved_kg,
        };
      });

      return { previousDetections, previousProfile };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-detections'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
      
      toast({
        title: 'Detection Recorded',
        description: 'Your waste detection has been recorded and EcoCoins awarded!',
        duration: 3000,
      });
    },
    onError: (error, _, context) => {
      // Rollback optimistic updates
      if (context?.previousDetections) {
        queryClient.setQueryData(['waste-detections'], context.previousDetections);
      }
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }

      const appError = handleError(error, { context: 'useCreateWasteDetection' });
      toast({
        title: 'Detection Failed',
        description: appError.message,
        variant: 'destructive',
        duration: 5000,
      });
    },
  });
};

// Booking hooks with pagination
export const useBookings = (params: PaginationParams = { page: 1, limit: 20 }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookings', user?.id, params.page, params.limit],
    queryFn: () => apiService.getBookings(params),
    enabled: !!user?.id,
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateBooking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: BookingInput) => {
      if (!user?.id) throw new Error('No user ID');

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...booking,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking Created',
        description: 'Your pickup has been scheduled successfully!',
        duration: 3000,
      });
    },
    onError: (error) => {
      const appError = handleError(error, { context: 'useCreateBooking' });
      toast({
        title: 'Booking Failed',
        description: appError.message,
        variant: 'destructive',
        duration: 5000,
      });
    },
  });
};

export const useDeleteBooking = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => apiService.deleteBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
        duration: 3000,
      });
    },
    onError: (error) => {
      const appError = handleError(error, { context: 'useDeleteBooking' });
      toast({
        title: 'Cancellation Failed',
        description: appError.message,
        variant: 'destructive',
        duration: 5000,
      });
    },
  });
};

// Reward hooks
export const useRewards = () => {
  return useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('coins_required', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (rewards don't change often)
  });
};

export const useRedeemReward = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RewardRedemptionInput) => apiService.redeemReward(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      const previousProfile = queryClient.getQueryData(['profile']);

      // Optimistically update profile
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          eco_coins: old.eco_coins - input.coins_spent,
        };
      });

      return { previousProfile };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['reward-redemptions'] });
      
      toast({
        title: 'Reward Redeemed',
        description: 'Your reward has been successfully redeemed!',
        duration: 3000,
      });
    },
    onError: (error, _, context) => {
      // Rollback optimistic update
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }

      const appError = handleError(error, { context: 'useRedeemReward' });
      toast({
        title: 'Redemption Failed',
        description: appError.message,
        variant: 'destructive',
        duration: 5000,
      });
    },
  });
};

// Leaderboard hook
export const useLeaderboard = (params: PaginationParams = { page: 1, limit: 50 }) => {
  return useQuery({
    queryKey: ['leaderboard', params.page, params.limit],
    queryFn: () => apiService.getLeaderboard(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// User statistics hook
export const useUserStatistics = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-statistics', targetUserId],
    queryFn: () => apiService.getUserStatistics(targetUserId),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
  });
};

// Collectors hook
export const useCollectors = () => {
  return useQuery({
    queryKey: ['collectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collectors')
        .select('*')
        .eq('available', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// File upload hook
export const useUploadFile = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ file, bucket }: { file: File; bucket?: string }) => 
      apiService.uploadFile(file, bucket),
    onError: (error) => {
      const appError = handleError(error, { context: 'useUploadFile' });
      toast({
        title: 'Upload Failed',
        description: appError.message,
        variant: 'destructive',
        duration: 5000,
      });
    },
  });
};

// Import supabase for direct queries where needed
import { supabase } from '@/integrations/supabase/client';
