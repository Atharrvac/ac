import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from "@/components/HeroSection";
import { WasteDetection } from "@/components/WasteDetection";
import { RewardsSection } from "@/components/RewardsSection";
import { CollectorServices } from "@/components/CollectorServices";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Handle scrolling to section when navigating from other pages
  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      const timer = setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100); // Small delay to ensure page is fully loaded

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
          </div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <WasteDetection />
        <RewardsSection />
        <CollectorServices />
        <ImpactDashboard />
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
