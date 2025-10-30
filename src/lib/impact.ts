export type WasteCategory =
  | 'Smartphones'
  | 'Laptops'
  | 'Tablets'
  | 'Batteries'
  | 'Cables'
  | 'Chargers'
  | 'Gaming'
  | 'Audio'
  | 'Computer Parts'
  | 'Storage'
  | string;

// Typical weights (kg) by category
const TYPICAL_WEIGHTS_KG: Record<string, { min: number; max: number; avg: number }> = {
  Smartphones: { min: 0.12, max: 0.25, avg: 0.18 },
  Laptops: { min: 1.0, max: 2.5, avg: 1.8 },
  Tablets: { min: 0.3, max: 0.8, avg: 0.5 },
  Batteries: { min: 0.05, max: 0.8, avg: 0.3 },
  Cables: { min: 0.05, max: 0.3, avg: 0.12 },
  Chargers: { min: 0.08, max: 0.4, avg: 0.2 },
  Gaming: { min: 0.2, max: 0.5, avg: 0.35 },
  Audio: { min: 0.15, max: 0.4, avg: 0.25 },
  'Computer Parts': { min: 0.2, max: 1.2, avg: 0.7 },
  Storage: { min: 0.15, max: 0.7, avg: 0.35 },
};

// CO2 savings factors (kg CO2 saved per kg item) by category
const CO2_SAVED_FACTOR: Record<string, number> = {
  Smartphones: 6.5,
  Laptops: 10,
  Tablets: 7,
  Batteries: 3,
  Cables: 2,
  Chargers: 3,
  Gaming: 4,
  Audio: 3.5,
  'Computer Parts': 5,
  Storage: 5.5,
};

// EcoCoins per kg baseline by category (balanced for game economy)
const ECO_COINS_PER_KG: Record<string, number> = {
  Smartphones: 200,
  Laptops: 120,
  Tablets: 150,
  Batteries: 100,
  Cables: 60,
  Chargers: 80,
  Gaming: 110,
  Audio: 90,
  'Computer Parts': 140,
  Storage: 160,
};

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function estimateWeightKg(category: WasteCategory, itemName?: string): { weightKg: number; confidence: number } {
  const base = TYPICAL_WEIGHTS_KG[category] || { min: 0.2, max: 1.0, avg: 0.5 };
  // slight deterministic variance by item name if provided
  let variance = 0;
  if (itemName) {
    let h = 0;
    for (let i = 0; i < itemName.length; i++) h = (h * 31 + itemName.charCodeAt(i)) | 0;
    variance = ((h >>> 0) % 100) / 1000 - 0.05; // [-0.05, 0.05]
  }
  const est = clamp(base.avg + variance * (base.max - base.min), base.min, base.max);
  // confidence higher when range is tight
  const spread = base.max - base.min;
  const confidence = clamp(100 - spread * 100, 70, 95);
  return { weightKg: Number(est.toFixed(2)), confidence };
}

export function computeCO2SavedKg(category: WasteCategory, weightKg: number): number {
  const factor = CO2_SAVED_FACTOR[category] ?? 4;
  return Number((factor * weightKg).toFixed(2));
}

export function predictEcoCoins(category: WasteCategory, weightKg: number, hazardLevel?: string): number {
  const baseRate = ECO_COINS_PER_KG[category] ?? 100;
  const hazardBoost = hazardLevel === 'high' ? 1.2 : hazardLevel === 'medium' ? 1.05 : 1;
  const raw = baseRate * weightKg * hazardBoost;
  // clamp to sensible bounds
  return Math.round(clamp(raw, 8, 300));
}

export type SortingSuggestion = {
  steps: string[];
  safety: string[];
  donateOrResell?: string[];
};

export function getSortingSuggestions(category: WasteCategory): SortingSuggestion {
  switch (category) {
    case 'Smartphones':
      return {
        steps: [
          'Backup and factory reset the device',
          'Remove SIM and memory cards',
          'Detach any cases or accessories',
          'Place in a padded envelope or box',
        ],
        safety: [
          'Do not puncture or bend the device',
          'Keep away from heat due to lithium battery',
        ],
        donateOrResell: ['Consider trade-in or donation if functional'],
      };
    case 'Laptops':
      return {
        steps: [
          'Securely wipe or remove storage drive',
          'Bundle charger separately',
          'Close lid and protect screen',
        ],
        safety: ['Avoid crushing battery areas', 'Handle damaged batteries with care'],
        donateOrResell: ['Remove personal stickers and data before donation/resale'],
      };
    case 'Batteries':
      return {
        steps: ['Tape terminals individually', 'Place in clear bag', 'Drop only at battery points'],
        safety: ['Never dispose in general trash', 'Do not charge swollen/damaged cells'],
      };
    default:
      return {
        steps: ['Group similar items together', 'Remove cables and accessories', 'Clean surface dust'],
        safety: ['Avoid moisture exposure', 'Use a sturdy box for sharp edges'],
      };
  }
}

export function treesEquivalent(co2Kg: number): number {
  // 1 mature tree ~21.77 kg CO2/year (approx). Use fraction for visibility.
  return Number((co2Kg / 21.77).toFixed(2));
}

export function energyEquivalentKWh(weightKg: number): number {
  // very rough: 50 kWh per 1 kg electronics recycled (placeholder model)
  return Number((weightKg * 50).toFixed(1));
}

export function waterSavedLiters(weightKg: number): number {
  // rough: 1000 L per item kg saved across lifecycle
  return Math.round(weightKg * 1000);
}
