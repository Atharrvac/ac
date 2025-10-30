import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useProfile, useUpdateProfile, useUploadAvatar, useWasteDetections, useBookings } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Camera, 
  Settings, 
  Award, 
  Coins, 
  Leaf, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Save,
  ArrowLeft,
  Trash2,
  Recycle,
  TrendingUp,
  Shield
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: wasteDetections = [] } = useWasteDetections();
  const { data: bookings = [] } = useBookings();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
          </div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  const totalRecycled = profile?.total_items_recycled || 0;
  const ecoCoins = profile?.eco_coins || 0;
  const co2Saved = profile?.total_co2_saved || 0;
  const badges = profile?.badges || [];
  
  const completionPercentage = Math.min(
    ((formData.full_name ? 25 : 0) + 
     (formData.phone ? 25 : 0) + 
     (formData.address ? 25 : 0) + 
     (profile?.avatar_url ? 25 : 0)), 100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-primary/10 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold ">
                My Profile
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage your account and track your eco impact</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6 sm:space-y-8">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm p-2 sm:p-3">Overview</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm p-2 sm:p-3">Settings</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm p-2 sm:p-3">Activity</TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs sm:text-sm p-2 sm:p-3">
                <span className="hidden sm:inline">Achievements</span>
                <span className="sm:hidden">Awards</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Profile Card */}
                <Card className="lg:col-span-1">
                  <CardHeader className="text-center pb-4">
                    <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-4">
                      <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-primary text-white text-lg sm:text-xl">
                          {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/80 transition-colors">
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <CardTitle className="text-lg sm:text-xl truncate">{profile?.full_name || 'Anonymous User'}</CardTitle>
                    <CardDescription className="text-sm truncate">{user?.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-primary">{ecoCoins}</div>
                      <div className="text-sm text-muted-foreground">EcoCoins</div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Profile Completion</span>
                        <span>{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">Items Recycled</p>
                          <p className="text-lg sm:text-2xl font-bold">{totalRecycled}</p>
                        </div>
                        <Recycle className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">CO₂ Saved</p>
                          <p className="text-lg sm:text-2xl font-bold">{co2Saved}kg</p>
                        </div>
                        <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-success flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">Detections</p>
                          <p className="text-lg sm:text-2xl font-bold">{wasteDetections.length}</p>
                        </div>
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">Bookings</p>
                          <p className="text-lg sm:text-2xl font-bold">{bookings.length}</p>
                        </div>
                        <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {wasteDetections.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No activity yet. Start by detecting some waste items!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {wasteDetections.slice(0, 5).map((detection) => (
                        <div key={detection.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Recycle className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{detection.detected_item}</p>
                              <p className="text-sm text-muted-foreground">{detection.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-primary">+{detection.eco_coins_earned} coins</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(detection.detected_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter your city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter your address"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      onClick={handleSave}
                      disabled={updateProfile.isPending}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    Account Actions
                  </CardTitle>
                  <CardDescription>
                    Manage your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                    className="gap-2"
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Waste Detections */}
                <Card>
                  <CardHeader>
                    <CardTitle>Waste Detections</CardTitle>
                    <CardDescription>Your recycling detection history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {wasteDetections.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No detections yet
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {wasteDetections.map((detection) => (
                          <div key={detection.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{detection.detected_item}</p>
                                <p className="text-sm text-muted-foreground">{detection.category}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(detection.detected_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={detection.hazard_level === 'low' ? 'secondary' : 
                                           detection.hazard_level === 'medium' ? 'default' : 'destructive'}>
                                {detection.hazard_level}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pickup Bookings</CardTitle>
                    <CardDescription>Your scheduled pickups</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bookings.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No bookings yet
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {bookings.map((booking) => (
                          <div key={booking.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{booking.pickup_address}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(booking.pickup_date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.items_description}
                                </p>
                              </div>
                              <Badge variant={booking.status === 'completed' ? 'default' : 
                                           booking.status === 'pending' ? 'secondary' : 'destructive'}>
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Your Achievements
                  </CardTitle>
                  <CardDescription>Badges and milestones you've earned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {badges.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <Award className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No badges earned yet</p>
                        <p className="text-sm text-muted-foreground">Start recycling to earn achievements!</p>
                      </div>
                    ) : (
                      badges.map((badge) => (
                        <div key={badge} className="text-center p-4 border rounded-lg">
                          <Award className="w-8 h-8 text-primary mx-auto mb-2" />
                          <p className="font-medium text-sm">{badge}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle>Eco Milestones</CardTitle>
                  <CardDescription>Track your environmental impact goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Items Recycled</span>
                      <span>{totalRecycled}/100</span>
                    </div>
                    <Progress value={(totalRecycled / 100) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CO₂ Saved (kg)</span>
                      <span>{co2Saved}/50</span>
                    </div>
                    <Progress value={(co2Saved / 50) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>EcoCoins Earned</span>
                      <span>{ecoCoins}/1000</span>
                    </div>
                    <Progress value={(ecoCoins / 1000) * 100} className="h-2" />
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

export default Profile;
