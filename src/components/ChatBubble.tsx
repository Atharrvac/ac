import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Bot, Send, X } from "lucide-react";
import { Input } from "./ui/input";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
}

interface ChatSettings {
  apiKey: string;
  showAvatar: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  chatPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const defaultSettings: ChatSettings = {
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  showAvatar: true,
  enableNotifications: true,
  theme: 'system',
  chatPosition: 'bottom-right'
};

export const ChatBubble = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('chatSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (e) {
        console.error('Failed to load chat settings', e);
      }
    };

    loadSettings();

    // Listen for settings updates
    const handleSettingsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ChatSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };

    window.addEventListener('chatSettingsUpdated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('chatSettingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Add a typing indicator
      const typingIndicatorId = `typing-${Date.now()}`;
      setMessages(prev => [
        ...prev, 
        { 
          id: typingIndicatorId, 
          text: '...', 
          sender: 'bot', 
          timestamp: new Date() 
        }
      ]);

      // Generate response using OpenRouter
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href, // Optional, for your own tracking
          'X-Title': 'Eco Assistant' // Optional, for your own tracking
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: inputValue }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response from OpenRouter');
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

      // Remove typing indicator and add the actual response
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== typingIndicatorId),
        {
          id: Date.now().toString(),
          text: text,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);

      // Show notification if enabled
      if (settings.enableNotifications && document.hidden) {
        new Notification('New message', {
          body: text.length > 50 ? `${text.substring(0, 50)}...` : text,
          icon: '/favicon.ico',
        });
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          text: error instanceof Error ? error.message : 'Failed to get response. Please try again.',
          sender: 'system',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get position classes based on settings
  const getPositionClasses = () => {
    switch (settings.chatPosition) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      case 'bottom-right':
      default:
        return 'bottom-6 right-6';
    }
  };

  // Apply theme
  const themeClass = settings.theme === 'system' 
    ? '' 
    : settings.theme === 'dark' 
      ? 'dark' 
      : '';

  return (
    <div className={`fixed ${getPositionClasses()} z-50 flex flex-col items-end gap-4`}>
      {isOpen && (
        <div className={`w-80 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 ${themeClass}`}>
          <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {settings.showAvatar && <Bot className="w-5 h-5" />}
                <h3 className="font-semibold">Eco Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary/80 rounded-full p-1"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading || !settings.apiKey}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !settings.apiKey || !inputValue.trim()}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {!settings.apiKey && (
              <p className="text-xs text-red-500 mt-2">
                Please set up your Gemini API key in settings
              </p>
            )}
          </form>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </div>
  );
};
