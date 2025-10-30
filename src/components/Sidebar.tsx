import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useDatabase";
import { getLevelByCoins } from "@/lib/gamification";
import {
  Leaf,
  BarChart3,
  Camera,
  Gift,
  MapPin,
  TrendingUp,
  User,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Coins,
  Sparkles,
  Bot,
  Zap,
  Shield,
  Award,
  Calendar,
  Home,
  ChevronRight,
  Bell
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSectionNavigation = (sectionId: string) => {
    if (window.location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileOpen(false);
  };

  const menuItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: Home,
      onClick: () => navigate('/'),
      isActive: location.pathname === '/',
      badge: null,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      onClick: () => navigate('/dashboard'),
      isActive: location.pathname === '/dashboard',
      badge: null,
    },
    {
      id: 'ai-detection',
      label: 'AI Detection',
      icon: Bot,
      onClick: () => handleSectionNavigation('detect'),
      isActive: false,
      badge: 'AI',
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'ideas',
      label: 'Ideas',
      icon: Sparkles,
      onClick: () => navigate('/ideas'),
      isActive: location.pathname === '/ideas',
      badge: null,
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: Users,
      onClick: () => navigate('/leaderboard'),
      isActive: location.pathname === '/leaderboard',
      badge: null,
    },
    {
      id: 'store',
      label: 'Store',
      icon: Gift,
      onClick: () => navigate('/store'),
      isActive: location.pathname === '/store',
      badge: profile?.eco_coins?.toString(),
      badgeVariant: 'outline' as const,
    },
    {
      id: 'live',
      label: 'Live Tracking',
      icon: MapPin,
      onClick: () => navigate('/live'),
      isActive: location.pathname === '/live',
      badge: null,
    },
    {
      id: 'routes',
      label: 'Routes',
      icon: TrendingUp,
      onClick: () => navigate('/routes'),
      isActive: location.pathname === '/routes',
      badge: null,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      onClick: () => navigate('/notifications'),
      isActive: location.pathname === '/notifications',
      badge: null,
    },
    {
      id: 'receipts',
      label: 'Receipts',
      icon: Award,
      onClick: () => navigate('/receipts'),
      isActive: location.pathname === '/receipts',
      badge: null,
    },
    {
      id: 'chat',
      label: 'In-App Chat',
      icon: Shield,
      onClick: () => navigate('/chat'),
      isActive: location.pathname === '/chat',
      badge: null,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      onClick: () => navigate('/bookings'),
      isActive: location.pathname === '/bookings',
      badge: null,
    },
    {
      id: 'geo',
      label: 'Geo-Matching',
      icon: MapPin,
      onClick: () => navigate('/geo'),
      isActive: location.pathname === '/geo',
      badge: null,
    },
    {
      id: 'impact',
      label: 'Impact',
      icon: TrendingUp,
      onClick: () => handleSectionNavigation('impact'),
      isActive: false,
      badge: null,
    },
  ];

  const secondaryItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      onClick: () => navigate('/profile'),
      isActive: location.pathname === '/profile',
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar-background border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg truncate">
                EcoSmart AI
              </h1>
              <p className="text-xs text-sidebar-foreground/60">Intelligent E-Waste</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex hover:bg-sidebar-accent"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-primary text-white text-sm">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || 'Anonymous User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-sidebar-foreground/70">
                    {profile?.eco_coins || 0} EcoCoins
                  </span>
                </div>
                <div className="mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {getLevelByCoins(profile?.eco_coins || 0).level} Level
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-2 px-2">
          {menuItems.map((item) => (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={item.onClick}
                    className={`w-full justify-start gap-3 h-11 ${
                      item.isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-sm' 
                        : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground'
                    } ${isCollapsed ? 'px-2' : 'px-3'}`}
                  >
                    <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badgeVariant || 'secondary'} 
                            className="text-xs px-1.5 py-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <Badge variant={item.badgeVariant || 'secondary'} className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>

        <Separator className="my-4 mx-2" />

        {/* AI Features Section */}
        <div className="px-2">
          {!isCollapsed && (
            <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider mb-2 px-3">
              AI Features
            </p>
          )}
          <div className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => handleSectionNavigation('detect')}
                    className={`w-full justify-start gap-3 h-10 hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground ${
                      isCollapsed ? 'px-2' : 'px-3'
                    }`}
                  >
                    <Sparkles className={`${isCollapsed ? 'w-4 h-4' : 'w-3 h-3'} flex-shrink-0 text-primary`} />
                    {!isCollapsed && <span className="text-sm">Smart Detection</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">Smart Detection</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => handleSectionNavigation('impact')}
                    className={`w-full justify-start gap-3 h-10 hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground ${
                      isCollapsed ? 'px-2' : 'px-3'
                    }`}
                  >
                    <Shield className={`${isCollapsed ? 'w-4 h-4' : 'w-3 h-3'} flex-shrink-0 text-secondary`} />
                    {!isCollapsed && <span className="text-sm">Impact Analysis</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">Impact Analysis</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Separator className="my-4 mx-2" />

        {/* Secondary Navigation */}
        <nav className="space-y-2 px-2">
          {secondaryItems.map((item) => (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={item.onClick}
                    className={`w-full justify-start gap-3 h-10 ${
                      item.isActive 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                        : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground'
                    } ${isCollapsed ? 'px-2' : 'px-3'}`}
                  >
                    <item.icon className={`${isCollapsed ? 'w-4 h-4' : 'w-3 h-3'} flex-shrink-0`} />
                    {!isCollapsed && <span className="text-sm">{item.label}</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{item.label}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
      </div>

      {/* Footer */}
      {user && (
        <div className="p-4 border-t border-sidebar-border">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className={`w-full justify-start gap-3 h-10 text-red-400 hover:text-red-300 hover:bg-red-500/10 ${
                    isCollapsed ? 'px-2' : 'px-3'
                  }`}
                >
                  <LogOut className={`${isCollapsed ? 'w-4 h-4' : 'w-3 h-3'} flex-shrink-0`} />
                  {!isCollapsed && <span className="text-sm">Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Sign Out</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen sticky top-0 ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ${className}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar-background border-b border-sidebar-border backdrop-blur-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg">
              EcoSmart AI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <div className="flex items-center gap-2 mr-3">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{profile?.eco_coins || 0}</span>
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-primary text-white text-xs">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
              className="hover:bg-sidebar-accent"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar-background" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-lg ">
                  EcoSmart AI
                </h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
                className="hover:bg-sidebar-accent"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="h-full overflow-hidden">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
