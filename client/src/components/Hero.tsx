import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Download, PawPrint, X, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CheckoutDialog from "./CheckoutDialog";
import ExamplesModal from "./ExamplesModal";
import { PRODUCTS } from "@/lib/products";
import heroImage from "@assets/generated_images/Happy_golden_retriever_hero_087f9099.png";
import demoVideo from "@assets/MMDTHeroVideoSample_1761226901573.mp4";
import carGoldenImg from "@/../../attached_assets/CarGolden.png";
import drivingDogImg from "@/../../attached_assets/DrivingDog.png";
import greatDaneImg from "@/../../attached_assets/greatdane.jpg";
import germanShepImg from "@/../../attached_assets/GermanShep.png";
import logoImage from "@/../../attached_assets/MakeMyDogTalkLogo_1760988429734_1761186294239.png";

const useCases = [
  "Birthday Greetings",
  "Apology Videos",
  "Adoption or Rescues",
  "Business Promotions",
  "Funny Content",
];

const sampleVideos = [
  {
    videoUrl: "/uploads/videos/1761227873195_ane3jf.mp4",
    thumbnailUrl: carGoldenImg,
    title: "Golden Retriever",
  },
  {
    videoUrl: "/uploads/videos/1761225934341_7kmdfy.mp4",
    thumbnailUrl: drivingDogImg,
    title: "Driving Dog",
  },
  {
    videoUrl: "/uploads/videos/1761644895854_xbnrvo.mp4",
    thumbnailUrl: greatDaneImg,
    title: "Great Dane",
  },
  {
    videoUrl: "/uploads/videos/1761414205882_be4lqv.mp4",
    thumbnailUrl: germanShepImg,
    title: "German Shepherd",
  },
];

export default function Hero() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [voiceStyle, setVoiceStyle] = useState("");
  const [action, setAction] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentUseCaseIndex, setCurrentUseCaseIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [selectedSampleVideo, setSelectedSampleVideo] = useState<string | null>(null);
  const [selectedSampleTitle, setSelectedSampleTitle] = useState<string>("");
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remainingMinutes: number; message: string } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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
  }, []);

  // Handle opening checkout dialog
  const handleOpenCheckout = (product: { priceId: string; name: string }) => {
    setSelectedProduct(product);
    setCheckoutOpen(true);
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

        // Map to closest standard video aspect ratio
        // Note: Vertex AI Veo 3.1 only supports 16:9 and 9:16, not 1:1
        if (ratio > 1.5) {
          resolve("16:9"); // Wide/landscape
        } else if (ratio < 0.75) {
          resolve("9:16"); // Tall/portrait
        } else {
          // Square/close to square - map to whichever is closer
          // Default to 16:9 for images that are exactly square or slightly wider
          resolve(ratio >= 1 ? "16:9" : "9:16");
        }
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

      const pollingInterval = 10000;
      let attempts = 0;
      const maxAttempts = 30;

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

  const handleDownload = () => {
    if (generatedVideoUrl) {
      const link = document.createElement('a');
      link.href = generatedVideoUrl;
      link.download = 'talking-dog-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculate speaking time estimate (rough: ~2.5 words per second)
  const wordCount = prompt.trim().split(/\s+/).filter(w => w.length > 0).length;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 2.5) * 10) / 10);
  const charCount = prompt.length;

  return (
    <section id="hero" className="pt-24 pb-12 md:pt-32 md:pb-16 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground tracking-tight">
                  Bring Your Pup to Life
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
              {generatedVideoUrl ? (
                credits > 3 ? (
                  // User has plenty of credits - no paywall, just encourage more creation
                  <div className="text-center space-y-4" data-testid="success-section">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">Video Ready! 🎉</h3>
                      <p className="text-sm text-muted-foreground">
                        You have {credits} credits remaining. Keep creating!
                      </p>
                    </div>

                    <Button
                      size="lg"
                      className="w-full text-base font-semibold h-12"
                      onClick={() => {
                        setGeneratedVideoUrl(null);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setPrompt("");
                        setVoiceStyle("");
                        setAction("");
                        setError(null);
                      }}
                      data-testid="button-create-another"
                    >
                      <PawPrint className="h-5 w-5 mr-2" />
                      Create Another Video
                    </Button>
                  </div>
                ) : (
                  // User has 3 or fewer credits (or none) - show paywall
                  <div className="text-center space-y-4" data-testid="paywall-section">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {credits > 0 ? `Running Low on Credits! ⚠️` : `Love Your Video? 🎥`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {credits > 0
                          ? `You have ${credits} ${credits === 1 ? 'credit' : 'credits'} left. Stock up now!`
                          : `Want to create more talking dog videos? Choose a plan below:`
                        }
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="w-full text-base font-semibold h-12"
                        data-testid="button-buy-single"
                        onClick={() => handleOpenCheckout({ priceId: PRODUCTS.JUMP_LINE.priceId, name: PRODUCTS.JUMP_LINE.name })}
                      >
                        ${PRODUCTS.JUMP_LINE.price} - {PRODUCTS.JUMP_LINE.name} ({PRODUCTS.JUMP_LINE.credits} Credit)
                      </Button>

                      <Button
                        size="lg"
                        variant="default"
                        className="w-full text-base font-semibold h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        data-testid="button-buy-bundle"
                        onClick={() => handleOpenCheckout({ priceId: PRODUCTS.THREE_PACK.priceId, name: PRODUCTS.THREE_PACK.name })}
                      >
                        ${PRODUCTS.THREE_PACK.price} - {PRODUCTS.THREE_PACK.name} ({PRODUCTS.THREE_PACK.credits} Credits) ⭐
                      </Button>

                      {credits > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-sm"
                          onClick={() => {
                            setGeneratedVideoUrl(null);
                            setSelectedFile(null);
                            setPreviewUrl(null);
                            setPrompt("");
                            setVoiceStyle("");
                            setAction("");
                            setError(null);
                          }}
                          data-testid="button-create-another-with-credits"
                        >
                          Or use your {credits} remaining {credits === 1 ? 'credit' : 'credits'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              ) : isGenerating ? (
                <div className="text-center space-y-4 py-6" data-testid="processing-status">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Processing Your Video 🐾</h3>
                    <p className="text-sm text-muted-foreground">
                      Your furry friend is getting ready to speak! This usually takes 2-3 minutes.
                    </p>
                  </div>

                  <div className="flex justify-center items-center">
                    <div className="relative">
                      <PawPrint
                        className="h-16 w-16 text-primary"
                        style={{
                          animation: 'walkingDog 1.5s ease-in-out infinite'
                        }}
                      />
                      <style>{`
                        @keyframes walkingDog {
                          0%, 100% { transform: translateX(-10px) rotate(-5deg); }
                          50% { transform: translateX(10px) rotate(5deg); }
                        }
                      `}</style>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
                        style={{
                          width: '100%',
                          animation: 'progressBar 180s linear forwards'
                        }}
                      ></div>
                      <style>{`
                        @keyframes progressBar {
                          0% { width: 0%; }
                          100% { width: 100%; }
                        }
                      `}</style>
                    </div>
                    <p className="text-xs text-muted-foreground">Generating your 8-second masterpiece...</p>
                  </div>
                </div>
              ) : rateLimitInfo ? (
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
                      onClick={() => handleOpenCheckout({ priceId: PRODUCTS.JUMP_LINE.priceId, name: PRODUCTS.JUMP_LINE.name })}
                    >
                      Skip the Line for ${PRODUCTS.JUMP_LINE.price} ⚡
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
                      }}
                      data-testid="button-wait"
                    >
                      I'll wait
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="Example: Hey! It's me, Luna! Don't forget my treats today!"
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

          <div className="relative flex flex-col items-center justify-start order-first md:order-last">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden border-4 border-primary/20 shadow-2xl">
                {generatedVideoUrl ? (
                  <video
                    key={generatedVideoUrl}
                    src={generatedVideoUrl}
                    controls
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
                ) : isGenerating ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-8">
                    <img
                      src={logoImage}
                      alt="MakeMyDogTalk Logo"
                      className="h-32 w-32 md:h-40 md:w-40 mb-6 animate-pulse"
                    />
                    <p className="text-xl md:text-2xl font-bold text-center text-foreground">
                      Your Video Will Appear Here When Finished!
                    </p>
                  </div>
                ) : isPlayingDemo ? (
                  <video
                    src={demoVideo}
                    controls
                    autoPlay
                    preload="auto"
                    playsInline
                    className="w-full h-full object-cover"
                    data-testid="video-demo"
                    onEnded={() => setIsPlayingDemo(false)}
                  />
                ) : (
                  <>
                    <img
                      src={heroImage}
                      alt="Happy dog"
                      className="w-full h-full object-cover"
                      data-testid="img-hero-dog"
                    />
                    <button
                      onClick={() => setIsPlayingDemo(true)}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 hover:bg-black/50 transition-all group"
                      data-testid="button-play-demo"
                    >
                      <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-2xl">
                        <Play className="h-10 w-10 md:h-12 md:w-12 text-primary fill-primary ml-1" />
                      </div>
                      <div className="px-6 py-3 bg-white/95 rounded-full shadow-xl">
                        <p className="text-base md:text-lg font-bold text-foreground">
                          Click to Make Me Talk! 🐾
                        </p>
                      </div>
                    </button>
                  </>
                )}
              </div>
              {generatedVideoUrl && (
                <Button
                  variant="default"
                  size="lg"
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-xl border-2"
                  onClick={handleDownload}
                  data-testid="button-download"
                >
                  <Download className="h-5 w-5" />
                  Download Video
                </Button>
              )}
            </div>

            {/* Sample Videos Section - Below the video */}
            <div className="mt-12 text-center">
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-muted-foreground">
                Watch a Sample Video
              </h2>
              <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
                {sampleVideos.map((sample, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                    onClick={() => {
                      setSelectedSampleVideo(sample.videoUrl);
                      setSelectedSampleTitle(sample.title);
                    }}
                    data-testid={`sample-video-${index}`}
                  >
                    <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/50 transition-all group-hover:scale-105 shadow-lg">
                      <img
                        src={sample.thumbnailUrl}
                        alt={sample.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {sample.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Video Modal */}
      <Dialog open={!!selectedSampleVideo} onOpenChange={(open) => !open && setSelectedSampleVideo(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedSampleTitle}</DialogTitle>
          <button
            onClick={() => setSelectedSampleVideo(null)}
            className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            aria-label="Close video"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          {selectedSampleVideo && (
            <video
              key={selectedSampleVideo}
              src={selectedSampleVideo}
              controls
              autoPlay
              playsInline
              className="w-full"
              data-testid="sample-video-player"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      {selectedProduct && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={handleCheckoutClose}
          priceId={selectedProduct.priceId}
          productName={selectedProduct.name}
        />
      )}

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
