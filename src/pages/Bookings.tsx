import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useBookings, useCreateBooking, useCollectors } from '@/hooks/useDatabase';
import { predictEcoCoins } from '@/lib/impact';
import VoiceBooking from '@/components/VoiceBooking';
import { format, addDays, addHours, setHours, setMinutes } from 'date-fns';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  Star,
  Truck,
  Package,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Printer
} from 'lucide-react';

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

const itemCategories = [
  'Smartphones & Tablets',
  'Laptops & Computers',
  'Batteries',
  'Cables & Chargers',
  'Small Appliances',
  'Large Appliances',
  'Mixed E-Waste'
];

const Bookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: collectors = [], isLoading: collectorsLoading } = useCollectors();
  const createBooking = useCreateBooking();

  // Form state
  const [selectedCollector, setSelectedCollector] = useState('');
  const [pickupDate, setPickupDate] = useState<Date>();
  const [pickupTime, setPickupTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [itemsDescription, setItemsDescription] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [notes, setNotes] = useState('');

  const predictedCoins = useMemo(() => {
    const w = parseFloat(estimatedWeight);
    if (!selectedCategory || isNaN(w) || w <= 0) return null;
    // Map UI categories to model categories roughly
    const mapCat = (c: string) => {
      if (c.includes('Smartphones')) return 'Smartphones';
      if (c.includes('Laptops')) return 'Laptops';
      if (c.includes('Batteries')) return 'Batteries';
      if (c.includes('Cables')) return 'Cables';
      return 'Computer Parts';
    };
    return predictEcoCoins(mapCat(selectedCategory), w);
  }, [selectedCategory, estimatedWeight]);

  useEffect(() => {
    const state = location.state as { collectorId?: string } | null;
    if (state?.collectorId) setSelectedCollector(state.collectorId);
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCollector || !pickupDate || !pickupTime || !pickupAddress || !itemsDescription) {
      return;
    }

    const pickupDateTime = format(
      setMinutes(setHours(pickupDate, parseInt(pickupTime.split(':')[0])), parseInt(pickupTime.split(':')[1])),
      'yyyy-MM-dd HH:mm:ss'
    );

    try {
      await createBooking.mutateAsync({
        collector_id: selectedCollector,
        pickup_date: pickupDateTime,
        pickup_address: pickupAddress,
        items_description: itemsDescription,
        estimated_weight: estimatedWeight ? parseFloat(estimatedWeight) : null,
        eco_coins_earned: predictedCoins ?? null as any,
        notes: notes || null,
      } as any);

      // Reset form
      setSelectedCollector('');
      setPickupDate(undefined);
      setPickupTime('');
      setPickupAddress('');
      setItemsDescription('');
      setEstimatedWeight('');
      setSelectedCategory('');
      setNotes('');
    } catch (error) {
      console.error('Failed to create booking:', error);
    }
  };

  const onVoice = (cmd: { intent: 'book'; date?: Date; time?: string; address?: string }) => {
    if (cmd.date) setPickupDate(cmd.date);
    if (cmd.time) setPickupTime(cmd.time);
    if (cmd.address) setPickupAddress(cmd.address);
  };

  const printReceipt = (booking: any) => {
    const win = window.open('', '', 'width=800,height=900');
    if (!win) return;
    const when = new Date(booking.pickup_date);
    const html = `
      <html>
        <head>
          <title>EcoSmart Receipt - ${when.toDateString()}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
            .header { display:flex; justify-content:space-between; align-items:center; }
            .title { font-size: 20px; font-weight: 700; }
            .section { margin-top: 16px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .muted { color: #6b7280; }
            .row { display:flex; justify-content:space-between; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">EcoSmart Recycling Receipt</div>
            <div class="muted">#${booking.id}</div>
          </div>
          <div class="section">
            <div class="row"><div>Date</div><div>${when.toLocaleString()}</div></div>
            <div class="row"><div>Address</div><div>${booking.pickup_address}</div></div>
            <div class="row"><div>Items</div><div>${booking.items_description}</div></div>
            ${booking.estimated_weight ? `<div class="row"><div>Estimated weight</div><div>${booking.estimated_weight} kg</div></div>` : ''}
            ${booking.eco_coins_earned ? `<div class="row"><div>EcoCoins (est.)</div><div>${booking.eco_coins_earned}</div></div>` : ''}
            <div class="row"><div>Status</div><div>${booking.status}</div></div>
          </div>
          <div class="muted" style="margin-top:12px">This is a digital receipt. Thank you for recycling responsibly.</div>
          <script>window.onload = () => { window.print(); };<\/script>
        </body>
      </html>`;
    win.document.write(html);
    win.document.close();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold ">
                  Pickup Bookings
                </h1>
                <p className="text-muted-foreground">Schedule and manage your e-waste pickup services</p>
              </div>
            </div>
            <VoiceBooking onCommand={onVoice} />
          </div>

          <Tabs defaultValue="book" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="book">New Booking</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Pickups</TabsTrigger>
              <TabsTrigger value="history">Pickup History</TabsTrigger>
            </TabsList>

            {/* New Booking Tab */}
            <TabsContent value="book" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Booking Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Schedule Pickup
                    </CardTitle>
                    <CardDescription>
                      Fill in the details to schedule your e-waste pickup
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Collector Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="collector">Select Collector</Label>
                        <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a collector" />
                          </SelectTrigger>
                          <SelectContent>
                            {collectorsLoading ? (
                              <SelectItem value="loading" disabled>Loading collectors...</SelectItem>
                            ) : (
                              collectors.map((collector) => (
                                <SelectItem key={collector.id} value={collector.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{collector.name}</span>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      {collector.rating}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date & Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Pickup Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {pickupDate ? format(pickupDate, 'PPP') : 'Select date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={pickupDate}
                                onSelect={setPickupDate}
                                disabled={(date) => date < addDays(new Date(), 1)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="time">Pickup Time</Label>
                          <Select value={pickupTime} onValueChange={setPickupTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="address">Pickup Address</Label>
                        <Textarea
                          id="address"
                          placeholder="Enter your complete pickup address"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Item Category */}
                      <div className="space-y-2">
                        <Label htmlFor="category">Item Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {itemCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Items Description */}
                      <div className="space-y-2">
                        <Label htmlFor="items">Items Description</Label>
                        <Textarea
                          id="items"
                          placeholder="Describe the items to be collected (e.g., 2 smartphones, 1 laptop, charging cables)"
                          value={itemsDescription}
                          onChange={(e) => setItemsDescription(e.target.value)}
                          rows={3}
                        />
                      </div>

                      {/* Estimated Weight */}
                      <div className="space-y-2">
                        <Label htmlFor="weight">Estimated Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="Approximate weight"
                          value={estimatedWeight}
                          onChange={(e) => setEstimatedWeight(e.target.value)}
                          step="0.1"
                          min="0"
                        />
                        {predictedCoins !== null && (
                          <div className="text-xs text-muted-foreground">
                            Predicted reward: <span className="font-medium text-primary">{predictedCoins} EcoCoins</span>
                          </div>
                        )}
                      </div>

                      {/* Additional Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special instructions or notes for the collector"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createBooking.isPending}
                      >
                        {createBooking.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Schedule Pickup
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Available Collectors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Available Collectors
                    </CardTitle>
                    <CardDescription>
                      Verified collectors in your area
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {collectorsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {collectors.map((collector) => (
                          <Card key={collector.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{collector.name}</h4>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm">{collector.rating}</span>
                                  </div>
                                </div>
                                
                                <div className="text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1 mb-1">
                                    <MapPin className="w-3 h-3" />
                                    {collector.address || 'Service area'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {collector.phone}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  {collector.specialties.map((specialty) => (
                                    <Badge key={specialty} variant="outline" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCollector(collector.id)}
                                disabled={selectedCollector === collector.id}
                              >
                                {selectedCollector === collector.id ? 'Selected' : 'Select'}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Scheduled Pickups */}
            <TabsContent value="scheduled" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Pickups</CardTitle>
                  <CardDescription>Your scheduled pickups and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings
                        .filter(booking => new Date(booking.pickup_date) >= new Date() && booking.status !== 'completed')
                        .map((booking) => (
                          <Card key={booking.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">
                                    Pickup on {format(new Date(booking.pickup_date), 'PPP')}
                                  </h4>
                                  <Badge variant={getStatusVariant(booking.status)}>
                                    {getStatusIcon(booking.status)}
                                    {booking.status}
                                  </Badge>
                                </div>
                                
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(booking.pickup_date), 'p')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {booking.pickup_address}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {booking.items_description}
                                  </div>
                                  {booking.estimated_weight && (
                                    <div className="text-xs">
                                      Estimated weight: {booking.estimated_weight}kg
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="shrink-0 ml-3">
                                <Button variant="outline" size="sm" onClick={() => printReceipt(booking)}>
                                  <Printer className="w-4 h-4 mr-2" /> Receipt
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      
                      {bookings.filter(booking => new Date(booking.pickup_date) >= new Date() && booking.status !== 'completed').length === 0 && (
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No upcoming pickups scheduled</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => navigate('?tab=book')}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Schedule a Pickup
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pickup History */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pickup History</CardTitle>
                  <CardDescription>Your completed and past pickups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings
                      .filter(booking => booking.status === 'completed' || new Date(booking.pickup_date) < new Date())
                      .map((booking) => (
                        <Card key={booking.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">
                                  {format(new Date(booking.pickup_date), 'PPP')}
                                </h4>
                                <Badge variant={getStatusVariant(booking.status)}>
                                  {getStatusIcon(booking.status)}
                                  {booking.status}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {booking.items_description}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {booking.pickup_address}
                                </div>
                                {booking.eco_coins_earned && (
                                  <div className="text-primary font-medium">
                                    Earned: {booking.eco_coins_earned} EcoCoins
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    
                    {bookings.filter(booking => booking.status === 'completed' || new Date(booking.pickup_date) < new Date()).length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No pickup history yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
