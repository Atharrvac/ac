import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Types
export type Message = {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  created_at: string;
  is_system: boolean;
};

export type UserStatus = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
};

// Message functions
export const sendMessage = async (message: Omit<Message, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([message])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMessages = async (limit = 50) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.reverse(); // Return oldest first
};

// User status functions
export const updateUserStatus = async (status: UserStatus['status']) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_status')
    .upsert(
      {
        id: user.id,
        status,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) console.error('Error updating user status:', error);
};

export const getOnlineUsers = async () => {
  const { data, error } = await supabase
    .from('user_status')
    .select('*')
    .eq('status', 'online');

  if (error) {
    console.error('Error fetching online users:', error);
    return [];
  }
  return data;
};

// Subscribe to realtime updates
export const subscribeToMessages = (callback: (message: Message) => void) => {
  const subscription = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export const subscribeToUserStatus = (callback: (status: UserStatus) => void) => {
  const subscription = supabase
    .channel('user_status')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_status' },
      (payload) => {
        callback(payload.new as UserStatus);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
