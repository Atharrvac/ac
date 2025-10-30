import { useEffect, useMemo, useState } from 'react';
import { useCollectors } from '@/hooks/useDatabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, ZoomControl, ScaleControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix default marker icons for Vite
// Use Leaflet's CDN assets to avoid bundling issues
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Position { lat: number; lng: number }

function haversine(a: Position, b: Position) {
  const R = 6371; // km
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLon * sinDLon;
  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  return R * d;
}

function randomPointAround(origin: Position, minRadiusKm: number, maxRadiusKm: number): Position {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * (maxRadiusKm - minRadiusKm) + minRadiusKm; // uniform over area
  const dLat = (radius / 110.574) * Math.sin(angle);
  const dLng = (radius / (111.32 * Math.cos(origin.lat * Math.PI / 180))) * Math.cos(angle);
  return { lat: origin.lat + dLat, lng: origin.lng };
}

function mapsDirectionsUrl(dest: Position, origin?: Position) {
  const destination = `${dest.lat},${dest.lng}`;
  const originParam = origin ? `&origin=${origin.lat},${origin.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}${originParam}&travelmode=driving`;
}

// India focus
const INDIA_CENTER: Position = { lat: 22.9734, lng: 78.6569 };

// Major Indian cities to simulate realistic distribution
const INDIAN_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Surat', lat: 21.1702, lng: 72.8311 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Thane', lat: 19.2183, lng: 72.9781 },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
  { name: 'Patna', lat: 25.5941, lng: 85.1376 },
  { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
  { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  { name: 'Ludhiana', lat: 30.9000, lng: 75.8573 },
  { name: 'Agra', lat: 27.1767, lng: 78.0081 },
  { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { name: 'Faridabad', lat: 28.4089, lng: 77.3178 },
  { name: 'Meerut', lat: 28.9845, lng: 77.7064 },
  { name: 'Rajkot', lat: 22.3039, lng: 70.8022 },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { name: 'Srinagar', lat: 34.0837, lng: 74.7973 },
  { name: 'Ranchi', lat: 23.3441, lng: 85.3096 },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
];

type PartnerMeta = {
  type: string;
  phone: string;
  hours: string;
  verified: boolean;
  photoUrl: string;
  rating: number;
};

type CollectorLike = {
  id: string | number;
  name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  specialties?: string[] | null;
  rating?: number | null;
} & PartnerMeta;

// Deterministic pseudo-random from string seed
function seededRandom(seedStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state & 0xffffffff) / 0x100000000;
  };
}

function buildMeta(id: string | number, city?: string): PartnerMeta {
  const rnd = seededRandom(String(id));
  const types = ['NGO', 'Authorized E-Waste Center', 'Scrap Dealer', 'Recycling Hub', 'Collection Point'];
  const hoursOpts = ['Mon–Sat 9 AM – 6 PM', 'Daily 10 AM – 7 PM', 'Mon–Fri 8 AM – 5 PM', '24x7', 'Mon–Sun 9 AM – 9 PM'];
  const type = types[Math.floor(rnd() * types.length)];
  const hours = hoursOpts[Math.floor(rnd() * hoursOpts.length)];
  const start = [9, 8, 7, 6][Math.floor(rnd() * 4)];
  const digits = Array.from({ length: 9 }, () => Math.floor(rnd() * 10)).join('');
  const phone = `+91 ${start}${digits.slice(0,4)} ${digits.slice(4)}`;
  const verified = rnd() > 0.3;
  const seed = encodeURIComponent(`${id}-${city ?? 'india'}`);
  const photoUrl = `https://picsum.photos/seed/${seed}/400/220`;
  const rating = Math.round((3.7 + rnd() * 1.3) * 10) / 10; // 3.7 – 5.0
  return { type, phone, hours, verified, photoUrl, rating };
}

const GeoMatching = () => {
  const { data: collectors = [], isLoading } = useCollectors();
  const navigate = useNavigate();
  const [userPos, setUserPos] = useState<Position | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported. Showing India.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError('Location permission denied. Showing India.')
    );
  }, []);

  
  const normalizedCollectors: (CollectorLike & { latitude: number; longitude: number })[] = useMemo(() => {
    return collectors.map((c: any, idx: number) => {
      let lat = typeof c.latitude === 'number' ? c.latitude : null;
      let lng = typeof c.longitude === 'number' ? c.longitude : null;
      if (lat === null || lng === null) {
        const city = INDIAN_CITIES[idx % INDIAN_CITIES.length];
        const rp = randomPointAround({ lat: city.lat, lng: city.lng }, 1, 10);
        lat = rp.lat;
        lng = rp.lng;
      }
      const meta = buildMeta(c.id ?? `collector-${idx}`, c.city ?? undefined);
      return {
        id: c.id ?? `collector-${idx}`,
        name: c.name ?? 'Recycling Partner',
        address: c.address ?? null,
        city: c.city ?? null,
        latitude: lat as number,
        longitude: lng as number,
        specialties: Array.isArray(c.specialties)
          ? Array.from(new Set(c.specialties.filter((s: any) => typeof s === 'string' && s.trim().length > 0)))
          : [],
        rating: typeof c.rating === 'number' ? c.rating : meta.rating,
        ...meta,
      };
    });
  }, [collectors]);

  // Synthetic India-wide recommended partners evenly across cities with rich meta
  const synthetic: (CollectorLike & { latitude: number; longitude: number })[] = useMemo(() => {
    const baseNames = collectors.map((c: any) => c.name).filter(Boolean) as string[];
    const specialtiesPool = Array.from(new Set(
      collectors
        .flatMap((c: any) => Array.isArray(c.specialties) ? c.specialties : [])
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
    ));

    const pickSpecialties = (id: string | number) => {
      if (specialtiesPool.length === 0) return ['Recycling'];
      const rnd = seededRandom(String(id));
      const count = 1 + Math.floor(rnd() * Math.min(3, specialtiesPool.length));
      const indices = new Set<number>();
      while (indices.size < count) indices.add(Math.floor(rnd() * specialtiesPool.length));
      return Array.from(indices).map(i => specialtiesPool[i]);
    };

    const count = 48;
    const generated: (CollectorLike & { latitude: number; longitude: number })[] = [];
    for (let i = 0; i < count; i++) {
      const city = INDIAN_CITIES[i % INDIAN_CITIES.length];
      const id = `synthetic-${i}-${city.name}`;
      const p = randomPointAround({ lat: city.lat, lng: city.lng }, 2, 15);
      const nameBase = baseNames.length > 0 ? baseNames[i % baseNames.length] : `${city.name} Recycler`;
      const meta = buildMeta(id, city.name);
      generated.push({
        id,
        name: `${nameBase} (Recommended)`,
        address: `${Math.floor(1 + (seededRandom(id)() * 99))} ${city.name} Main Rd`,
        city: city.name,
        latitude: p.lat,
        longitude: p.lng,
        specialties: pickSpecialties(id),
        rating: meta.rating,
        ...meta,
      });
    }
    return generated;
  }, [collectors]);

  // Combine and sort by distance from user if available, else India center
  const partners = useMemo(() => {
    const origin = userPos ?? INDIA_CENTER;
    const all = [
      ...normalizedCollectors,
      ...synthetic,
    ].map(p => ({
      ...p,
      distanceKm: haversine(origin, { lat: p.latitude as number, lng: p.longitude as number })
    })) as (CollectorLike & { latitude: number; longitude: number; distanceKm: number })[];
    return all.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [normalizedCollectors, synthetic, userPos]);

  // Always focus map on India
  const center = INDIA_CENTER;
  const zoom = 5;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Geo‑Matching</h1>
        <p className="text-muted-foreground">India‑wide recyclers & NGOs near you.</p>
        {geoError && <p className="text-warning mt-2 text-sm">{geoError}</p>}
      </div>

      <Card className="overflow-hidden mb-6">
        <div className="h-[420px] w-full">
          <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="h-full w-full" zoomControl={false} preferCanvas maxZoom={20}>
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="CARTO Voyager">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="OpenTopoMap (relief)">
                <TileLayer
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  attribution="Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="CARTO Dark">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite (Esri)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
                />
              </LayersControl.BaseLayer>

              <LayersControl.Overlay checked name="Labels (Esri Boundaries)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri"
                />
              </LayersControl.Overlay>
              <LayersControl.Overlay name="Hillshade (Esri)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri"
                />
              </LayersControl.Overlay>
            </LayersControl>

            <ZoomControl position="bottomright" />
            <ScaleControl position="bottomleft" />

            {userPos && (
              <Marker position={[userPos.lat, userPos.lng]}>
                <Popup>Your location</Popup>
              </Marker>
            )}
            {partners.map(c => (
              <Marker key={String(c.id)} position={[Number(c.latitude), Number(c.longitude)]}>
                <Popup>
                  <div className="space-y-2 w-[240px]">
                    <a href={c.photoUrl.replace('/400/220', '/800/440')} target="_blank" rel="noopener noreferrer">
                      <img src={c.photoUrl} alt={c.name} className="w-full h-28 object-cover rounded cursor-pointer" />
                    </a>
                    <div className="font-semibold flex items-center justify-between">
                      <span className="truncate pr-2">{c.name}</span>
                      {c.verified && <Badge className="text-[10px]" variant="outline">Verified</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.type} • ⭐ {c.rating?.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">{c.address || `${c.city}`}</div>
                    <div className="text-xs">☎ <a href={`tel:${c.phone.replace(/\s/g,'')}`} className="underline">{c.phone}</a></div>
                    <div className="text-xs">Hours: {c.hours}</div>
                    <div className="pt-1 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => window.open(mapsDirectionsUrl({ lat: Number(c.latitude), lng: Number(c.longitude) }, userPos ?? undefined),'_blank')}>Directions</Button>
                      <Button size="sm" onClick={() => navigate('/bookings', { state: { collectorId: c.id } })}>Book</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      <h2 className="text-xl font-semibold mb-3">Recommended Partners (India)</h2>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading partners…</div>
      ) : (
        <div className="space-y-3">
          {partners.map(c => (
            <Card key={String(c.id)} className="p-4 flex items-center justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <a href={c.photoUrl.replace('/400/220', '/800/440')} target="_blank" rel="noopener noreferrer">
                  <img src={c.photoUrl} alt={c.name} className="w-24 h-20 object-cover rounded cursor-pointer" />
                </a>
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> <span className="truncate">{c.name}</span>
                    {c.verified && <Badge className="text-[10px]" variant="outline">Verified</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.type} • ⭐ {c.rating?.toFixed(1)} • {(c as any).distanceKm ? `${(c as any).distanceKm.toFixed(1)} km` : ''}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {c.address || `${c.city}`}
                  </div>
                  <div className="text-xs">Hours: {c.hours} • {(c.specialties || []).filter(Boolean).slice(0,3).join(', ')}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(c.specialties || []).filter(Boolean).slice(0,3).map((s, i) => (
                      <Badge key={`${c.id}-spec-${i}`} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => window.open(mapsDirectionsUrl({ lat: Number(c.latitude), lng: Number(c.longitude) }, userPos ?? undefined),'_blank')}>Directions</Button>
                <Button size="sm" onClick={() => navigate('/bookings', { state: { collectorId: c.id } })}>Book</Button>
              </div>
            </Card>
          ))}
          {partners.length === 0 && (
            <Card className="p-6 text-center text-muted-foreground">No partners available.</Card>
          )}
        </div>
      )}
    </div>
  );
};

export default GeoMatching;
