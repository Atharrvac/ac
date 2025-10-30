import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Paperclip, Send, Trash2, Image as ImageIcon } from 'lucide-react';

interface Msg { id: string; from: 'user' | 'collector'; text: string; ts: string; image?: string }
interface Thread { id: string; collector: string; createdAt: string; messages: Msg[] }
const KEY = 'eco_inapp_chat_v1';

function load(): Thread[] { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Thread[] : []; } catch { return []; } }
function save(v: Thread[]) { localStorage.setItem(KEY, JSON.stringify(v)); }

const Chat = () => {
  const { user, loading } = useAuth();
  const [threads, setThreads] = useState<Thread[]>(() => load());
  const [activeId, setActiveId] = useState<string>(() => load()[0]?.id ?? '');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { save(threads); }, [threads]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); });
  useEffect(() => { if (!activeId && threads.length > 0) setActiveId(threads[0].id); }, [threads, activeId]);

  if (loading) return null;
  if (!user) return null;

  const active = useMemo(() => threads.find(t => t.id === activeId) ?? null, [threads, activeId]);

  const start = () => {
    const t: Thread = { id: crypto.randomUUID(), collector: 'Assigned Collector', createdAt: new Date().toISOString(), messages: [] };
    setThreads(prev => [t, ...prev]);
    setActiveId(t.id);
  };
  const remove = (id: string) => { setThreads(prev => prev.filter(t => t.id !== id)); if (activeId === id) setActiveId(''); };

  const send = () => {
    if (!active) return;
    const msg: Msg = { id: crypto.randomUUID(), from: 'user', text: text.trim(), ts: new Date().toISOString() };
    if (!msg.text && !file) return;
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = reader.result as string;
        const withImg = { ...msg, image: img } as Msg;
        setThreads(prev => prev.map(t => t.id === active.id ? { ...t, messages: [...t.messages, withImg] } : t));
      };
      reader.readAsDataURL(file);
      setFile(null);
    } else {
      setThreads(prev => prev.map(t => t.id === active.id ? { ...t, messages: [...t.messages, msg] } : t));
    }
    setText('');
    // Simulate collector reply
    setTimeout(() => {
      const reply: Msg = { id: crypto.randomUUID(), from: 'collector', text: 'Acknowledged. On the way!', ts: new Date().toISOString() };
      setThreads(prev => prev.map(t => t.id === (active?.id ?? '') ? { ...t, messages: [...t.messages, reply] } : t));
    }, 1200);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">In-App Chat</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={start}>New Thread</Button>
          {active && <Button variant="destructive" onClick={() => remove(active.id)}><Trash2 className="w-4 h-4"/></Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-3 lg:col-span-1 space-y-2">
          {threads.length === 0 ? (
            <div className="text-sm text-muted-foreground">No threads yet</div>
          ) : threads.map(t => (
            <Button key={t.id} variant={t.id === activeId ? 'secondary' : 'outline'} className="w-full justify-start" onClick={() => setActiveId(t.id)}>
              {t.collector} • {new Date(t.createdAt).toLocaleDateString()}
            </Button>
          ))}
        </Card>

        <Card className="p-0 lg:col-span-3 flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!active || active.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Start chatting with your collector.</div>
            ) : active.messages.map(m => (
              <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 border ${m.from === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  {m.image && <img src={m.image} alt="attachment" className="mt-2 rounded max-h-48" />}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(m.ts).toLocaleString()}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t flex items-center gap-2">
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <Paperclip className="w-4 h-4"/>
              <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {file ? <span className="text-xs">{file.name}</span> : <span className="text-xs text-muted-foreground">Attach</span>}
            </label>
            <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." onKeyDown={e => { if (e.key === 'Enter') send(); }} />
            <Button onClick={send}><Send className="w-4 h-4"/></Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
