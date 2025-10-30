import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Message, UserStatus, getMessages, sendMessage as sendMessageApi, subscribeToMessages, subscribeToUserStatus, updateUserStatus, getOnlineUsers } from '@/lib/supabase';

interface ChatContextType {
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  onlineUsers: UserStatus[];
  isConnected: boolean;
  error: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const initialMessages = await getMessages();
        setMessages(initialMessages);
        setIsConnected(true);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages. Please try again.');
      }
    };

    loadMessages();
  }, []);

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages((newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle user status
  useEffect(() => {
    if (!user) return;

    // Set user as online when component mounts
    updateUserStatus('online');

    // Update last seen when user navigates away
    const handleBeforeUnload = () => {
      updateUserStatus('offline');
    };

    // Set user as away when window loses focus
    const handleBlur = () => {
      updateUserStatus('away');
    };

    // Set user back to online when window regains focus
    const handleFocus = () => {
      updateUserStatus('online');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Load initial online users
    const loadOnlineUsers = async () => {
      try {
        const users = await getOnlineUsers();
        setOnlineUsers(users);
      } catch (err) {
        console.error('Error loading online users:', err);
      }
    };

    loadOnlineUsers();

    // Subscribe to user status changes
    const unsubscribeStatus = subscribeToUserStatus((status) => {
      setOnlineUsers((prev) => {
        const existingUserIndex = prev.findIndex((u) => u.id === status.id);
        if (existingUserIndex >= 0) {
          if (status.status === 'offline') {
            return prev.filter((u) => u.id !== status.id);
          }
          const updated = [...prev];
          updated[existingUserIndex] = status;
          return updated;
        } else if (status.status !== 'offline') {
          return [...prev, status];
        }
        return prev;
      });
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      updateUserStatus('offline');
      unsubscribeStatus();
    };
  }, [user]);

  const sendMessage = async (content: string) => {
    if (!user) {
      setError('You must be logged in to send messages');
      return;
    }

    try {
      await sendMessageApi({
        content,
        sender_id: user.id,
        sender_name: user.user_metadata?.full_name || 'Anonymous',
        sender_avatar: user.user_metadata?.avatar_url || null,
        is_system: false,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, onlineUsers, isConnected, error }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
