import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Shuffle, Route, RefreshCw } from 'lucide-react';

interface LatLng { lat: number; lng: number }
const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const DEFAULT_STOPS: LatLng[] = [
  { lat: 19.076, lng: 72.8777 }, // Mumbai
  { lat: 19.2183, lng: 72.9781 }, // Borivali
  { lat: 19.0896, lng: 72.8656 }, // Bandra
  { lat: 19.2189, lng: 72.8330 }, // Goregaon
];

async function fetchRoute(a: LatLng, b: LatLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes?.[0];
  const coords: LatLng[] = route.geometry.coordinates.map((c: [number, number]) => ({ lng: c[0], lat: c[1] }));
  const durationSec: number = route.duration;
  const distanceM: number = route.distance;
  return { coords, durationSec, distanceM } as { coords: LatLng[]; durationSec: number; distanceM: number };
}

function distance(a: LatLng, b: LatLng) {
  const dx = a.lat - b.lat; const dy = a.lng - b.lng; return Math.sqrt(dx*dx + dy*dy);
}

function nearestNeighbor(start: LatLng, stops: LatLng[]) {
  const remaining = [...stops];
  const order: LatLng[] = [start];
  let cur = start;
  while (remaining.length) {
    remaining.sort((x, y) => distance(cur, x) - distance(cur, y));
    const next = remaining.shift()!;
    order.push(next);
    cur = next;
  }
  return order;
}

const Routes = () => {
  const [stops, setStops] = useState<LatLng[]>(DEFAULT_STOPS);
  const [center] = useState<LatLng>({ lat: 19.12, lng: 72.9 });
  const [segments, setSegments] = useState<LatLng[][]>([]);
  const [totalKm, setTotalKm] = useState(0);
  const [totalMin, setTotalMin] = useState(0);

  const optimize = async () => {
    const order = nearestNeighbor(stops[0], stops.slice(1));
    const path = [stops[0], ...order.slice(1)];
    const segs: LatLng[][] = [];
    let dist = 0; let dur = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const { coords, distanceM, durationSec } = await fetchRoute(path[i], path[i+1]);
      segs.push(coords);
      dist += distanceM; dur += durationSec;
    }
    setSegments(segs);
    setTotalKm(Math.round((dist/1000)*10)/10);
    setTotalMin(Math.round(dur/60));
  };

  const shuffleStops = () => setStops(prev => [...prev].sort(() => Math.random() - 0.5));

  useEffect(() => { optimize(); }, []);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Routes & Fleet</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={shuffleStops}><Shuffle className="w-4 h-4 mr-1"/>Shuffle</Button>
          <Button onClick={optimize}><Route className="w-4 h-4 mr-1"/>Optimize</Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: '60vh', width: '100%' }}>
          <TileLayer url={TILES} />
          {stops.map((s, i) => <Marker key={i} position={[s.lat, s.lng]} />)}
          {segments.map((seg, i) => <Polyline key={i} positions={seg.map(p => [p.lat, p.lng])} color="#0ea5e9" />)}
        </MapContainer>
      </Card>

      <Card className="p-4 flex items-center justify-between">
        <div>Total Distance: {totalKm} km</div>
        <div>Total ETA: {totalMin} min</div>
        <Button variant="ghost" onClick={optimize}><RefreshCw className="w-4 h-4 mr-1"/>Recalculate</Button>
      </Card>
    </div>
  );
};

export default Routes;
