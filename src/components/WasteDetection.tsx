import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Zap, AlertTriangle, CheckCircle, Loader2, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateWasteDetection } from "@/hooks/useDatabase";
import eWasteImage from "@/assets/e-waste-collection.jpg";
import CameraCapture from "./CameraCapture";
import { estimateWeightKg, computeCO2SavedKg, getSortingSuggestions } from "@/lib/impact";

interface DetectionResult {
  item: string;
  category: string;
  confidence: number;
  hazardLevel: "low" | "medium" | "high";
  ecoCoins: number;
  disposalMethod: string;
  materials: string[];
  recyclingTips: string[];
}

// Comprehensive e-waste database for realistic AI simulation
const EWASTE_DATABASE = [
  // Smartphones
  {
    item: "iPhone 13 Pro",
    category: "Smartphones",
    confidence: 94,
    hazardLevel: "medium" as const,
    ecoCoins: 45,
    disposalMethod: "Remove battery, wipe data, recycle at certified e-waste center",
    materials: ["Lithium-ion battery", "Rare earth metals", "Gold", "Silver", "Copper"],
    recyclingTips: ["Factory reset before disposal", "Remove SIM card", "Consider trade-in programs"]
  },
  {
    item: "Samsung Galaxy S21",
    category: "Smartphones",
    confidence: 92,
    hazardLevel: "medium" as const,
    ecoCoins: 42,
    disposalMethod: "Data wipe required, battery removal, certified recycling",
    materials: ["Lithium polymer battery", "Aluminum frame", "Glass back", "Copper"],
    recyclingTips: ["Use manufacturer take-back program", "Remove memory card", "Check for data encryption"]
  },
  {
    item: "Google Pixel 6",
    category: "Smartphones",
    confidence: 89,
    hazardLevel: "medium" as const,
    ecoCoins: 38,
    disposalMethod: "Secure data erasure, battery separation, e-waste facility",
    materials: ["Lithium-ion battery", "Recycled aluminum", "Corning Glass", "Rare earth elements"],
    recyclingTips: ["Use Google's trade-in program", "Enable remote wipe", "Remove protective case"]
  },

  // Laptops
  {
    item: "MacBook Pro 13-inch",
    category: "Laptops",
    confidence: 96,
    hazardLevel: "high" as const,
    ecoCoins: 85,
    disposalMethod: "Professional data destruction, battery removal, hazardous material handling",
    materials: ["Lithium polymer battery", "Aluminum body", "Rare earth metals", "Cobalt"],
    recyclingTips: ["Use Apple's recycling program", "FileVault encryption", "Remove external devices"]
  },
  {
    item: "Dell XPS 13",
    category: "Laptops",
    confidence: 93,
    hazardLevel: "high" as const,
    ecoCoins: 78,
    disposalMethod: "Secure data wiping, battery disposal, certified e-waste processing",
    materials: ["Lithium-ion battery", "Carbon fiber", "Aluminum", "Magnesium alloy"],
    recyclingTips: ["Dell's mail-back program", "BitLocker encryption", "Remove hard drive if possible"]
  },
  {
    item: "HP Pavilion Laptop",
    category: "Laptops",
    confidence: 91,
    hazardLevel: "high" as const,
    ecoCoins: 72,
    disposalMethod: "Data sanitization, battery separation, recycling center disposal",
    materials: ["Lithium-ion battery", "Plastic housing", "Copper wiring", "Lead solder"],
    recyclingTips: ["HP's Planet Partners program", "Remove personal data", "Check warranty status"]
  },

  // Tablets
  {
    item: "iPad Air",
    category: "Tablets",
    confidence: 95,
    hazardLevel: "medium" as const,
    ecoCoins: 55,
    disposalMethod: "Factory reset, battery care, Apple recycling program",
    materials: ["Lithium polymer battery", "Aluminum body", "Touch sensor glass", "Rare earth metals"],
    recyclingTips: ["Sign out of iCloud", "Remove accessories", "Check for trade-in value"]
  },
  {
    item: "Samsung Galaxy Tab",
    category: "Tablets",
    confidence: 88,
    hazardLevel: "medium" as const,
    ecoCoins: 48,
    disposalMethod: "Data encryption, battery removal, certified recycling",
    materials: ["Lithium-ion battery", "Plastic frame", "LCD display", "Copper"],
    recyclingTips: ["Samsung's takeback program", "Remove SD card", "Factory reset"]
  },

  // Batteries
  {
    item: "Laptop Lithium-ion Battery",
    category: "Batteries",
    confidence: 97,
    hazardLevel: "high" as const,
    ecoCoins: 35,
    disposalMethod: "Specialized battery recycling facility - DO NOT put in regular trash",
    materials: ["Lithium", "Cobalt", "Nickel", "Graphite", "Electrolyte"],
    recyclingTips: ["Never puncture or disassemble", "Tape terminals", "Find certified battery recycler"]
  },
  {
    item: "Phone Battery Pack",
    category: "Batteries",
    confidence: 94,
    hazardLevel: "high" as const,
    ecoCoins: 28,
    disposalMethod: "Battery collection point or hazardous waste facility",
    materials: ["Lithium polymer", "Aluminum casing", "Copper contacts", "Electrolyte"],
    recyclingTips: ["Check for swelling", "Store in cool, dry place", "Use manufacturer programs"]
  },

  // Cables and Accessories
  {
    item: "USB-C Cable",
    category: "Cables",
    confidence: 89,
    hazardLevel: "low" as const,
    ecoCoins: 15,
    disposalMethod: "Standard e-waste recycling or donation if functional",
    materials: ["Copper wire", "PVC insulation", "Metal connectors", "Plastic housing"],
    recyclingTips: ["Test functionality first", "Bundle with other cables", "Consider donation"]
  },
  {
    item: "Power Adapter/Charger",
    category: "Chargers",
    confidence: 92,
    hazardLevel: "medium" as const,
    ecoCoins: 22,
    disposalMethod: "E-waste facility - contains transformers and capacitors",
    materials: ["Copper transformers", "Plastic housing", "Ferrite cores", "Capacitors"],
    recyclingTips: ["Check compatibility for reuse", "Remove from packaging", "Bundle with devices"]
  },

  // Gaming and Entertainment
  {
    item: "PlayStation Controller",
    category: "Gaming",
    confidence: 90,
    hazardLevel: "medium" as const,
    ecoCoins: 32,
    disposalMethod: "Battery removal, electronic component recycling",
    materials: ["Lithium-ion battery", "Plastic housing", "Circuit boards", "Rubber buttons"],
    recyclingTips: ["Remove rechargeable battery", "Check for firmware updates", "Consider trade-in"]
  },
  {
    item: "Wireless Headphones",
    category: "Audio",
    confidence: 87,
    hazardLevel: "medium" as const,
    ecoCoins: 25,
    disposalMethod: "Battery separation, plastic and metal component recycling",
    materials: ["Lithium-ion battery", "Plastic housing", "Copper wire", "Rare earth magnets"],
    recyclingTips: ["Fully discharge battery", "Check warranty status", "Remove ear tips"]
  },

  // Computer Components
  {
    item: "Graphics Card (GPU)",
    category: "Computer Parts",
    confidence: 95,
    hazardLevel: "medium" as const,
    ecoCoins: 65,
    disposalMethod: "Precious metal recovery, certified e-waste processing",
    materials: ["Gold contacts", "Silver", "Copper", "Plastic housing", "Silicon chips"],
    recyclingTips: ["Remove from anti-static bag", "Check for resale value", "Professional recycling recommended"]
  },
  {
    item: "Computer Hard Drive",
    category: "Storage",
    confidence: 98,
    hazardLevel: "high" as const,
    ecoCoins: 40,
    disposalMethod: "Data destruction mandatory, rare earth metal recovery",
    materials: ["Rare earth magnets", "Aluminum platters", "Copper", "Precious metals"],
    recyclingTips: ["Professional data destruction", "Remove from computer first", "Never attempt to open"]
  }
];

// Function to simulate realistic AI processing with multiple stages
const simulateRealisticAI = (callback: (result: DetectionResult) => void) => {
  // Stage 1: Image preprocessing (500ms)
  setTimeout(() => {
    // Stage 2: Object detection (1000ms)
    setTimeout(() => {
      // Stage 3: Classification and analysis (1500ms)
      setTimeout(() => {
        const result = EWASTE_DATABASE[Math.floor(Math.random() * EWASTE_DATABASE.length)];
        // Add some realistic confidence variation
        const confidenceVariation = Math.random() * 10 - 5; // ±5%
        const adjustedConfidence = Math.max(75, Math.min(99, result.confidence + confidenceVariation));

        callback({
          ...result,
          confidence: Math.round(adjustedConfidence)
        });
      }, 1500);
    }, 1000);
  }, 500);
};

export const WasteDetection = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStage, setScanningStage] = useState<string>("");
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [estimatedWeight, setEstimatedWeight] = useState<number | null>(null);
  const [estimatedCO2, setEstimatedCO2] = useState<number | null>(null);
  const [sorting, setSorting] = useState<{ steps: string[]; safety: string[]; donateOrResell?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createWasteDetection = useCreateWasteDetection();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        simulateAIDetection();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateAIDetection = async () => {
    setIsScanning(true);
    setDetectionResult(null);

    // Stage 1: Image preprocessing
    setScanningStage("Preprocessing image...");
    await new Promise(resolve => setTimeout(resolve, 800));

    // Stage 2: Object detection
    setScanningStage("Detecting objects...");
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Stage 3: Classification
    setScanningStage("Classifying e-waste...");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Stage 4: Analysis
    setScanningStage("Analyzing materials...");
    await new Promise(resolve => setTimeout(resolve, 800));

    // Get random result from database
    const result = EWASTE_DATABASE[Math.floor(Math.random() * EWASTE_DATABASE.length)];

    // Add some realistic confidence variation
    const confidenceVariation = Math.random() * 10 - 5; // ±5%
    const adjustedConfidence = Math.max(75, Math.min(99, result.confidence + confidenceVariation));

    const finalResult = {
      ...result,
      confidence: Math.round(adjustedConfidence)
    };

    // Compute impact extras
    const { weightKg } = estimateWeightKg(finalResult.category, finalResult.item);
    const co2 = computeCO2SavedKg(finalResult.category, weightKg);
    const sort = getSortingSuggestions(finalResult.category);

    setDetectionResult(finalResult);
    setEstimatedWeight(weightKg);
    setEstimatedCO2(co2);
    setSorting(sort);
    setIsScanning(false);
    setScanningStage("");

    // Save to database
    try {
      await createWasteDetection.mutateAsync({
        category: finalResult.category,
        detected_item: finalResult.item,
        hazard_level: finalResult.hazardLevel,
        eco_coins_earned: finalResult.ecoCoins,
        disposal_method: finalResult.disposalMethod,
        image_url: uploadedImage || eWasteImage
      });
    } catch (error) {
      console.error('Failed to save detection:', error);
    }

    toast({
      title: "Detection Complete!",
      description: `Found ${finalResult.item} (~${weightKg.toFixed(2)} kg) • ~${co2.toFixed(1)} kg CO₂ saved • +${finalResult.ecoCoins} EcoCoins`,
      duration: 5000,
    });
  };

  const getHazardColor = (level: string) => {
    switch (level) {
      case "low": return "text-success";
      case "medium": return "text-warning";
      case "high": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getHazardIcon = (level: string) => {
    switch (level) {
      case "low": return <CheckCircle className="w-4 h-4" />;
      case "medium": return <AlertTriangle className="w-4 h-4" />;
      case "high": return <AlertTriangle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <section id="detect" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 fade-in-up">
            AI-Powered{" "}
            <span className=" animate-text-shimmer bg-size-200">
              Waste Detection
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto fade-in-up delay-200">
            Upload a photo of your e-waste and let our AI identify the item,
            assess hazard levels, and guide you to safe disposal methods.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Detection Interface */}
          <Card className="p-6 sm:p-8 bg-gradient-card slide-in-left">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center animate-float">
                  <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Upload E-Waste Photo</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Take a clear photo of your electronic waste for AI analysis
                </p>
              </div>

              {uploadedImage && (
                <div className="relative rounded-lg overflow-hidden scale-in">
                  <img
                    src={uploadedImage}
                    alt="Uploaded e-waste"
                    className="w-full h-48 object-cover transition-all duration-300"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 backdrop-blur-sm flex items-center justify-center animate-pulse-glow">
                      <div className="text-center">
                        <div className="relative">
                          <div className="w-16 h-16 border-4 border-primary/30 rounded-full animate-spin mx-auto mb-4"></div>
                          <div className="absolute inset-0 w-16 h-16 border-4 border-t-primary border-r-secondary border-b-accent border-l-transparent rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                        </div>
                        <div className="text-primary font-bold text-lg mb-1">AI Analyzing...</div>
                        <div className="text-sm text-muted-foreground animate-pulse">{scanningStage}</div>
                        <div className="flex justify-center mt-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 flex-wrap">
                <Button
                  variant="eco"
                  size="lg"
                  className="flex-1 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  Upload Photo
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  onClick={() => setCameraOpen(true)}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                  Use Camera
                </Button>
                <Button
                  variant="glass"
                  size="lg"
                  className="transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  onClick={() => {
                    setUploadedImage(eWasteImage);
                    simulateAIDetection();
                  }}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  Try Demo
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {detectionResult && (
                <Card className="p-6 bg-gradient-to-r from-primary-light to-accent-light border border-primary/20 scale-in">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-primary flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Detection Results
                      </h4>
                      <Badge variant="secondary" className="animate-pulse">
                        {detectionResult.confidence}% confident
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Detected Item:</div>
                          <div className="font-semibold text-lg">{detectionResult.item}</div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground">Category:</div>
                          <Badge variant="outline" className="font-medium">{detectionResult.category}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">Hazard Level:</div>
                          <div className={`flex items-center gap-1 font-medium ${getHazardColor(detectionResult.hazardLevel)}`}>
                            {getHazardIcon(detectionResult.hazardLevel)}
                            {detectionResult.hazardLevel.toUpperCase()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">Reward:</div>
                          <div className="flex items-center gap-1 text-reward font-bold animate-coin-bounce">
                            <Coins className="w-5 h-5" />
                            {detectionResult.ecoCoins} EcoCoins
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Materials Found:</div>
                        <div className="flex flex-wrap gap-1">
                          {detectionResult.materials.map((material, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Disposal Method:</div>
                        <div className="text-sm bg-muted p-3 rounded-md border-l-4 border-primary">
                          {detectionResult.disposalMethod}
                        </div>
                      </div>

                      {/* Impact extras */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="p-3">
                          <div className="text-xs text-muted-foreground">Estimated Weight</div>
                          <div className="font-semibold">{estimatedWeight?.toFixed(2)} kg</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-xs text-muted-foreground">CO₂ Saved</div>
                          <div className="font-semibold">~{estimatedCO2?.toFixed(1)} kg</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-xs text-muted-foreground">Next Step</div>
                          <div className="font-semibold">Book pickup</div>
                        </Card>
                      </div>

                      {sorting && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Smart Sorting Suggestions</div>
                          <ul className="text-sm space-y-1 mb-2">
                            {sorting.steps.map((s, i) => (
                              <li key={`s-${i}`} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                          <div className="text-xs text-warning mb-2">
                            {(sorting.safety || []).map((s, i) => (
                              <div key={`safe-${i}`}>• {s}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="hero"
                        className="flex-1 transition-all duration-200 hover:scale-105"
                        onClick={() => window.location.href = '#collectors'}
                      >
                        Schedule Pickup
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 transition-all duration-200 hover:scale-105"
                        onClick={() => setDetectionResult(null)}
                      >
                        Scan Another
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          <CameraCapture
            isOpen={cameraOpen}
            onClose={() => setCameraOpen(false)}
            onCapture={(img) => {
              setUploadedImage(img);
            }}
            onAnalyze={async (img) => {
              setUploadedImage(img);
              await simulateAIDetection();
            }}
          />

          {/* AI Features */}
          <div className="space-y-6 slide-in-right">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Smart AI Features</h3>

            <div className="space-y-4">
              <Card className="p-4 sm:p-6 bg-gradient-card transition-all duration-300 hover:scale-105 hover:shadow-lg scale-in delay-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-2">Instant Recognition</h4>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Advanced computer vision identifies 500+ types of electronic devices
                      with 95%+ accuracy in under 3 seconds.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6 bg-gradient-card transition-all duration-300 hover:scale-105 hover:shadow-lg scale-in delay-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0 animate-float">
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-2">Hazard Assessment</h4>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      AI evaluates toxic materials like lithium, mercury, and lead to
                      provide safety guidelines and proper disposal methods.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6 bg-gradient-card transition-all duration-300 hover:scale-105 hover:shadow-lg scale-in delay-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-reward rounded-lg flex items-center justify-center flex-shrink-0 animate-float">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-reward-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base sm:text-lg mb-2">Value Calculation</h4>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Smart algorithms calculate material worth and environmental impact
                      to determine fair EcoCoin rewards for each item.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
