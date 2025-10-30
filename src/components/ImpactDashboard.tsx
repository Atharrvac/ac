import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Leaf, Droplets, Zap, TreePine, Users, TrendingUp } from "lucide-react";
import { useProfile, useWasteDetections } from "@/hooks/useDatabase";
import { treesEquivalent, energyEquivalentKWh, waterSavedLiters } from "@/lib/impact";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ImpactDashboard = () => {
  const { data: profile } = useProfile();
  const { data: detections = [] } = useWasteDetections();

  // Community counts via HEAD count (efficient)
  const { data: communityCounts } = useQuery({
    queryKey: ['community-counts'],
    queryFn: async () => {
      const det = await supabase.from('waste_detections').select('*', { count: 'exact', head: true });
      const bok = await supabase.from('bookings').select('*', { count: 'exact', head: true });
      return {
        detections: det.count ?? 0,
        bookings: bok.count ?? 0,
      };
    }
  });

  const co2SavedUser = profile?.total_co2_saved ?? 0;
  const itemsUser = profile?.total_items_recycled ?? 0;

  const impactStats = [
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "CO₂ Prevented",
      value: co2SavedUser.toLocaleString(),
      unit: "kg",
      description: `≈ ${treesEquivalent(co2SavedUser)} trees/year`,
      color: "text-success",
      bgColor: "bg-gradient-primary"
    },
    {
      icon: <Droplets className="w-8 h-8" />,
      title: "Water Saved",
      value: waterSavedLiters(itemsUser).toLocaleString(),
      unit: "liters",
      description: "Lifecycle water preserved",
      color: "text-blue-500",
      bgColor: "bg-gradient-secondary"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Energy Recovered",
      value: energyEquivalentKWh(itemsUser).toLocaleString(),
      unit: "kWh",
      description: "From recycled materials",
      color: "text-yellow-500",
      bgColor: "bg-gradient-reward"
    },
    {
      icon: <TreePine className="w-8 h-8" />,
      title: "Landfill Diverted",
      value: itemsUser.toLocaleString(),
      unit: "items",
      description: "Waste properly recycled",
      color: "text-green-600",
      bgColor: "bg-gradient-primary"
    }
  ];

  const monthlyGoals = [
    { category: "Electronics", current: Math.min(itemsUser, 100), target: 100, color: "bg-primary" },
    { category: "Batteries", current: Math.min(Math.floor(itemsUser * 0.3), 60), target: 60, color: "bg-secondary" },
    { category: "Cables", current: Math.min(Math.floor(itemsUser * 0.6), 80), target: 80, color: "bg-success" },
    { category: "Mobiles", current: Math.min(Math.floor(itemsUser * 0.4), 50), target: 50, color: "bg-warning" }
  ];

  return (
    <section id="impact" className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Environmental{" "}
            <span className="">
              Impact
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See the real difference you're making. Every piece of e-waste recycled
            contributes to a cleaner, greener planet for future generations.
          </p>
        </div>

        {/* Impact Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {impactStats.map((stat, index) => (
            <Card key={index} className="p-6 text-center bg-gradient-card hover:shadow-medium transition-all">
              <div className={`w-16 h-16 ${stat.bgColor} rounded-full mx-auto mb-4 flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                {stat.value}
                <span className="text-lg ml-1">{stat.unit}</span>
              </div>
              <h3 className="font-semibold mb-2">{stat.title}</h3>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Monthly Goals */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Monthly Recycling Goals
            </h3>

            <div className="space-y-6">
              {monthlyGoals.map((goal, index) => (
                <Card key={index} className="p-6 bg-gradient-card">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{goal.category}</h4>
                    <Badge variant={goal.current >= goal.target ? "default" : "outline"}>
                      {goal.current}/{goal.target} items
                    </Badge>
                  </div>
                  <Progress
                    value={(goal.current / goal.target) * 100}
                    className="h-3 mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress: {Math.round((goal.current / goal.target) * 100)}%</span>
                    <span>{goal.target - goal.current} items to go</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Personal Achievements */}
            <Card className="p-6 mt-6 bg-gradient-to-r from-primary-light to-secondary-light border border-primary/20">
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Your Eco Journey
              </h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{detections.length}</div>
                  <div className="text-sm text-muted-foreground">Detections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{profile?.eco_coins ?? 0}</div>
                  <div className="text-sm text-muted-foreground">EcoCoins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{profile?.total_items_recycled ?? 0}</div>
                  <div className="text-sm text-muted-foreground">Items Recycled</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{profile?.total_co2_saved ?? 0}</div>
                  <div className="text-sm text-muted-foreground">CO₂ Saved (kg)</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Community snapshot */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-secondary" />
              Community Snapshot
            </h3>

            <Card className="p-6 mb-6 bg-gradient-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="font-semibold">Total Detections</div>
                  <div className="font-bold text-primary">{communityCounts?.detections ?? '—'}</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="font-semibold">Total Bookings</div>
                  <div className="font-bold text-primary">{communityCounts?.bookings ?? '—'}</div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="font-semibold">Est. CO�� Saved</div>
                  <div className="font-bold text-primary">{communityCounts ? ((communityCounts.detections * 2.5).toFixed(1)) : '—'} kg</div>
                </div>
              </div>
            </Card>

            {/* Environmental Impact Visualization */}
            <Card className="p-6 bg-gradient-hero text-white">
              <h4 className="font-semibold text-lg mb-4">This Month's Impact</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>CO₂ Saved by Community</span>
                  <span className="font-bold">{communityCounts ? `${(communityCounts.detections * 2.5 / 1000).toFixed(2)} tons` : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Equivalent Trees Planted</span>
                  <span className="font-bold">{communityCounts ? `${Math.round((communityCounts.detections * 2.5) / 21.77)} trees 🌳` : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Landfill Space Saved</span>
                  <span className="font-bold">{communityCounts ? `${Math.round(communityCounts.detections * 0.5)} m³` : '—'}</span>
                </div>
                <div className="pt-2 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🌍</div>
                    <p className="text-sm opacity-90">
                      Together we're creating a cleaner planet!
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
