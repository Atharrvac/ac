import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useDatabase';
import { Gift, Plus, Save, Trash2, Edit2 } from 'lucide-react';

interface CatalogItem { id: string; name: string; description: string; coins: number; inventory: number; category: string; active: boolean }
interface Redemption { id: string; itemId: string; userId: string; coinsSpent: number; redeemedAt: string }

const CATALOG_KEY = 'eco_store_catalog_v1';
const REDEEM_KEY = 'eco_store_redemptions_v1';

function loadCatalog(): CatalogItem[] { try { const raw = localStorage.getItem(CATALOG_KEY); return raw ? JSON.parse(raw) as CatalogItem[] : []; } catch { return []; } }
function saveCatalog(items: CatalogItem[]) { localStorage.setItem(CATALOG_KEY, JSON.stringify(items)); }
function loadRedemptions(): Redemption[] { try { const raw = localStorage.getItem(REDEEM_KEY); return raw ? JSON.parse(raw) as Redemption[] : []; } catch { return []; } }
function saveRedemptions(items: Redemption[]) { localStorage.setItem(REDEEM_KEY, JSON.stringify(items)); }

const DEFAULTS: CatalogItem[] = [
  { id: 'd1', name: 'Eco Tote Bag', description: 'Reusable tote made from recycled plastic.', coins: 150, inventory: 10, category: 'Merch', active: true },
  { id: 'd2', name: 'Plant Sapling', description: 'Native species sapling for your home.', coins: 200, inventory: 15, category: 'Green', active: true },
  { id: 'd3', name: 'E-Waste Pickup Credit', description: 'Discount on your next pickup service.', coins: 100, inventory: 50, category: 'Service', active: true },
];

const Store = () => {
  const { user, loading } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const existing = loadCatalog();
    if (existing.length > 0) return existing;
    localStorage.setItem(CATALOG_KEY, JSON.stringify(DEFAULTS));
    return DEFAULTS;
  });
  const [redemptions, setRedemptions] = useState<Redemption[]>(() => loadRedemptions());

  const [editing, setEditing] = useState<CatalogItem | null>(null);

  useEffect(() => { saveCatalog(catalog); }, [catalog]);
  useEffect(() => { saveRedemptions(redemptions); }, [redemptions]);

  if (loading) return null;
  if (!user) return null;

  const canAfford = (coins: number) => (profile?.eco_coins ?? 0) >= coins;

  const startCreate = () => setEditing({ id: '', name: '', description: '', coins: 0, inventory: 0, category: 'Merch', active: true });

  const saveItem = () => {
    if (!editing) return;
    if (!editing.name.trim() || editing.coins <= 0) {
      toast({ title: 'Invalid item', description: 'Name and positive coins are required.', variant: 'destructive' });
      return;
    }
    if (editing.id) {
      setCatalog(prev => prev.map(i => i.id === editing.id ? { ...editing } : i));
    } else {
      const item = { ...editing, id: crypto.randomUUID() };
      setCatalog(prev => [item, ...prev]);
    }
    setEditing(null);
    toast({ title: 'Saved', description: 'Catalog updated.' });
  };

  const removeItem = (id: string) => {
    setCatalog(prev => prev.filter(i => i.id !== id));
    toast({ title: 'Deleted', description: 'Item removed.' });
  };

  const redeem = (item: CatalogItem) => {
    if (!canAfford(item.coins)) {
      toast({ title: 'Insufficient EcoCoins', description: 'Earn more by recycling to redeem this.', variant: 'destructive' });
      return;
    }
    if (item.inventory <= 0 || !item.active) {
      toast({ title: 'Unavailable', description: 'This item is out of stock or inactive.', variant: 'destructive' });
      return;
    }
    const rec: Redemption = { id: crypto.randomUUID(), itemId: item.id, userId: user.id, coinsSpent: item.coins, redeemedAt: new Date().toISOString() };
    setRedemptions(prev => [rec, ...prev]);
    setCatalog(prev => prev.map(i => i.id === item.id ? { ...i, inventory: i.inventory - 1 } : i));
    toast({ title: 'Redeemed', description: `You redeemed ${item.name}. A receipt has been recorded.` });
  };

  const userHistory = useMemo(() => redemptions.filter(r => r.userId === user.id), [redemptions, user.id]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Gift className="w-6 h-6"/> Reward Store</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startCreate}><Plus className="w-4 h-4 mr-1"/>New Item</Button>
          {editing && <Button onClick={saveItem}><Save className="w-4 h-4 mr-1"/>Save</Button>}
        </div>
      </div>

      {editing && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            <Input placeholder="Coins" type="number" value={editing.coins} onChange={e => setEditing({ ...editing, coins: Number(e.target.value) })} />
            <Input placeholder="Category" value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} />
            <Input placeholder="Inventory" type="number" value={editing.inventory} onChange={e => setEditing({ ...editing, inventory: Number(e.target.value) })} />
            <Textarea placeholder="Description" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
            <div className="flex items-center gap-2">
              <label className="text-sm">Active</label>
              <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {catalog.map(item => (
          <Card key={item.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.category} • {item.active ? 'Active' : 'Inactive'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(item)}><Edit2 className="w-4 h-4"/></Button>
                <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{item.description}</div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{item.coins} EcoCoins</Badge>
              <div className="text-xs">Inventory: {item.inventory}</div>
            </div>
            <Button onClick={() => redeem(item)} disabled={!canAfford(item.coins) || item.inventory <= 0 || !item.active}>
              Redeem
            </Button>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your Receipts</h2>
        {userHistory.length === 0 ? (
          <div className="text-sm text-muted-foreground">No redemptions yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userHistory.map(r => {
              const item = catalog.find(i => i.id === r.itemId);
              return (
                <Card key={r.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item?.name ?? r.itemId}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.redeemedAt).toLocaleString()}</div>
                  </div>
                  <Badge variant="outline">-{r.coinsSpent} EcoCoins</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;
