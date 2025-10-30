import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useDatabase";
import { Leaf, Menu, X, LogOut, User, Settings, Coins, BarChart3 } from "lucide-react";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSectionNavigation = (sectionId: string) => {
    // If we're not on the home page, navigate to home first then scroll
    if (window.location.pathname !== '/') {
      navigate('/', { state: { scrollTo: sectionId } });
    } else {
      // If we're on home page, just scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-card backdrop-blur-md border-b border-white/20 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg  truncate">
              EcoSmart Cycle
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <button onClick={() => navigate('/dashboard')} className="text-foreground/80 hover:text-primary transition-all duration-200 text-sm font-medium">
              Dashboard
            </button>
            <button onClick={() => handleSectionNavigation('detect')} className="text-foreground/80 hover:text-primary transition-all duration-200 text-sm font-medium">
              AI Detection
            </button>
            <button onClick={() => handleSectionNavigation('rewards')} className="text-foreground/80 hover:text-primary transition-all duration-200 text-sm font-medium">
              Rewards
            </button>
            <button onClick={() => handleSectionNavigation('collectors')} className="text-foreground/80 hover:text-primary transition-all duration-200 text-sm font-medium">
              Collectors
            </button>
            <button onClick={() => handleSectionNavigation('impact')} className="text-foreground/80 hover:text-primary transition-all duration-200 text-sm font-medium">
              Impact
            </button>
            
            {user && (
              <div className="hidden md:flex items-center gap-2 lg:gap-3">
                <div className="flex items-center gap-1 lg:gap-2 text-sm">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{profile?.eco_coins || 0}</span>
                  <span className="text-muted-foreground hidden lg:inline">EcoCoins</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                        <AvatarFallback className="bg-gradient-primary text-white text-sm">
                          {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{profile?.full_name || 'Anonymous'}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && (
              <div className="flex items-center gap-2 md:hidden">
                <div className="flex items-center gap-1 text-xs">
                  <Coins className="w-3 h-3 text-yellow-500" />
                  <span className="font-medium">{profile?.eco_coins || 0}</span>
                </div>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-primary text-white text-xs">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-white/20 bg-gradient-card/95 backdrop-blur-md">
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => {
                  navigate('/dashboard');
                  setIsOpen(false);
                }}
                className="text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all duration-200 text-left p-3 rounded-md font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleSectionNavigation('detect')}
                className="text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all duration-200 text-left p-3 rounded-md font-medium"
              >
                AI Detection
              </button>
              <button
                onClick={() => handleSectionNavigation('rewards')}
                className="text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all duration-200 text-left p-3 rounded-md font-medium"
              >
                Rewards
              </button>
              <button
                onClick={() => handleSectionNavigation('collectors')}
                className="text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all duration-200 text-left p-3 rounded-md font-medium"
              >
                Collectors
              </button>
              <button
                onClick={() => handleSectionNavigation('impact')}
                className="text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all duration-200 text-left p-3 rounded-md font-medium"
              >
                Impact
              </button>

              {user && (
                <div className="space-y-2 pt-4 mt-2 border-t border-white/20">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-primary text-white text-sm">
                          {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[120px]">
                          {profile?.full_name || user.email}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Coins className="w-3 h-3 text-yellow-500" />
                          <span>{profile?.eco_coins || 0} coins</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleProfileClick();
                        setIsOpen(false);
                      }}
                      className="justify-center"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                      className="justify-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
