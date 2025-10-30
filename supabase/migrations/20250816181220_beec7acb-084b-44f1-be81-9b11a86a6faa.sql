-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  eco_coins INTEGER NOT NULL DEFAULT 0,
  total_items_recycled INTEGER NOT NULL DEFAULT 0,
  total_co2_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create waste_detections table for AI detection results
CREATE TABLE public.waste_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  detected_item TEXT NOT NULL,
  category TEXT NOT NULL,
  hazard_level TEXT NOT NULL,
  eco_coins_earned INTEGER NOT NULL DEFAULT 0,
  disposal_method TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collectors table
CREATE TABLE public.collectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialties TEXT[] NOT NULL,
  rating DECIMAL(3,2) DEFAULT 4.5,
  available BOOLEAN DEFAULT true,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table for pickup scheduling
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.collectors(id),
  pickup_address TEXT NOT NULL,
  pickup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items_description TEXT,
  estimated_weight DECIMAL(8,2),
  eco_coins_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rewards table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coins_required INTEGER NOT NULL,
  discount_value TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id),
  coins_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for waste_detections
CREATE POLICY "Users can view their own detections" ON public.waste_detections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own detections" ON public.waste_detections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for collectors (public read)
CREATE POLICY "Anyone can view collectors" ON public.collectors
  FOR SELECT USING (true);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for rewards (public read)
CREATE POLICY "Anyone can view rewards" ON public.rewards
  FOR SELECT USING (true);

-- Create RLS policies for reward_redemptions
CREATE POLICY "Users can view their own redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own redemptions" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.collectors (name, email, phone, specialties, rating, address, city, latitude, longitude) VALUES
  ('GreenTech Recyclers', 'contact@greentech.com', '+91 98765 43210', '{"Electronics", "Batteries", "Metals"}', 4.8, 'MG Road, Bangalore', 'Bangalore', 12.9716, 77.5946),
  ('EcoWaste Solutions', 'info@ecowaste.com', '+91 98765 43211', '{"Smartphones", "Laptops", "Cables"}', 4.6, 'Whitefield, Bangalore', 'Bangalore', 12.9698, 77.7500),
  ('Planet First Collectors', 'hello@planetfirst.com', '+91 98765 43212', '{"All E-Waste", "Hazardous Materials"}', 4.9, 'Koramangala, Bangalore', 'Bangalore', 12.9352, 77.6245);

INSERT INTO public.rewards (name, description, coins_required, discount_value, category, icon) VALUES
  ('Starbucks Coffee', 'Free coffee voucher', 100, 'Free', 'food', '☕'),
  ('Amazon Voucher', '₹200 shopping voucher', 500, '₹200', 'shopping', '🛒'),
  ('Mobile Recharge', '₹100 mobile recharge', 250, '₹100', 'utilities', '📱'),
  ('Movie Ticket', 'Free movie ticket', 300, 'Free', 'entertainment', '🎬'),
  ('Uber Ride', '₹150 ride credit', 200, '₹150', 'transport', '🚗'),
  ('Pizza Hut', '50% off on pizza', 400, '50% Off', 'food', '🍕');