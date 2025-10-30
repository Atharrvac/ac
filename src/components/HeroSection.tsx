import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scan, Leaf, Coins, Truck } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const HeroSection = () => {
  return (
    <section className="pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight fade-in-up">
                Turn{" "}
                <span className=" animate-text-shimmer bg-size-200">
                  E-Waste
                </span>{" "}
                into{" "}
                <span className="">
                  EcoCoins
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 fade-in-up delay-200">
                AI-powered waste detection meets rewarding recycling. Snap, analyze,
                and get rewarded for saving our planet, one device at a time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start fade-in-up delay-300">
              <Button variant="hero" size="xl" className="w-full sm:w-auto transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <Scan className="w-5 h-5" />
                Start Detecting
              </Button>
              <Button variant="glass" size="xl" className="w-full sm:w-auto transition-all duration-200 hover:scale-105">
                Learn More
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-6 sm:pt-8">
              <Card className="p-3 sm:p-4 text-center bg-gradient-card scale-in delay-100 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg mx-auto mb-2 flex items-center justify-center animate-float">
                  <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-primary">500+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Tons Recycled</div>
              </Card>
              <Card className="p-3 sm:p-4 text-center bg-gradient-card scale-in delay-200 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-reward rounded-lg mx-auto mb-2 flex items-center justify-center animate-float">
                  <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-reward-foreground animate-coin-bounce" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-reward">50K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">EcoCoins Earned</div>
              </Card>
              <Card className="p-3 sm:p-4 text-center bg-gradient-card scale-in delay-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-secondary rounded-lg mx-auto mb-2 flex items-center justify-center animate-float">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-secondary">200+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Pickups Today</div>
              </Card>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img 
                src={heroImage} 
                alt="AI-powered e-waste detection" 
                className="w-full h-[500px] md:h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-primary/20"></div>
              
              {/* Floating Elements */}
              <div className="absolute top-4 right-4 bg-gradient-card backdrop-blur-md rounded-lg p-3 animate-pulse-glow">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">AI Scanning...</span>
                </div>
              </div>
              
              <div className="absolute bottom-4 left-4 bg-gradient-card backdrop-blur-md rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Detected:</div>
                <div className="font-semibold text-primary">Smartphone - High Value</div>
                <div className="text-xs text-success">+50 EcoCoins Available</div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-reward rounded-full opacity-80 animate-coin-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
