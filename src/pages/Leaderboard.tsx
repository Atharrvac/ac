import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useDatabase';
import { getLevelByCoins } from '@/lib/gamification';
import { Trophy, Target, CalendarCheck, RefreshCw } from 'lucide-react';

interface Challenge { id: string; title: string; reward: number; done: boolean }
interface Quest { id: string; title: string; progress: number; goal: number; reward: number }

const CHALLENGE_KEY = 'eco_daily_challenges_v1';
const QUEST_KEY = 'eco_weekly_quests_v1';

function initDaily(): Challenge[] {
  try { const raw = localStorage.getItem(CHALLENGE_KEY); if (raw) return JSON.parse(raw) as Challenge[]; } catch {}
  return [
    { id: 'c1', title: 'Detect 1 item', reward: 10, done: false },
    { id: 'c2', title: 'Read 1 recycling tip', reward: 5, done: false },
    { id: 'c3', title: 'Visit Rewards', reward: 5, done: false },
  ];
}
function initWeekly(): Quest[] {
  try { const raw = localStorage.getItem(QUEST_KEY); if (raw) return JSON.parse(raw) as Quest[]; } catch {}
  return [
    { id: 'q1', title: 'Recycle Streak', progress: 0, goal: 5, reward: 50 },
    { id: 'q2', title: 'Community Helper', progress: 0, goal: 3, reward: 30 },
  ];
}

const Leaderboard = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const [challenges, setChallenges] = useState<Challenge[]>(() => initDaily());
  const [quests, setQuests] = useState<Quest[]>(() => initWeekly());

  useEffect(() => { localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenges)); }, [challenges]);
  useEffect(() => { localStorage.setItem(QUEST_KEY, JSON.stringify(quests)); }, [quests]);

  if (loading) return null;
  if (!user) return null;

  const level = getLevelByCoins(profile?.eco_coins || 0);

  const community = useMemo(() => {
    const base = [
      { name: 'Asha', items: 42 },
      { name: 'Ravi', items: 38 },
      { name: 'Meera', items: 33 },
      { name: 'Karan', items: 28 },
      { name: 'Zoya', items: 25 },
    ];
    const you = { name: 'You', items: profile?.total_items_recycled ?? 0 };
    return [you, ...base].sort((a, b) => b.items - a.items).slice(0, 10);
  }, [profile]);

  const completeChallenge = (id: string) => setChallenges(prev => prev.map(c => c.id === id ? { ...c, done: true } : c));
  const tickQuest = (id: string, delta = 1) => setQuests(prev => prev.map(q => q.id === id ? { ...q, progress: Math.min(q.goal, q.progress + delta) } : q));
  const resetDaily = () => setChallenges(initDaily());
  const resetWeekly = () => setQuests(initWeekly());

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Trophy className="w-6 h-6"/> Leaderboard</h1>
        <Badge variant="outline">Level {level.level} • {profile?.eco_coins ?? 0} EcoCoins</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold mb-2">Community Ranks</h2>
          <div className="space-y-2">
            {community.map((u, i) => (
              <div key={u.name} className={`flex items-center justify-between p-2 rounded border ${u.name === 'You' ? 'bg-primary/10' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-6 text-right">{i + 1}</div>
                  <div className="font-medium">{u.name}</div>
                </div>
                <div className="text-sm text-muted-foreground">{u.items} items</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Daily Challenges</h2><Button variant="ghost" size="sm" onClick={resetDaily}><RefreshCw className="w-4 h-4"/></Button></div>
            {challenges.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4"/> {c.title}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">+{c.reward}</Badge>
                  <Button size="sm" variant={c.done ? 'secondary' : 'eco'} onClick={() => completeChallenge(c.id)} disabled={c.done}>{c.done ? 'Done' : 'Complete'}</Button>
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Weekly Quests</h2><Button variant="ghost" size="sm" onClick={resetWeekly}><CalendarCheck className="w-4 h-4"/></Button></div>
            {quests.map(q => (
              <div key={q.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{q.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">{q.progress}/{q.goal}</div>
                  <Badge variant="secondary">+{q.reward}</Badge>
                  <Button size="sm" onClick={() => tickQuest(q.id)}>+1</Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
