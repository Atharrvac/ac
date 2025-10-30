import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useProfile, 
  useWasteDetections, 
  useBookings, 
  useRewards 
} from '@/hooks/useDatabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Recycle,
  Coins,
  Calendar,
  Award,
  Leaf,
  MapPin,
  Clock,
  Target,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30d');
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: wasteDetections = [] } = useWasteDetections();
  const { data: bookings = [] } = useBookings();
  const { data: rewards = [] } = useRewards();

  // Calculate analytics data
  const totalEcoCoins = profile?.eco_coins || 0;
  const totalRecycled = profile?.total_items_recycled || 0;
  const co2Saved = profile?.total_co2_saved || 0;
  const badges = profile?.badges || [];

  // Time-based data preparation
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '3m':
        return { start: subMonths(now, 3), end: now };
      case '6m':
        return { start: subMonths(now, 6), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { start, end } = getDateRange();

  // Recycling trend data
  const recyclingTrendData = eachDayOfInterval({ start, end })
    .map(date => {
      const dayDetections = wasteDetections.filter(detection => 
        format(new Date(detection.detected_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return {
        date: format(date, 'MMM dd'),
        items: dayDetections.length,
        ecoCoins: dayDetections.reduce((sum, d) => sum + d.eco_coins_earned, 0),
        co2: dayDetections.length * 2.5, // Estimate CO2 saved per item
      };
    });

  // Category distribution
  const categoryData = wasteDetections.reduce((acc, detection) => {
    acc[detection.category] = (acc[detection.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value,
  }));

  // Monthly comparison
  const thisMonth = wasteDetections.filter(d => 
    new Date(d.detected_at) >= startOfMonth(new Date()) &&
    new Date(d.detected_at) <= endOfMonth(new Date())
  );
  const lastMonth = wasteDetections.filter(d => 
    new Date(d.detected_at) >= startOfMonth(subMonths(new Date(), 1)) &&
    new Date(d.detected_at) <= endOfMonth(subMonths(new Date(), 1))
  );

  const monthlyGrowth = lastMonth.length > 0 
    ? ((thisMonth.length - lastMonth.length) / lastMonth.length * 100)
    : 0;

  // Booking status distribution
  const bookingStatusData = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Environmental impact calculations
  const waterSaved = totalRecycled * 1000; // liters per item
  const energySaved = totalRecycled * 50; // kWh per item
  const landfillDiverted = totalRecycled * 0.5; // kg per item

  // Leaderboard data (mock for now)
  const leaderboardData = [
    { name: 'You', items: totalRecycled, rank: 1 },
    { name: 'Sarah M.', items: totalRecycled - 5, rank: 2 },
    { name: 'John D.', items: totalRecycled - 12, rank: 3 },
    { name: 'Emma W.', items: totalRecycled - 18, rank: 4 },
    { name: 'Mike R.', items: totalRecycled - 25, rank: 5 },
  ].sort((a, b) => b.items - a.items).map((item, index) => ({ ...item, rank: index + 1 }));

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
          </div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
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
                  Analytics Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">Track your environmental impact and recycling progress</p>
              </div>
            </div>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total EcoCoins</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{totalEcoCoins}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">+12% this month</span>
                    </p>
                  </div>
                  <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Items Recycled</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{totalRecycled}</p>
                    <p className={`text-xs flex items-center mt-1 ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {monthlyGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" /> : <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" />}
                      <span className="truncate">{Math.abs(monthlyGrowth).toFixed(1)}% this month</span>
                    </p>
                  </div>
                  <Recycle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">CO₂ Saved</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{co2Saved}kg</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <Leaf className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Environmental impact</span>
                    </p>
                  </div>
                  <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Badges Earned</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{badges.length}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <Award className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Achievements unlocked</span>
                    </p>
                  </div>
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm p-2 sm:p-3">
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Main</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs sm:text-sm p-2 sm:p-3">Trends</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm p-2 sm:p-3">
                <span className="hidden sm:inline">Categories</span>
                <span className="sm:hidden">Types</span>
              </TabsTrigger>
              <TabsTrigger value="impact" className="text-xs sm:text-sm p-2 sm:p-3">Impact</TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs sm:text-sm p-2 sm:p-3">
                <span className="hidden sm:inline">Leaderboard</span>
                <span className="sm:hidden">Ranks</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Recycling Activity Chart */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                      Recycling Activity
                    </CardTitle>
                    <CardDescription className="text-sm">Items recycled over time</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                      <AreaChart data={recyclingTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          fontSize={12}
                          tickMargin={8}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            fontSize: '12px',
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Area type="monotone" dataKey="items" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* EcoCoins Earned */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                      EcoCoins Earned
                    </CardTitle>
                    <CardDescription className="text-sm">Daily coin earnings</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                      <BarChart data={recyclingTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          fontSize={12}
                          tickMargin={8}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            fontSize: '12px',
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Bar dataKey="ecoCoins" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {wasteDetections.slice(0, 5).map((detection) => (
                      <div key={detection.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Recycle className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{detection.detected_item}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{detection.category}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-xs sm:text-sm font-medium text-primary">+{detection.eco_coins_earned} coins</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(detection.detected_at), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}

                    {wasteDetections.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No activity yet</p>
                        <p className="text-sm text-muted-foreground">Start recycling to see your activity here!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recycling Trends</CardTitle>
                    <CardDescription>Track your recycling patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={recyclingTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="items" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="ecoCoins" stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Environmental Impact</CardTitle>
                    <CardDescription>CO₂ savings over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={recyclingTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="co2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5" />
                      Category Distribution
                    </CardTitle>
                    <CardDescription>Types of items you recycle most</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                    <CardDescription>Breakdown by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(categoryData).map(([category, count], index) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{category}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{count} items</div>
                            <div className="text-sm text-muted-foreground">
                              {((count / totalRecycled) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Impact Tab */}
            <TabsContent value="impact" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold mb-2">{waterSaved.toLocaleString()}L</div>
                    <div className="text-sm text-muted-foreground">Water Saved</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold mb-2">{energySaved.toLocaleString()} kWh</div>
                    <div className="text-sm text-muted-foreground">Energy Saved</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Recycle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold mb-2">{landfillDiverted.toFixed(1)} kg</div>
                    <div className="text-sm text-muted-foreground">Landfill Diverted</div>
                  </CardContent>
                </Card>
              </div>

              {/* Goals Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Environmental Goals
                  </CardTitle>
                  <CardDescription>Track your progress towards sustainability goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Monthly Recycling Goal</span>
                      <span>{thisMonth.length}/20 items</span>
                    </div>
                    <Progress value={(thisMonth.length / 20) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CO₂ Reduction Goal</span>
                      <span>{co2Saved}/100 kg</span>
                    </div>
                    <Progress value={(co2Saved / 100) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>EcoCoin Target</span>
                      <span>{totalEcoCoins}/1000 coins</span>
                    </div>
                    <Progress value={(totalEcoCoins / 1000) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Community Leaderboard
                  </CardTitle>
                  <CardDescription>See how you rank among other eco-warriors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboardData.map((user, index) => (
                      <div 
                        key={user.name} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          user.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {user.rank}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.items} items recycled</p>
                          </div>
                          {user.name === 'You' && (
                            <Badge variant="secondary">You</Badge>
                          )}
                        </div>
                        {index < 3 && (
                          <Award className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            'text-amber-600'
                          }`} />
                        )}
                      </div>
                    ))}
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

export default Dashboard;
