import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Send, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message { id: string; role: 'user' | 'assistant'; content: string; citations?: { title: string; url: string }[] }
interface Thread { id: string; createdAt: string; messages: Message[] }

const STORAGE_KEY = 'eco_assistant_threads_v1';

const KB: { title: string; url: string; content: string; keywords: string[] }[] = [
  {
    title: 'Safe Battery Disposal',
    url: 'https://www.epa.gov/recycle/used-lithium-ion-batteries',
    content: 'Lithium batteries must not enter general waste. Tape terminals, avoid puncture, use certified collection points.',
    keywords: ['battery', 'lithium', 'dispose', 'safety', 'collection']
  },
  {
    title: 'Wipe Data Before Recycling',
    url: 'https://support.google.com/android/answer/6088915',
    content: 'Always wipe personal data before handing over devices. Use factory reset and remove SIM/SD cards.',
    keywords: ['data', 'wipe', 'reset', 'privacy', 'phone']
  },
  {
    title: 'E-Waste Categories and Hazards',
    url: 'https://www.unep.org/resources/report/global-ewaste-monitor',
    content: 'E-waste contains hazardous materials like lead, mercury, cadmium. Proper handling prevents environmental harm.',
    keywords: ['hazard', 'lead', 'mercury', 'cadmium', 'ewaste']
  },
];

function loadThreads(): Thread[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as Thread[] : []; } catch { return []; }
}
function saveThreads(threads: Thread[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(threads)); }

function findAnswer(question: string) {
  const q = question.toLowerCase();
  const scores = KB.map(k => ({ k, score: k.keywords.reduce((s, kw) => s + (q.includes(kw) ? 1 : 0), 0) }));
  const best = scores.sort((a, b) => b.score - a.score)[0];
  const useKb = best && best.score > 0 ? best.k : null;
  const answer = useKb
    ? `${useKb.content} Always follow local regulations and certified centers.`
    : 'I recommend using certified e-waste centers, wiping personal data, and handling batteries carefully. Ask me about a specific item for precise guidance.';
  const citations = useKb ? [{ title: useKb.title, url: useKb.url }] : KB.slice(0, 2).map(k => ({ title: k.title, url: k.url }));
  return { answer, citations };
}

function violatesGuardrails(text: string) {
  const lower = text.toLowerCase();
  if (/(password|credit card|otp|ssn)/.test(lower)) return 'For your safety, do not share passwords, OTPs, or sensitive personal data.';
  if (/medical|legal advice/.test(lower)) return 'I cannot provide medical or legal advice. Consider consulting a professional.';
  return '';
}

// Initialize Gemini AI with API key from environment
const getGeminiAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBqKGXwLqJhLqvvYQxGxQxGxQxGxQxGxQx';
  return new GoogleGenerativeAI(apiKey);
};

const Assistant = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>(() => loadThreads());
  const [activeId, setActiveId] = useState<string>(() => loadThreads()[0]?.id ?? '');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { saveThreads(threads); }, [threads]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); });

  useEffect(() => {
    if (!activeId && threads.length > 0) setActiveId(threads[0].id);
  }, [threads, activeId]);

  if (loading) return null;
  if (!user) return null;

  const active = useMemo(() => threads.find(t => t.id === activeId) ?? null, [threads, activeId]);

  const startThread = () => {
    const t: Thread = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), messages: [] };
    setThreads(prev => [t, ...prev]);
    setActiveId(t.id);
  };

  const clearThread = () => {
    if (!active) return;
    setThreads(prev => prev.map(t => t.id === active.id ? { ...t, messages: [] } : t));
  };

  const removeThread = (id: string) => {
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeId === id) setActiveId('');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    
    const violation = violatesGuardrails(text);
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    
    if (!active) startThread();

    setThreads(prev => {
      const id = active?.id ?? crypto.randomUUID();
      const t = active ?? { id, createdAt: new Date().toISOString(), messages: [] };
      const updated = { ...t, messages: [...t.messages, userMsg] } as Thread;
      const others = prev.filter(x => x.id !== t.id);
      return [updated, ...others];
    });

    setInput('');

    if (violation) {
      const guardMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: violation };
      setThreads(prev => prev.map(t => t.id === (active?.id ?? prev[0].id) ? { ...t, messages: [...t.messages, guardMsg] } : t));
      toast({ title: 'Guardrails applied', description: 'Sensitive data blocked for safety.' });
      return;
    }

    setIsTyping(true);

    try {
      // Use Gemini AI for intelligent responses
      const genAI = getGeminiAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const systemPrompt = `You are EcoAssistant, an AI expert in e-waste recycling and environmental sustainability. 
      Help users with:
      - Safe disposal of electronic waste (batteries, phones, laptops, etc.)
      - Data privacy before recycling devices
      - Environmental impact of e-waste
      - Recycling best practices
      - EcoCoins rewards system
      
      Keep responses concise, helpful, and focused on e-waste management. Always prioritize safety and environmental responsibility.`;
      
      const prompt = `${systemPrompt}\n\nUser question: ${text}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();
      
      // Find relevant citations from knowledge base
      const { citations } = findAnswer(text);
      
      const bot: Message = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        content: answer,
        citations 
      };
      
      setThreads(prev => prev.map(t => t.id === (active?.id ?? prev[0].id) ? { ...t, messages: [...t.messages, bot] } : t));
      
    } catch (error) {
      console.error('AI Error:', error);
      
      // Fallback to knowledge base if API fails
      const { answer, citations } = findAnswer(text);
      const bot: Message = { 
        id: crypto.randomUUID(), 
        role: 'assistant', 
        content: `${answer}\n\n(Note: AI service temporarily unavailable, using knowledge base)`,
        citations 
      };
      
      setThreads(prev => prev.map(t => t.id === (active?.id ?? prev[0].id) ? { ...t, messages: [...t.messages, bot] } : t));
      
      toast({ 
        title: 'Using fallback mode', 
        description: 'AI service unavailable, using local knowledge base.',
        variant: 'default'
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Bot className="w-6 h-6"/> EcoAssistant</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startThread}>New Chat</Button>
          <Button variant="destructive" onClick={() => active && removeThread(active.id)}><Trash2 className="w-4 h-4 mr-1"/>Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-3 lg:col-span-1 space-y-2">
          <div className="text-xs text-muted-foreground mb-2">Your Chats</div>
          {threads.length === 0 && <div className="text-sm text-muted-foreground">No chats yet</div>}
          {threads.map(t => (
            <Button key={t.id} variant={t.id === activeId ? 'secondary' : 'outline'} className="w-full justify-start" onClick={() => setActiveId(t.id)}>
              {new Date(t.createdAt).toLocaleString()}
            </Button>
          ))}
        </Card>

        <Card className="p-0 lg:col-span-3 flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!active || active.messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground p-6">
                Ask about safe disposal, data wiping, battery handling, or recycling options.
              </div>
            ) : (
              active.messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 border ${m.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
                    <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.citations.map((c, i) => (
                          <a key={i} href={c.url} target="_blank" rel="noreferrer" className="text-xs underline flex items-center gap-1">
                            <Badge variant="outline">Source</Badge> {c.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t flex items-center gap-2">
            <Input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder="Ask a recycling question..." 
              onKeyDown={(e) => { if (e.key === 'Enter' && !isTyping) send(); }}
              disabled={isTyping}
            />
            <Button onClick={send} disabled={isTyping} className="gap-1">
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
              {isTyping ? 'Thinking...' : 'Send'}
            </Button>
            <Button variant="outline" onClick={clearThread} className="gap-1"><ShieldAlert className="w-4 h-4"/>Clear</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Assistant;
