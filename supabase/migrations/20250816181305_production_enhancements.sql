-- Production-Ready Database Enhancements
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_eco_coins ON public.profiles(eco_coins DESC);
CREATE INDEX IF NOT EXISTS idx_waste_detections_user_id ON public.waste_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_detections_detected_at ON public.waste_detections(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_date ON public.bookings(pickup_date);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_collectors_available ON public.collectors(available) WHERE available = true;

-- Add constraints for data integrity
ALTER TABLE public.profiles ADD CONSTRAINT check_eco_coins_positive CHECK (eco_coins >= 0);
ALTER TABLE public.profiles ADD CONSTRAINT check_total_items_positive CHECK (total_items_recycled >= 0);
ALTER TABLE public.profiles ADD CONSTRAINT check_co2_positive CHECK (total_co2_saved >= 0);
ALTER TABLE public.bookings ADD CONSTRAINT check_eco_coins_earned_positive CHECK (eco_coins_earned >= 0);
ALTER TABLE public.waste_detections ADD CONSTRAINT check_eco_coins_earned_positive CHECK (eco_coins_earned >= 0);
ALTER TABLE public.rewards ADD CONSTRAINT check_coins_required_positive CHECK (coins_required > 0);

-- Add status enum for bookings
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add hazard level enum
DO $$ BEGIN
  CREATE TYPE hazard_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Audit log table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action, window_start);

-- Atomic waste detection creation with profile update
CREATE OR REPLACE FUNCTION public.create_waste_detection_atomic(
  p_user_id UUID,
  p_detected_item TEXT,
  p_category TEXT,
  p_hazard_level TEXT,
  p_disposal_method TEXT,
  p_image_url TEXT,
  p_eco_coins_earned INTEGER,
  p_weight_kg NUMERIC,
  p_co2_saved_kg NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_detection_id UUID;
BEGIN
  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insert waste detection
  INSERT INTO public.waste_detections (
    user_id, detected_item, category, hazard_level, 
    disposal_method, image_url, eco_coins_earned
  ) VALUES (
    p_user_id, p_detected_item, p_category, p_hazard_level,
    p_disposal_method, p_image_url, p_eco_coins_earned
  ) RETURNING id INTO v_detection_id;

  -- Update profile atomically
  UPDATE public.profiles
  SET 
    eco_coins = eco_coins + p_eco_coins_earned,
    total_items_recycled = total_items_recycled + 1,
    total_co2_saved = total_co2_saved + p_co2_saved_kg,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log audit trail
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
  VALUES (
    p_user_id, 
    'CREATE_WASTE_DETECTION', 
    'waste_detections', 
    v_detection_id,
    jsonb_build_object(
      'eco_coins_earned', p_eco_coins_earned,
      'category', p_category,
      'co2_saved_kg', p_co2_saved_kg
    )
  );

  RETURN v_detection_id;
END;
$$;

-- Atomic reward redemption with balance check
CREATE OR REPLACE FUNCTION public.redeem_reward_atomic(
  p_user_id UUID,
  p_reward_id UUID,
  p_coins_spent INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_redemption_id UUID;
  v_current_coins INTEGER;
  v_reward_active BOOLEAN;
BEGIN
  -- Check if reward is active
  SELECT active INTO v_reward_active
  FROM public.rewards
  WHERE id = p_reward_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  IF NOT v_reward_active THEN
    RAISE EXCEPTION 'Reward is not active';
  END IF;

  -- Get current coin balance with row lock
  SELECT eco_coins INTO v_current_coins
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Check sufficient balance
  IF v_current_coins < p_coins_spent THEN
    RAISE EXCEPTION 'Insufficient EcoCoins. Required: %, Available: %', p_coins_spent, v_current_coins;
  END IF;

  -- Create redemption record
  INSERT INTO public.reward_redemptions (user_id, reward_id, coins_spent)
  VALUES (p_user_id, p_reward_id, p_coins_spent)
  RETURNING id INTO v_redemption_id;

  -- Deduct coins
  UPDATE public.profiles
  SET 
    eco_coins = eco_coins - p_coins_spent,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log audit trail
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
  VALUES (
    p_user_id,
    'REDEEM_REWARD',
    'reward_redemptions',
    v_redemption_id,
    jsonb_build_object(
      'reward_id', p_reward_id,
      'coins_spent', p_coins_spent,
      'balance_after', v_current_coins - p_coins_spent
    )
  );

  RETURN v_redemption_id;
END;
$$;

-- Rate limiting check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := date_trunc('minute', now()) - (p_window_minutes || ' minutes')::INTERVAL;

  -- Clean up old rate limit records
  DELETE FROM public.rate_limits
  WHERE window_start < v_window_start;

  -- Get current count
  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND action = p_action
    AND window_start >= v_window_start;

  -- Check if limit exceeded
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  INSERT INTO public.rate_limits (user_id, action, count, window_start)
  VALUES (p_user_id, p_action, 1, date_trunc('minute', now()))
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1;

  RETURN TRUE;
END;
$$;

-- Get leaderboard with pagination
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  eco_coins INTEGER,
  total_items_recycled INTEGER,
  total_co2_saved NUMERIC,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.eco_coins,
    p.total_items_recycled,
    p.total_co2_saved,
    ROW_NUMBER() OVER (ORDER BY p.eco_coins DESC, p.total_items_recycled DESC) as rank
  FROM public.profiles p
  ORDER BY p.eco_coins DESC, p.total_items_recycled DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get user statistics
CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_detections', COUNT(wd.id),
    'total_bookings', (SELECT COUNT(*) FROM public.bookings WHERE user_id = p_user_id),
    'total_redemptions', (SELECT COUNT(*) FROM public.reward_redemptions WHERE user_id = p_user_id),
    'categories_detected', json_agg(DISTINCT wd.category),
    'most_detected_category', (
      SELECT category 
      FROM public.waste_detections 
      WHERE user_id = p_user_id 
      GROUP BY category 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    ),
    'avg_coins_per_detection', COALESCE(AVG(wd.eco_coins_earned), 0),
    'last_detection_date', MAX(wd.detected_at)
  ) INTO v_stats
  FROM public.waste_detections wd
  WHERE wd.user_id = p_user_id;

  RETURN v_stats;
END;
$$;

-- Soft delete for bookings (audit trail)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at ON public.bookings(deleted_at) WHERE deleted_at IS NULL;

-- Update RLS policies to exclude soft-deleted records
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Function to soft delete booking
CREATE OR REPLACE FUNCTION public.soft_delete_booking(p_booking_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.bookings
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_booking_id AND user_id = p_user_id AND deleted_at IS NULL;

  IF FOUND THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
    VALUES (p_user_id, 'SOFT_DELETE_BOOKING', 'bookings', p_booking_id);
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_waste_detection_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_reward_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_booking TO authenticated;
