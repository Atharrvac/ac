import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { MapPin, Truck, Clock, Star, Phone, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollectors, useCreateBooking } from "@/hooks/useDatabase";
import collectionTruck from "@/assets/collection-truck.jpg";

const dropCenters = [
  { name: "Central Mall E-Waste Center", address: "MG Road, Near Metro Station", hours: "9 AM - 7 PM" },
  { name: "University Campus Collection Point", address: "Main Campus, Block A", hours: "10 AM - 6 PM" },
  { name: "Tech Park Recycling Hub", address: "Whitefield, Gate 3", hours: "8 AM - 8 PM" },
];

export const CollectorServices = () => {
  const navigate = useNavigate();
  const { data: collectors = [], isLoading: collectorsLoading } = useCollectors();
  const createBooking = useCreateBooking();
  const [selectedCollector, setSelectedCollector] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [itemsDescription, setItemsDescription] = useState("");
  const [showBooking, setShowBooking] = useState(false);
  const { toast } = useToast();

  const handleBookPickup = (collectorId: string) => {
    setSelectedCollector(collectorId);
    setShowBooking(true);
  };

  const confirmBooking = async () => {
    if (!pickupAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your pickup address",
        variant: "destructive",
      });
      return;
    }

    if (!itemsDescription.trim()) {
      toast({
        title: "Items Description Required",
        description: "Please describe the items to be collected",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a pickup for tomorrow at 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      await createBooking.mutateAsync({
        collector_id: selectedCollector!,
        pickup_date: tomorrow.toISOString(),
        pickup_address: pickupAddress,
        items_description: itemsDescription,
      });

      const collector = collectors.find(c => c.id === selectedCollector);
      toast({
        title: "Pickup Scheduled!",
        description: `${collector?.name} will collect your e-waste tomorrow at 10:00 AM`,
      });

      setShowBooking(false);
      setPickupAddress("");
      setItemsDescription("");
      setSelectedCollector(null);
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Unable to schedule pickup. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="collectors" className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="">
              Collector Services
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Schedule convenient pickups with verified collectors or drop off your 
            e-waste at our network of certified recycling centers.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Pickup Services */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Truck className="w-6 h-6 text-secondary" />
              Home Pickup Service
            </h3>
            
            {collectorsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Loading collectors...</span>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {collectors.map((collector) => (
                  <Card key={collector.id} className="p-6 bg-gradient-card hover:shadow-medium transition-all">
                    <div className="flex gap-4">
                      <img
                        src={collectionTruck}
                        alt={collector.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{collector.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {collector.address || collector.city || "Service area"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{collector.rating}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {collector.specialties.map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className={`font-medium ${collector.available ? 'text-success' : 'text-muted-foreground'}`}>
                              {collector.available ? "Available today" : "Unavailable"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`tel:${collector.phone}`)}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="collector"
                              size="sm"
                              onClick={() => handleBookPickup(collector.id)}
                              disabled={!collector.available}
                            >
                              <Calendar className="w-4 h-4" />
                              Book Pickup
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {collectors.length === 0 && !collectorsLoading && (
                  <Card className="p-8 text-center">
                    <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">No collectors available</h4>
                    <p className="text-muted-foreground">Check back later for available pickup services</p>
                  </Card>
                )}
              </div>
            )}

            {showBooking && (
              <Card className="p-6 bg-gradient-to-r from-secondary-light to-primary-light border border-secondary/20">
                <h4 className="font-semibold text-lg mb-4">Schedule Pickup</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pickup Address</label>
                    <Input
                      placeholder="Enter your complete address..."
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Items Description</label>
                    <Input
                      placeholder="Describe items to be collected (e.g., 2 smartphones, 1 laptop)"
                      value={itemsDescription}
                      onChange={(e) => setItemsDescription(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="hero"
                      onClick={confirmBooking}
                      className="flex-1"
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        'Confirm Pickup'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowBooking(false)}
                      disabled={createBooking.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 text-center bg-gradient-card">
              <h4 className="font-semibold text-lg mb-2">Need More Options?</h4>
              <p className="text-muted-foreground mb-4">
                Visit our booking page for advanced scheduling, multiple collectors, and booking management.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/bookings')}
                className="w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Advanced Booking
              </Button>
            </Card>
          </div>

          {/* Drop Centers */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Drop-off Centers
            </h3>
            
            <div className="space-y-4 mb-6">
              {dropCenters.map((center, index) => (
                <Card key={index} className="p-6 bg-gradient-card">
                  <h4 className="font-semibold text-lg mb-2">{center.name}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                      <span>{center.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-success" />
                      <span>Open: {center.hours}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Get Directions
                  </Button>
                </Card>
              ))}
            </div>

            {/* QR Code Feature */}
            <Card className="p-6 bg-gradient-primary text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white rounded"></div>
                </div>
                <h4 className="font-semibold text-lg mb-2">Smart QR Drop Bins</h4>
                <p className="text-white/90 text-sm mb-4">
                  Look for our QR-enabled bins at colleges and shops. 
                  Scan, drop, and earn EcoCoins instantly!
                </p>
                <Button variant="glass" size="sm">
                  Find QR Bins Near You
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
