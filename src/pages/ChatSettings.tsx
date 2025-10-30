import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bot, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ChatSettings {
  showAvatar: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  chatPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ChatSettings = () => {
  const [settings, setSettings] = useState<ChatSettings>({
    showAvatar: true,
    enableNotifications: true,
    theme: 'system',
    chatPosition: 'bottom-right'
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse chat settings', e);
      }
    }
  }, []);

  const handleSave = async () => {
    try {
      await localStorage.setItem('chatSettings', JSON.stringify(settings));
      // Dispatch event to notify other components about settings change
      window.dispatchEvent(new Event('chatSettingsChanged'));
      
      toast({
        title: 'Settings saved',
        description: 'Your chat settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6" />
          Chat Settings
        </h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Appearance</h2>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-avatar">Show Avatar</Label>
              <p className="text-sm text-muted-foreground">
                Display the bot avatar in chat messages
              </p>
            </div>
            <Switch
              id="show-avatar"
              checked={settings.showAvatar}
              onCheckedChange={(checked) => setSettings({...settings, showAvatar: checked})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <select
              id="theme"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={settings.theme}
              onChange={(e) => setSettings({...settings, theme: e.target.value as any})}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Chat Position</Label>
            <select
              id="position"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={settings.chatPosition}
              onChange={(e) => setSettings({...settings, chatPosition: e.target.value as any})}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new messages
              </p>
            </div>
            <Switch
              id="enable-notifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button 
            className="w-full sm:w-auto" 
            onClick={handleSave}
            disabled={!settings.apiKey}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;
