import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown } from 'lucide-react';

interface Redemption { id: string; itemId: string; userId: string; coinsSpent: number; redeemedAt: string }
interface CatalogItem { id: string; name: string }
const REDEEM_KEY = 'eco_store_redemptions_v1';
const CATALOG_KEY = 'eco_store_catalog_v1';

function loadRedemptions(): Redemption[] { try { const raw = localStorage.getItem(REDEEM_KEY); return raw ? JSON.parse(raw) as Redemption[] : []; } catch { return []; } }
function loadCatalog(): CatalogItem[] { try { const raw = localStorage.getItem(CATALOG_KEY); return raw ? JSON.parse(raw) as CatalogItem[] : []; } catch { return []; } }

function openReceiptHTML(title: string, body: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><title>${title}</title><style>body{font-family:system-ui;padding:24px} .hdr{font-weight:700;font-size:18px} .meta{color:#555} .box{border:1px solid #ddd;border-radius:8px;padding:16px;margin-top:12px}</style></head><body><div class='hdr'>${title}</div>${body}<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

const Receipts = () => {
  const redemptions = useMemo(() => loadRedemptions(), []);
  const catalog = useMemo(() => loadCatalog(), []);

  const download = (r: Redemption) => {
    const item = catalog.find(i => i.id === r.itemId);
    const html = `<div class='box'><div class='meta'>Receipt ID: ${r.id}</div><div>Item: <b>${item?.name ?? r.itemId}</b></div><div>Coins Spent: ${r.coinsSpent}</div><div>Date: ${new Date(r.redeemedAt).toLocaleString()}</div></div>`;
    openReceiptHTML('EcoSmart Receipt', html);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Digital Receipts</h1>
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold mb-2">Reward Redemptions</h2>
        {redemptions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No redemptions yet.</div>
        ) : redemptions.map(r => (
          <div key={r.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">{catalog.find(i => i.id === r.itemId)?.name ?? r.itemId}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.redeemedAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">-{r.coinsSpent} EcoCoins</Badge>
              <Button size="sm" onClick={() => download(r)} className="gap-1"><FileDown className="w-4 h-4"/>Download</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-2">Pickup Receipts</h2>
        <div className="text-sm text-muted-foreground">Pickup receipts require database bookings. Connect Supabase/Neon to enable pickup receipt generation.</div>
      </Card>
    </div>
  );
};

export default Receipts;
