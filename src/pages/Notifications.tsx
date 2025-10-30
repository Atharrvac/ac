import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Trash2, Check } from 'lucide-react';

interface Notice { id: string; title: string; description: string; read: boolean; createdAt: string }
const KEY = 'eco_notifications_v1';

function load(): Notice[] { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Notice[] : []; } catch { return []; } }
function save(v: Notice[]) { localStorage.setItem(KEY, JSON.stringify(v)); }

const Notifications = () => {
  const [items, setItems] = useState<Notice[]>(() => load());
  useEffect(() => { save(items); }, [items]);

  const addSample = () => {
    const n: Notice = { id: crypto.randomUUID(), title: 'Pickup Scheduled', description: 'Your collector will arrive tomorrow at 10:00 AM', read: false, createdAt: new Date().toISOString() };
    setItems(prev => [n, ...prev]);
  };
  const markRead = (id: string) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const remove = (id: string) => setItems(prev => prev.filter(n => n.id !== id));
  const clearAll = () => setItems([]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Bell className="w-6 h-6"/> Notifications</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addSample}>Add Sample</Button>
          <Button variant="destructive" onClick={clearAll}>Clear All</Button>
        </div>
      </div>
      <Card className="p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No notifications yet.</div>
        ) : items.map(n => (
          <div key={n.id} className={`flex items-start justify-between p-3 rounded border ${n.read ? 'opacity-70' : ''}`}>
            <div>
              <div className="font-semibold flex items-center gap-2">{n.title} {!n.read && <Badge variant="secondary">New</Badge>}</div>
              <div className="text-sm text-muted-foreground">{n.description}</div>
              <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              {!n.read && <Button size="sm" variant="outline" onClick={() => markRead(n.id)}><Check className="w-4 h-4"/></Button>}
              <Button size="sm" variant="destructive" onClick={() => remove(n.id)}><Trash2 className="w-4 h-4"/></Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default Notifications;
