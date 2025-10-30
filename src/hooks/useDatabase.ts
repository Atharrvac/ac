import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { handleError, withRetry, withTimeout, ERROR_CODES, ERROR_RECOVERY } from '@/lib/errorHandling';
import { estimateWeightKg, computeCO2SavedKg } from '@/lib/impact';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type WasteDetection = Database['public']['Tables']['waste_detections']['Row'];
type Booking = Database['public']['Tables']['bookings']['Row'];
type RewardRedemption = Database['public']['Tables']['reward_redemptions']['Row'];

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw handleError(new Error('No user authenticated'), { context: 'useProfile' });
      }

      return withTimeout(
        withRetry(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw handleError(error, {
              context: 'profile_fetch',
              userId: user.id,
              errorCode: error.code
            });
          }
          return data;
        }, 3, 1000),
        10000
      );
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('JWT')) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      const appError = handleError(error, { context: 'useProfile' });
      console.error('Profile fetch failed:', appError);

      // Don't show toast for auth errors (user will be redirected)
      if (appError.code !== ERROR_CODES.AUTH_FAILED) {
        toast({
          title: 'Failed to load profile',
          description: appError.message,
          variant: 'destructive',
        });
      }
    },
  });
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user?.id) {
        throw handleError(new Error('No user authenticated'), { context: 'updateProfile' });
      }

      // Validate required fields
      if (updates.full_name && updates.full_name.trim().length < 2) {
        throw handleError(new Error('Name must be at least 2 characters'), {
          context: 'profile_validation',
          field: 'full_name'
        });
      }

      if (updates.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(updates.phone.replace(/\s/g, ''))) {
        throw handleError(new Error('Please enter a valid phone number'), {
          context: 'profile_validation',
          field: 'phone'
        });
      }

      return withTimeout(
        withRetry(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .upsert({
              user_id: user.id,
              updated_at: new Date().toISOString(),
              ...updates,
            }, { onConflict: 'user_id' })
            .select()
            .single();

          if (error) {
            throw handleError(error, {
              context: 'profile_update',
              userId: user.id,
              updates
            });
          }
          return data;
        }, 2, 1000),
        15000
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
        duration: 3000,
      });
    },
    onError: (error) => {
      const appError = handleError(error, { context: 'useUpdateProfile' });
      console.error('Profile update failed:', appError);

      toast({
        title: 'Update Failed',
        description: appError.message,
        variant: 'destructive',
        duration: 5000,
      });

      // Show recovery suggestions for certain errors
      if (ERROR_RECOVERY[appError.code as keyof typeof ERROR_RECOVERY]) {
        const suggestions = ERROR_RECOVERY[appError.code as keyof typeof ERROR_RECOVERY];
        setTimeout(() => {
          toast({
            title: 'Try these steps:',
            description: suggestions.join(' • '),
            duration: 8000,
          });
        }, 1000);
      }
    },
  });
};

export const useWasteDetections = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['waste-detections', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('waste_detections')
        .select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useCreateWasteDetection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (detection: Omit<WasteDetection, 'id' | 'user_id' | 'detected_at'>) => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('waste_detections')
        .insert({
          user_id: user.id,
          detected_at: new Date().toISOString(),
          ...detection,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update user's eco coins and stats (fetch current, then update)
      const { data: profile } = await supabase
        .from('profiles')
        .select('eco_coins,total_items_recycled,total_co2_saved')
        .eq('user_id', user.id)
        .single();

      const newCoins = (profile?.eco_coins ?? 0) + (detection.eco_coins_earned ?? 0);
      const newItems = (profile?.total_items_recycled ?? 0) + 1;

      // Estimate weight & CO2 saved from detection
      const { weightKg } = estimateWeightKg(detection.category, detection.detected_item);
      const co2Inc = computeCO2SavedKg(detection.category, weightKg);
      const newCo2 = (profile?.total_co2_saved ?? 0) + co2Inc;

      await supabase
        .from('profiles')
        .update({
          eco_coins: newCoins,
          total_items_recycled: newItems,
          total_co2_saved: newCo2,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-detections'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Detection Recorded',
        description: 'Your waste detection has been recorded and EcoCoins awarded!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Detection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useBookings = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          collectors (
            name,
            phone,
            rating,
            specialties
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useCreateBooking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'>) => {
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
      });
    },
    onError: (error) => {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

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
  });
};

export const useRedeemReward = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ rewardId, coinsSpent }: { rewardId: string; coinsSpent: number }) => {
      if (!user?.id) throw new Error('No user ID');
      
      // Check if user has enough coins
      const { data: profile } = await supabase
        .from('profiles')
        .select('eco_coins')
        .eq('user_id', user.id)
        .single();
      
      if (!profile || profile.eco_coins < coinsSpent) {
        throw new Error('Insufficient EcoCoins');
      }
      
      // Create redemption record
      const { data, error } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: user.id,
          reward_id: rewardId,
          coins_spent: coinsSpent,
          redeemed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Deduct coins from user profile
      await supabase
        .from('profiles')
        .update({
          eco_coins: profile.eco_coins - coinsSpent,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Reward Redeemed',
        description: 'Your reward has been successfully redeemed!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Redemption Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

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
  });
};

export const useUploadAvatar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('No user ID');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update profile with avatar URL
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated successfully!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
