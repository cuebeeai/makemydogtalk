import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@assets/generated_images/Happy_golden_retriever_hero_087f9099.png";
import demoVideo from "@assets/MMDTHeroVideoSample_1761226901573.mp4";

const useCases = [
  "Surprise Birthday Greetings",
  "Funny Apology Videos",
  "Adoption or Rescues",
  "Business Promotions"
];

export default function Hero() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentUseCaseIndex, setCurrentUseCaseIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !prompt) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('prompt', prompt);

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

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

  return (
    <section id="hero" className="pt-32 pb-16 md:pt-40 md:pb-24 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="space-y-2">
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
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Generate an 8-second talking video from a photo + prompt. Watch your furry friend come to life!
              </p>
            </div>

            <Card className="p-8 space-y-6 border-2 shadow-lg">
              {generatedVideoUrl ? (
                <div className="text-center space-y-6" data-testid="paywall-section">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground">Love Your Video? 🎥</h3>
                    <p className="text-muted-foreground">
                      Want to create more talking dog videos? Choose a plan below:
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      size="lg"
                      className="w-full text-lg font-semibold h-14"
                      data-testid="button-buy-single"
                    >
                      $5 - Single Video (HD, No Watermark)
                    </Button>
                    
                    <Button
                      size="lg"
                      variant="default"
                      className="w-full text-lg font-semibold h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      data-testid="button-buy-bundle"
                    >
                      $20 - 5 Videos Bundle (Save $5!) ⭐
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setGeneratedVideoUrl(null);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setPrompt("");
                      }}
                      data-testid="button-create-another-free"
                    >
                      Or create another free video (with watermark)
                    </Button>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="text-center space-y-6 py-8" data-testid="processing-status">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground">Processing Your Video 🐾</h3>
                    <p className="text-muted-foreground">
                      Your furry friend is getting ready to speak! This usually takes 2-3 minutes.
                    </p>
                  </div>
                  
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-bounce delay-0">🐕</div>
                    <div className="animate-bounce delay-100" style={{ animationDelay: '0.1s' }}>🐩</div>
                    <div className="animate-bounce delay-200" style={{ animationDelay: '0.2s' }}>🦮</div>
                    <div className="animate-bounce delay-300" style={{ animationDelay: '0.3s' }}>🐕‍🦺</div>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full animate-pulse rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Generating your 8-second masterpiece...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover-elevate transition-all border-primary/30 hover:border-primary/50 bg-primary/5"
                      data-testid="input-file-upload"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="h-32 w-32 object-cover rounded-xl shadow-md" />
                        ) : (
                          <>
                            <Upload className="h-10 w-10 text-primary" />
                            <p className="text-sm font-medium text-foreground">Upload a photo of your furry friend</p>
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

                  <div>
                    <Textarea
                      placeholder="What should your dog say or do? (e.g., 'Say happy birthday!', 'Sing a song', 'Tell a joke')"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-28 text-base"
                      data-testid="input-prompt"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg font-semibold h-14 shadow-md hover:shadow-lg transition-shadow"
                    disabled={!selectedFile || !prompt || isGenerating}
                    data-testid="button-generate"
                  >
                    Make My Dog Talk 🐾
                  </Button>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg" data-testid="error-message">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                </form>
              )}
            </Card>
          </div>

          <div className="relative flex items-center justify-center order-first md:order-last">
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
                    className="w-full h-full object-cover"
                    data-testid="video-generated"
                    onError={(e) => {
                      console.error("Video load error:", e);
                      console.error("Video src:", generatedVideoUrl);
                      console.error("Video error details:", e.currentTarget.error);
                      setError("Failed to load video. Try downloading it instead.");
                    }}
                    onLoadedMetadata={() => {
                      console.log("Video loaded successfully:", generatedVideoUrl);
                      console.log("Video duration:", e.currentTarget.duration);
                    }}
                    onLoadStart={() => {
                      console.log("Video loading started:", generatedVideoUrl);
                    }}
                    onCanPlay={() => {
                      console.log("Video can play:", generatedVideoUrl);
                    }}
                    onLoadedData={() => {
                      console.log("Video data loaded:", generatedVideoUrl);
                    }}
                  />
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
          </div>
        </div>
      </div>
    </section>
  );
}
