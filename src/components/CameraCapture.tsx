import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  X, 
  RotateCcw, 
  Download, 
  Check,
  Loader2,
  Zap,
  SwitchCamera,
  FlashlightOff,
  Flashlight
} from "lucide-react";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  onAnalyze?: (imageData: string) => void;
}

export const CameraCapture = ({ isOpen, onClose, onCapture, onAnalyze }: CameraCaptureProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      toast({
        title: "Camera Access Failed",
        description: "Please allow camera access to take photos of your e-waste.",
        variant: "destructive",
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  }, [isStreaming, stopCamera, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply camera effects
    ctx.filter = 'contrast(1.1) brightness(1.05)';
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    
    toast({
      title: "Photo Captured!",
      description: "E-waste photo captured successfully. Ready for AI analysis.",
    });
  }, [toast]);

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const analyzePhoto = async () => {
    if (!capturedImage || !onAnalyze) return;
    
    setIsAnalyzing(true);
    try {
      await onAnalyze(capturedImage);
      handleClose();
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadPhoto = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.download = `ewaste-${Date.now()}.jpg`;
    link.href = capturedImage;
    link.click();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setIsAnalyzing(false);
    onClose();
  };

  // Start camera when dialog opens
  React.useEffect(() => {
    if (isOpen && !isStreaming && !capturedImage) {
      startCamera();
    }
  }, [isOpen, isStreaming, capturedImage, startCamera]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            AI E-Waste Detection Camera
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          {!capturedImage ? (
            // Camera View
            <div className="relative bg-black rounded-lg mx-6 mb-6 overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-[400px] object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Camera overlay */}
              <div className="absolute inset-0 border-2 border-primary/30 rounded-lg">
                {/* Scanning grid */}
                <div className="absolute inset-4 border border-primary/20 rounded">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br"></div>
                </div>
                
                {/* Center focus indicator */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 border-2 border-primary rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Camera controls overlay */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant="secondary" className="bg-black/50 text-white border-0">
                  AI Ready
                </Badge>
                {isStreaming && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </Badge>
                )}
              </div>

              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                >
                  <SwitchCamera className="w-4 h-4" />
                </Button>
              </div>

              {/* Bottom controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="bg-black/50 hover:bg-black/70 text-white border-white/20"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                
                <Button
                  onClick={capturePhoto}
                  disabled={!isStreaming}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-16 h-16 rounded-full"
                >
                  <Camera className="w-6 h-6" />
                </Button>

                <div className="w-20" /> {/* Spacer for symmetry */}
              </div>
            </div>
          ) : (
            // Captured Image View
            <div className="mx-6 mb-6">
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <img
                  src={capturedImage}
                  alt="Captured e-waste"
                  className="w-full h-[400px] object-cover"
                />
                
                {/* Analysis overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                      <p className="text-lg font-medium">AI Analyzing Image...</p>
                      <p className="text-sm text-white/70">Detecting e-waste materials</p>
                    </div>
                  </div>
                )}
                
                {/* Success indicator */}
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" />
                    Captured
                  </Badge>
                </div>
              </div>

              {/* Photo actions */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={isAnalyzing}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>

                <Button
                  variant="outline"
                  onClick={downloadPhoto}
                  disabled={isAnalyzing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>

                {onAnalyze ? (
                  <Button
                    onClick={analyzePhoto}
                    disabled={isAnalyzing}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                  </Button>
                ) : (
                  <Button
                    onClick={confirmPhoto}
                    disabled={isAnalyzing}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use Photo
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
