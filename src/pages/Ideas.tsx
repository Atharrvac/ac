import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Plus, Save, Trash2, Share2, Copy, Filter } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  prompt: string;
  output: string;
  tags: string[];
  createdAt: string;
}

const PRESET_PROMPTS: { title: string; prompt: string; tags: string[] }[] = [
  {
    title: 'Upcycle Laptop → Smart Kiosk',
    prompt: 'Convert an old laptop into a community smart kiosk for e-waste education and reporting.',
    tags: ['laptops', 'education', 'community']
  },
  {
    title: 'Phone → Wildlife Sensor',
    prompt: 'Repurpose smartphones as solar-powered wildlife monitoring sensors with offline sync.',
    tags: ['phones', 'sustainability', 'iot']
  },
  {
    title: 'Cables → Art Installations',
    prompt: 'Use mixed cables to create safe community art with embedded QR codes to recycling tips.',
    tags: ['cables', 'art', 'awareness']
  },
];

const STORAGE_KEY = 'eco_ideas_v1';

function loadIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Idea[]) : [];
  } catch {
    return [];
  }
}

function saveIdeas(items: Idea[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateFromPrompt(prompt: string, custom: string) {
  const base = prompt.trim();
  const extra = custom.trim();
  const sections = [
    `Concept: ${base}${extra ? ' — ' + extra : ''}`,
    'Materials: list recovered components and safe handling steps.',
    'Build Steps: numbered, practical, safe and low-cost steps.',
    'Impact: CO₂ reduction, landfill avoidance, community benefit.',
    'Monetization: donation, subscription, sponsorship, credits.',
    'Risks: electrical safety, data privacy, hazardous parts mitigation.'
  ];
  return sections.map((s, i) => `${i + 1}. ${s}`).join('\n\n');
}

const Ideas = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>(() => loadIdeas());
  const [filter, setFilter] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [output, setOutput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { saveIdeas(ideas); }, [ideas]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    PRESET_PROMPTS.forEach(p => p.tags.forEach(t => set.add(t)));
    ideas.forEach(i => i.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [ideas]);

  if (loading) return null;
  if (!user) return null;

  const handleUsePreset = (p: typeof PRESET_PROMPTS[number]) => {
    setTitle(p.title);
    setCustomPrompt('');
    const out = generateFromPrompt(p.prompt, '');
    setOutput(out);
    setSelectedTags(p.tags);
  };

  const handleGenerate = () => {
    if (!title.trim()) {
      return toast({ title: 'Title required', description: 'Give your idea a short title.', variant: 'destructive' });
    }
    const base = PRESET_PROMPTS.find(pr => pr.title === title);
    const prompt = base?.prompt ?? title;
    const out = generateFromPrompt(prompt, customPrompt);
    setOutput(out);
    toast({ title: 'Idea generated', description: 'Refine and save if you like it.' });
  };

  const handleSave = () => {
    if (!title.trim() || !output.trim()) {
      return toast({ title: 'Missing fields', description: 'Title and content are required.', variant: 'destructive' });
    }
    const item: Idea = {
      id: crypto.randomUUID(),
      title: title.trim(),
      prompt: customPrompt.trim(),
      output: output.trim(),
      tags: selectedTags,
      createdAt: new Date().toISOString(),
    };
    setIdeas([item, ...ideas]);
    toast({ title: 'Saved', description: 'Idea added to your library.' });
  };

  const handleDelete = (id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id));
    toast({ title: 'Deleted', description: 'Idea removed.' });
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Idea copied to clipboard.' });
  };

  const handleShare = async (idea: Idea) => {
    const text = `${idea.title}\n\n${idea.output}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: idea.title, text });
        toast({ title: 'Shared', description: 'Idea shared via system sheet.' });
      } catch {}
    } else {
      await handleCopy(text);
    }
  };

  const filtered = ideas.filter(i =>
    (!filter || i.title.toLowerCase().includes(filter.toLowerCase())) &&
    (selectedTags.length === 0 || selectedTags.every(t => i.tags.includes(t)))
  );

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6"/> Waste-to-Product Ideas</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground"/>
          <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search ideas..."/>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-1 space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Presets</h2>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_PROMPTS.map(p => (
                <Button key={p.title} variant="outline" className="justify-start" onClick={() => handleUsePreset(p)}>
                  <Sparkles className="w-4 h-4 mr-2"/> {p.title}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map(t => (
                <Badge key={t} variant={selectedTags.includes(t) ? 'default' : 'outline'} onClick={() => setSelectedTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])} className="cursor-pointer">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Idea title" />
            <Textarea ref={textRef} value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Add specifics (materials, audience, constraints)..." rows={4} />
            <div className="flex gap-2">
              <Button onClick={handleGenerate} variant="eco" className="gap-2"><Sparkles className="w-4 h-4"/>Generate</Button>
              <Button onClick={handleSave} className="gap-2"><Save className="w-4 h-4"/>Save</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Output</h3>
            <Textarea value={output} onChange={e => setOutput(e.target.value)} rows={12} />
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Saved Ideas</h2>
        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No ideas yet. Generate and save to see them here.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(i => (
              <Card key={i.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{i.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleCopy(`${i.title}\n\n${i.output}`)}><Copy className="w-4 h-4"/>Copy</Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleShare(i)}><Share2 className="w-4 h-4"/>Share</Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleDelete(i.id)}><Trash2 className="w-4 h-4"/>Delete</Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {i.tags.map(t => (<Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>))}
                </div>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded border overflow-auto max-h-64">{i.output}</pre>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ideas;
