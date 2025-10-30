export type Level = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

const LEVELS: { name: Level; minCoins: number }[] = [
  { name: 'Bronze', minCoins: 0 },
  { name: 'Silver', minCoins: 200 },
  { name: 'Gold', minCoins: 600 },
  { name: 'Platinum', minCoins: 1200 },
];

export function getLevelByCoins(coins: number) {
  const sorted = [...LEVELS].sort((a, b) => a.minCoins - b.minCoins);
  let current = sorted[0];
  for (const lvl of sorted) {
    if (coins >= lvl.minCoins) current = lvl;
  }
  const currentIndex = sorted.findIndex(l => l.name === current.name);
  const next = sorted[Math.min(currentIndex + 1, sorted.length - 1)];
  const denom = Math.max(1, next.minCoins - current.minCoins);
  const progress = Math.max(0, Math.min(1, (coins - current.minCoins) / denom));
  return {
    level: current.name as Level,
    nextLevel: next.name as Level,
    nextAt: next.minCoins,
    progress,
  };
}
