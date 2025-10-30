import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Clock, Navigation, MapPin, RefreshCw } from 'lucide-react';

interface LatLng { lat: number; lng: number }
interface StatusEntry { ts: string; label: string }

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const DEFAULT_USER: LatLng = { lat: 19.076, lng: 72.8777 }; // Mumbai
const DEFAULT_COLLECTOR: LatLng = { lat: 19.2183, lng: 72.9781 }; // Borivali

async function fetchRoute(a: LatLng, b: LatLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Routing failed');
  const data = await res.json();
  const route = data.routes?.[0];
  const coords: LatLng[] = route.geometry.coordinates.map((c: [number, number]) => ({ lng: c[0], lat: c[1] }));
  const durationSec: number = route.duration;
  const distanceM: number = route.distance;
  return { coords, durationSec, distanceM } as { coords: LatLng[]; durationSec: number; distanceM: number };
}

function formatEta(sec: number) {
  const m = Math.round(sec / 60);
  if (m < 1) return '<1 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

const LiveTracking = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [userPos, setUserPos] = useState<LatLng>(DEFAULT_USER);
  const [collectorPos, setCollectorPos] = useState<LatLng>(DEFAULT_COLLECTOR);
  const [path, setPath] = useState<LatLng[]>([]);
  const [eta, setEta] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [status, setStatus] = useState<StatusEntry[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const simIndex = useRef(0);

  useEffect(() => { if (!loading && !user) return; }, [loading, user]);

  const center = useMemo(() => ({ lat: (userPos.lat + collectorPos.lat) / 2, lng: (userPos.lng + collectorPos.lng) / 2 }), [userPos, collectorPos]);

  const plan = async () => {
    try {
      const { coords, durationSec, distanceM } = await fetchRoute(collectorPos, userPos);
      setPath(coords);
      setEta(formatEta(durationSec));
      setDistanceKm(Math.round((distanceM / 1000) * 10) / 10);
      setStatus([
        { ts: new Date().toLocaleTimeString(), label: 'Collector assigned' },
        { ts: new Date().toLocaleTimeString(), label: 'En route to your location' },
      ]);
      toast({ title: 'Route planned', description: `ETA ${formatEta(durationSec)}, ${Math.round(distanceM/100)/10} km` });
    } catch (e: any) {
      toast({ title: 'Routing error', description: e.message, variant: 'destructive' });
    }
  };

  const simulateMovement = () => {
    if (path.length === 0) return;
    setIsSimulating(true);
    simIndex.current = 0;
    const id = setInterval(() => {
      simIndex.current += 3; // move faster through polyline
      if (simIndex.current >= path.length) {
        clearInterval(id);
        setCollectorPos(userPos);
        setIsSimulating(false);
        setEta('Arrived');
        setStatus(prev => [...prev, { ts: new Date().toLocaleTimeString(), label: 'Arrived at pickup' }]);
        toast({ title: 'Collector arrived', description: 'Pickup is starting now.' });
        return;
      }
      const p = path[simIndex.current];
      setCollectorPos(p);
      const remaining = path.length - simIndex.current;
      const approxSec = Math.max(30, Math.round((remaining / path.length) * 600));
      setEta(formatEta(approxSec));
    }, 800);
  };

  const reset = () => {
    setCollectorPos(DEFAULT_COLLECTOR);
    setPath([]);
    setEta('');
    setStatus([]);
  };

  useEffect(() => { plan(); }, []);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Navigation className="w-6 h-6"/> Live Pickup Tracking</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary"><Clock className="w-4 h-4 mr-1"/>{eta || 'Planning...'}</Badge>
          <Badge variant="outline">{distanceKm} km</Badge>
          <Button variant="outline" onClick={plan} className="gap-1"><RefreshCw className="w-4 h-4"/>Recalculate</Button>
          <Button onClick={simulateMovement} disabled={isSimulating || path.length === 0}>Simulate</Button>
          <Button variant="ghost" onClick={reset}>Reset</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-0 lg:col-span-2 overflow-hidden">
          <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: '60vh', width: '100%' }}>
            <TileLayer url={TILES} />
            <Marker position={[userPos.lat, userPos.lng]} />
            <Marker position={[collectorPos.lat, collectorPos.lng]} />
            {path.length > 0 && <Polyline positions={path.map(p => [p.lat, p.lng])} color="#22c55e" />}
          </MapContainer>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold mb-2">Status Timeline</h2>
          <div className="space-y-2">
            {status.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded border">
                <MapPin className="w-4 h-4"/> <span className="text-sm">{s.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{s.ts}</span>
              </div>
            ))}
            {status.length === 0 && <div className="text-sm text-muted-foreground">No updates yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LiveTracking;
