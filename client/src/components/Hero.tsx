import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Download, PawPrint, X, Coins, AlertTriangle, Share2, Maximize2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CheckoutDialog from "./CheckoutDialog";
import AuthDialog from "./AuthDialog";
import ExamplesModal from "./ExamplesModal";
import VideoCollage from "./VideoCollage";
import { PRODUCTS } from "@/lib/products";
import { useAuth } from "@/contexts/AuthContext";

// Use public assets
const heroImage = "/assets/hero.png";
const demoVideo = "/assets/demo-video.mp4";
const carGoldenImg = "/assets/CarGolden.png";
const drivingDogImg = "/assets/DrivingDog.png";
const greatDaneImg = "/assets/greatdane.jpg";
const germanShepImg = "/assets/GermanShep.png";

const useCases = [
  "Content Creation",
  "Business Advertising",
  "Adoption or Rescues",
  "Personal Messages",
  "Social Media",
];

const sampleVideos = [
  {
    videoUrl: "/videos/video17.mp4",
    thumbnailUrl: "/thumbnails/video17.jpg",
    title: "Happy Pup",
  },
  {
    videoUrl: "/videos/video15.mp4",
    thumbnailUrl: "/thumbnails/video15.jpg",
    title: "Excited Dog",
  },
  {
    videoUrl: "/videos/video20.mp4",
    thumbnailUrl: "/thumbnails/video20.jpg",
    title: "Talking Dog",
  },
  {
    videoUrl: "/videos/video3.mp4",
    thumbnailUrl: "/thumbnails/video3.jpg",
    title: "Playful Dog",
  },
  {
    videoUrl: "/videos/video19.mp4",
    thumbnailUrl: "/thumbnails/video19.jpg",
    title: "Smiling Dog",
  },
];

export default function Hero() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [voiceStyle, setVoiceStyle] = useState("");
  const [action, setAction] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentUseCaseIndex, setCurrentUseCaseIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false); // TODO: Set back to false
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remainingMinutes: number; message: string } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ priceId: string; name: string } | null>(null);
  const [credits, setCredits] = useState(0);
  const [examplesModalOpen, setExamplesModalOpen] = useState(false);
  const [examplesModalType, setExamplesModalType] = useState<"voice" | "action">("voice");
  const { toast } = useToast();

  // Fetch user credit balance
  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      setCredits(data.credits || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  // Fetch credits on mount and after checkout
  useEffect(() => {
    fetchCredits();

    // Listen for credit updates from promo codes or purchases
    const handleCreditsUpdate = () => {
      fetchCredits();
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdate);

    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate);
    };
  }, []);

  // Handle opening checkout dialog
  const handleOpenCheckout = (product: { priceId: string; name: string }) => {
    if (!user) {
      // Show auth dialog if user is not logged in
      setAuthDialogOpen(true);
      // Store the product they wanted to buy
      setSelectedProduct({ priceId: product.priceId, name: product.name });
      return;
    }

    // User is logged in, proceed with checkout
    setSelectedProduct(product);
    setCheckoutOpen(true);
  };

  // Handle auth success - open checkout after user signs in
  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    // After successful auth, open checkout with the selected product
    if (selectedProduct) {
      setCheckoutOpen(true);
    }
  };

  // Handle checkout dialog close
  const handleCheckoutClose = (open: boolean) => {
    setCheckoutOpen(open);
    if (!open) {
      // Refresh credits when dialog closes
      fetchCredits();
    }
  };

  // Handle opening examples modal
  const handleOpenExamples = (type: "voice" | "action") => {
    setExamplesModalType(type);
    setExamplesModalOpen(true);
  };

  // Handle example selection from modal
  const handleExampleSelect = (value: string) => {
    if (examplesModalType === "voice") {
      setVoiceStyle(value);
    } else {
      setAction(value);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUseCaseIndex((prev) => (prev + 1) % useCases.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle ESC key to close generated video
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && generatedVideoUrl) {
        setGeneratedVideoUrl(null);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [generatedVideoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setGeneratedVideoUrl(null);
      setError(null);
    }
  };

  // Helper function to detect image aspect ratio
  const detectAspectRatio = (file: File): Promise<"16:9" | "9:16" | "1:1"> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        console.log(`📸 Image dimensions: ${img.width}x${img.height}, ratio: ${ratio.toFixed(2)}`);

        // Calculate distance to each standard aspect ratio
        const aspectRatios = {
          "16:9": 16 / 9,   // 1.778
          "1:1": 1.0,       // 1.0
          "9:16": 9 / 16,   // 0.5625
        };

        // Find the closest matching aspect ratio
        let closestRatio: "16:9" | "9:16" | "1:1" = "16:9";
        let minDistance = Infinity;

        for (const [format, standardRatio] of Object.entries(aspectRatios)) {
          const distance = Math.abs(ratio - standardRatio);
          if (distance < minDistance) {
            minDistance = distance;
            closestRatio = format as "16:9" | "9:16" | "1:1";
          }
        }

        console.log(`📐 Image ratio ${ratio.toFixed(2)} → closest match: ${closestRatio} (distance: ${minDistance.toFixed(3)})`);
        resolve(closestRatio);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent, useCredit: boolean = false) => {
    e.preventDefault();

    if (!selectedFile || !prompt) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);

    // Scroll to top when generation starts
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // Detect the aspect ratio from the uploaded image
      const aspectRatio = await detectAspectRatio(selectedFile);
      console.log(`Detected aspect ratio: ${aspectRatio}`);

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', prompt);
      formData.append('aspectRatio', aspectRatio);
      formData.append('useCredit', useCredit.toString());
      if (voiceStyle.trim()) {
        formData.append('voiceStyle', voiceStyle.trim());
      }
      if (action.trim()) {
        formData.append('action', action.trim());
      }

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        setRateLimitInfo({
          remainingMinutes: data.remainingMinutes || 0,
          message: data.message || 'Please wait before generating another video.'
        });
        setIsGenerating(false);
        // Scroll to top to show rate limit message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast({
          title: "Rate limit reached",
          description: data.message,
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      // Clear rate limit info on successful generation
      setRateLimitInfo(null);

      const operationId = data.id;
      
      toast({
        title: "Video generation started!",
        description: "This may take 2-3 minutes. Please wait...",
      });

      const pollingInterval = 10000; // 10 seconds
      let attempts = 0;
      const maxAttempts = 60; // 60 attempts × 10s = 10 minutes (Veo can take 2-7 minutes)

      const pollStatus = async () => {
        try {
          attempts++;

          const statusResponse = await fetch(`/api/video-status/${operationId}`);
          
          if (!statusResponse.ok) {
            const errorData = await statusResponse.json().catch(() => ({ error: 'Failed to check status' }));
            throw new Error(errorData.error || 'Failed to check video status');
          }

          const statusData = await statusResponse.json();
          console.log("Poll status response:", statusData);

          if (statusData.status === 'completed') {
            console.log("Video completed! URL:", statusData.videoUrl);
            setGeneratedVideoUrl(statusData.videoUrl);
            setIsGenerating(false);
            setError(null);
            // Refresh credit balance
            fetchCredits();
            // Scroll to top to show the video
            window.scrollTo({ top: 0, behavior: 'smooth' });
            toast({
              title: "Video ready!",
              description: "Your video has been generated successfully.",
            });
          } else if (statusData.status === 'failed') {
            throw new Error(statusData.error || 'Video generation failed');
          } else if (attempts >= maxAttempts) {
            throw new Error('Video generation timed out. Please try again.');
          } else {
            setTimeout(pollStatus, pollingInterval);
          }
        } catch (pollErr: any) {
          setError(pollErr.message || 'Failed to check video status');
          setIsGenerating(false);
          toast({
            title: "Error",
            description: pollErr.message || 'Failed to check video status',
            variant: "destructive",
          });
        }
      };

      setTimeout(pollStatus, pollingInterval);

    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the video');
      setIsGenerating(false);
      toast({
        title: "Error",
        description: err.message || 'Failed to generate video',
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (generatedVideoUrl) {
      try {
        const response = await fetch(generatedVideoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'talking-dog-video.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download failed:', error);
        toast({
          title: "Download failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    }
  };

  const handleShare = async () => {
    if (generatedVideoUrl) {
      try {
        // Check if Web Share API is available
        if (navigator.share) {
          // Fetch the video file
          const response = await fetch(generatedVideoUrl);
          const blob = await response.blob();
          const file = new File([blob], 'talking-dog-video.mp4', { type: 'video/mp4' });

          await navigator.share({
            title: 'My Talking Dog Video',
            text: 'Check out this amazing talking dog video I made!',
            files: [file],
          });

          toast({
            title: "Shared successfully!",
            description: "Your video has been shared.",
          });
        } else {
          // Fallback: copy link to clipboard
          await navigator.clipboard.writeText(window.location.origin + generatedVideoUrl);
          toast({
            title: "Link copied!",
            description: "Video link has been copied to clipboard.",
          });
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          toast({
            title: "Share failed",
            description: "Please try downloading the video instead",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleExpand = () => {
    const videoElement = document.querySelector('video[data-testid="video-generated"]') as HTMLVideoElement;
    if (videoElement) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      }
    }
  };

  // Calculate speaking time estimate (rough: ~2.5 words per second)
  const wordCount = prompt.trim().split(/\s+/).filter(w => w.length > 0).length;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 2.5) * 10) / 10);
  const charCount = prompt.length;

  return (
    <section id="hero" className="pt-24 pb-12 md:pt-32 md:pb-16 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-6 w-full">
        {generatedVideoUrl ? (
          // Video Display Mode - Centered layout
          <div className="flex flex-col items-center justify-center w-full space-y-8">
            {/* Generated Video */}
            <div className="relative w-full max-w-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <div className="relative w-full aspect-video rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden border-4 border-primary/20 shadow-2xl">
                <video
                  key={generatedVideoUrl}
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  preload="metadata"
                  playsInline
                  muted={false}
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                  data-testid="video-generated"
                  onError={(e) => {
                    console.error("Video load error:", e);
                    console.error("Video src:", generatedVideoUrl);
                    console.error("Video error details:", e.currentTarget.error);
                    setError("Failed to load video. Try downloading it instead.");
                  }}
                  onLoadedMetadata={(e) => {
                    console.log("Video loaded successfully:", generatedVideoUrl);
                    console.log("Video duration:", e.currentTarget.duration);
                  }}
                  onLoadStart={(e) => {
                    console.log("Video loading started:", generatedVideoUrl);
                  }}
                  onCanPlay={(e) => {
                    console.log("Video can play:", generatedVideoUrl);
                  }}
                  onLoadedData={(e) => {
                    console.log("Video data loaded:", generatedVideoUrl);
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="default"
                size="lg"
                className="gap-2 shadow-xl border-2 bg-primary hover:bg-primary/90"
                onClick={handleDownload}
                data-testid="button-download"
              >
                <Download className="h-5 w-5" />
                Download
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 shadow-xl border-2 bg-background hover:bg-accent/10"
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="h-5 w-5" />
                Share
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 shadow-xl border-2 bg-background hover:bg-accent/10"
                onClick={() => {
                  setGeneratedVideoUrl(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setPrompt("");
                  setVoiceStyle("");
                  setAction("");
                  setError(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                data-testid="button-create-another"
              >
                <PawPrint className="h-5 w-5" />
                Create Another
              </Button>
              {!user && (
                <Button
                  variant="default"
                  size="lg"
                  className="gap-2 shadow-xl border-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  onClick={() => setAuthDialogOpen(true)}
                  data-testid="button-sign-up"
                >
                  Sign Up / Create Account
                </Button>
              )}
            </div>
          </div>
        ) : isGenerating ? (
          // Processing Mode - Centered single column layout
          <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
            <div className="space-y-6 py-6" data-testid="processing-status">
              {/* Processing Container */}
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Processing Your Video 🐾</h3>
                  <p className="text-sm text-muted-foreground">
                    Your furry friend is getting ready to speak! This usually takes 2-3 minutes.
                  </p>
                </div>

                {/* Warning Message - Stay on Page */}
                <div className="max-w-md mx-auto">
                  <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-blue-900 mb-1">Keep This Tab Open</h4>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        Your video is generating! Refreshing this page will lose progress tracking, but your video will continue generating on our servers. Check your Dashboard in 2-3 minutes to find your completed video.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-md mx-auto pt-2">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
                      style={{
                        width: '100%',
                        animation: 'progressBar 420s linear forwards'
                      }}
                    ></div>
                    <style>{`
                      @keyframes progressBar {
                        0% { width: 0%; }
                        100% { width: 100%; }
                      }
                    `}</style>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Generating your video masterpiece...</p>
                </div>
              </div>

              {/* Ad Space Container - Centered Below */}
              <div className="w-full flex justify-center pt-4">
                <div className="w-full max-w-2xl">
                  <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 md:p-8 shadow-lg overflow-hidden group hover:border-primary/50 transition-all duration-300">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                      }}></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center space-y-3">
                      {/* Badge */}
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Premium Ad Space Available
                      </div>

                      {/* Main Heading */}
                      <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                        Reach 1000s of Dog Lovers
                        <br />
                        <span className="text-primary">While They Wait</span>
                      </h3>

                      {/* Description */}
                      <p className="text-xs md:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        Your brand could be here! Join our exclusive carousel of sponsors seen by engaged pet parents during video generation.
                      </p>

                      {/* Features Grid */}
                      <div className="grid grid-cols-3 gap-2 md:gap-3 pt-2 max-w-xl mx-auto">
                        <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 backdrop-blur-sm">
                          <div className="text-base md:text-lg font-bold text-primary">2-5 min</div>
                          <div className="text-xs text-muted-foreground">View Time</div>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 backdrop-blur-sm">
                          <div className="text-base md:text-lg font-bold text-primary">10 Slots</div>
                          <div className="text-xs text-muted-foreground">Total Available</div>
                        </div>
                        <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2 backdrop-blur-sm">
                          <div className="text-base md:text-lg font-bold text-primary">3 Premium</div>
                          <div className="text-xs text-muted-foreground">+30s Spots</div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="pt-2">
                        <a
                          href="mailto:makemydogtalk@gmail.com?subject=Ad%20Space%20Inquiry&body=Hi,%0D%0A%0D%0AI'm%20interested%20in%20advertising%20on%20MakeMyDogTalk.com.%0D%0A%0D%0ACompany%20Name:%0D%0AWebsite:%0D%0APreferred%20Ad%20Duration:%20Standard%20/%20Premium%20(+30s)%0D%0A%0D%0AThank%20you!"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Inquire About Advertising
                        </a>
                        <p className="text-xs text-muted-foreground mt-2">
                          All submissions reviewed for brand alignment • First come, first served
                        </p>
                      </div>
                    </div>

                    {/* Decorative Corner Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Form Mode - Two column layout
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground tracking-tight">
                    Bring a Pup to Life
                  </h1>
                  <div className="flex items-center gap-2 text-3xl md:text-4xl text-primary flex-wrap">
                    <span className="font-semibold whitespace-nowrap">for</span>
                    <span
                      key={currentUseCaseIndex}
                      className="inline-block animate-fade-in font-bold italic whitespace-nowrap"
                      data-testid="text-rotating-usecase"
                      style={{
                        fontFamily: '"Rounded", "Avenir Next Rounded", "Quicksand", "Montserrat", sans-serif',
                        transform: 'scaleY(1.2)'
                      }}
                    >
                      {useCases[currentUseCaseIndex]}
                    </span>
                  </div>
                </div>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Generate a talking video from a photo + prompt. Watch your furry friend come to life!
                </p>
              </div>

            <Card className="p-6 space-y-5 border-2 shadow-lg w-full relative">
              {rateLimitInfo ? (
                <div className="text-center space-y-4 py-6" data-testid="rate-limit-section">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">🐾 Free Limit Reached</h3>
                    <p className="text-sm text-muted-foreground">
                      {rateLimitInfo.message}
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-6 space-y-3">
                    <div className="text-3xl font-bold text-primary">
                      {Math.floor(rateLimitInfo.remainingMinutes / 60)}h {rateLimitInfo.remainingMinutes % 60}m
                    </div>
                    <p className="text-xs text-muted-foreground">Until your next free video</p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full text-base font-semibold h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      data-testid="button-skip-line"
                      onClick={() => handleOpenCheckout(PRODUCTS.THREE_PACK)}
                    >
                      Get {PRODUCTS.THREE_PACK.credits} Credits for ${PRODUCTS.THREE_PACK.price}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setRateLimitInfo(null);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setPrompt("");
                        setVoiceStyle("");
                        setAction("");
                        // Scroll to top to show form
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      data-testid="button-wait"
                    >
                      I'll wait
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={(e) => handleSubmit(e, credits > 0)} className="space-y-4">
                  {/* Image Upload */}
                  <div>
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover-elevate transition-all border-primary/30 hover:border-primary/50 bg-primary/5"
                      data-testid="input-file-upload"
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded-xl shadow-md" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-primary" />
                            <p className="text-sm font-medium text-foreground">Upload a photo of a dog</p>
                            <p className="text-xs text-muted-foreground text-center px-4">
                              *For best quality, feature one dog only.
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {/* Voice Style Input (Optional) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground">
                        Voice Style <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenExamples("voice")}
                        className="text-xs font-semibold text-foreground hover:underline"
                        data-testid="link-voice-examples"
                      >
                        Choose a Voice
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder='Example: "deep male voice" or "excited kid voice"'
                      value={voiceStyle}
                      onChange={(e) => setVoiceStyle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="input-voice-style"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe the voice characteristics: tone, gender, age, emotion, etc.
                    </p>
                  </div>

                  {/* Action Input (Optional) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground">
                        Action <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenExamples("action")}
                        className="text-xs font-semibold text-foreground hover:underline"
                        data-testid="link-action-examples"
                      >
                        Choose an Action
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder='Example: "turns his head and looks at the camera"'
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="input-action"
                      maxLength={150}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe what the dog does in the video (e.g., "sits on a red rug", "wags tail")
                    </p>
                  </div>

                  {/* Script Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-foreground">
                        What should your dog say?
                      </label>
                      <span className={charCount > 280 ? "text-orange-500 font-medium text-xs" : charCount === 300 ? "text-destructive font-medium text-xs" : "text-muted-foreground text-xs"}>
                        {charCount}/300
                      </span>
                    </div>
                    <Textarea
                      placeholder="Example: Hey! It's me, Luna! Don't forget my treats today!&#10;&#10;Multiple dogs? Use: Dog 1: I'm the boss! Dog 2: No way, I am!"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-20 text-sm resize-none"
                      data-testid="input-prompt"
                      maxLength={300}
                    />
                    {prompt && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Speaking time: ~{estimatedSeconds}s
                        </span>
                      </div>
                    )}
                  </div>

                  {credits > 0 ? (
                    <Button
                      type="button"
                      size="lg"
                      className="w-full text-base font-semibold h-12 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-primary to-accent"
                      disabled={!selectedFile || !prompt || isGenerating}
                      onClick={(e) => handleSubmit(e, true)}
                      data-testid="button-generate-with-credit"
                    >
                      <Coins className="h-5 w-5 mr-2" />
                      Use 1 Credit (No Wait!)
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-base font-semibold h-12 shadow-md hover:shadow-lg transition-shadow"
                      disabled={!selectedFile || !prompt || isGenerating}
                      data-testid="button-generate"
                    >
                      <PawPrint className="h-5 w-5 mr-2" />
                      Make My Dog Talk
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground italic text-center">
                    AI Content Notice: Videos are AI-generated and may vary. Results are for entertainment purposes only.
                  </p>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="error-message">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                </form>
              )}
            </Card>
          </div>

          <div className="relative flex flex-col items-center justify-start order-first md:order-last h-full">
            <div className="relative w-full h-full max-w-[650px] pb-20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <div className="relative w-full h-full min-h-[500px] md:min-h-[600px] rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden border-4 border-primary/20 shadow-2xl">
                <VideoCollage videos={sampleVideos} />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Checkout Dialog */}
      {selectedProduct && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={handleCheckoutClose}
          priceId={selectedProduct.priceId}
          productName={selectedProduct.name}
        />
      )}

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
      />

      {/* Examples Modal */}
      <ExamplesModal
        isOpen={examplesModalOpen}
        onClose={() => setExamplesModalOpen(false)}
        type={examplesModalType}
        onSelect={handleExampleSelect}
      />
    </section>
  );
}
