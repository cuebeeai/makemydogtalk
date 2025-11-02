import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import heroImage from "@assets/generated_images/Happy_golden_retriever_hero_087f9099.png";

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUseCaseIndex((prev) => (prev + 1) % useCases.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      console.log('File selected:', file.name);
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

      // Step 1: Start video generation
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      console.log('Video generation started:', data.operationId);

      // Step 2: Poll for completion
      const operationId = data.operationId;
      const pollingInterval = data.pollingInterval || 5000;
      let attempts = 0;
      const maxAttempts = 36; // 3 minutes max

      const pollStatus = async () => {
        attempts++;

        const statusResponse = await fetch(`/api/video-status/${operationId}`);
        const statusData = await statusResponse.json();

        console.log(`Polling attempt ${attempts}: ${statusData.status}`);

        if (statusData.status === 'completed') {
          setGeneratedVideoUrl(statusData.videoUrl);
          setIsGenerating(false);
          console.log('Video ready:', statusData.videoUrl);
        } else if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Video generation failed');
        } else if (attempts >= maxAttempts) {
          throw new Error('Video generation timed out. Please try again.');
        } else {
          // Continue polling
          setTimeout(pollStatus, pollingInterval);
        }
      };

      // Start polling after a short delay
      setTimeout(pollStatus, pollingInterval);

    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the video');
      console.error('Error generating video:', err);
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedVideoUrl) return;

    try {
      // For Google video URLs, we need to handle CORS differently
      if (generatedVideoUrl.includes('generativelanguage.googleapis.com')) {
        // Open in new tab for direct download
        window.open(generatedVideoUrl, '_blank');
        return;
      }
      
      const response = await fetch(generatedVideoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-dog-talks-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading video:', err);
      // Fallback: open in new tab
      window.open(generatedVideoUrl, '_blank');
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
                Generate a 6-second talking video from a photo + prompt. Watch your furry friend come to life!
              </p>
            </div>

            <Card className="p-8 space-y-6 border-2 shadow-lg">
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
                  {isGenerating ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Generating Video...
                    </>
                  ) : (
                    'Make My Dog Talk 🐾'
                  )}
                </Button>
              </form>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}
            </Card>
          </div>

          <div className="relative flex items-center justify-center order-first md:order-last">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden border-4 border-primary/20 shadow-2xl">
                {generatedVideoUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <video
                      src={generatedVideoUrl}
                      controls
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      onLoadStart={() => console.log('Video load started')}
                      onLoadedData={() => console.log('Video data loaded')}
                      onError={(e) => {
                        console.error('Video error:', e);
                        // If video fails to load, show a message
                        const videoElement = e.target as HTMLVideoElement;
                        videoElement.style.display = 'none';
                      }}
                      onCanPlay={() => console.log('Video can play')}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-center p-4" id="video-fallback" style={{display: 'none'}}>
                      <div>
                        <p className="text-lg font-semibold mb-2">🎉 Video Generated Successfully!</p>
                        <p className="text-sm mb-4">Your talking dog video is ready!</p>
                        <div className="space-y-2">
                          <Button 
                            onClick={() => window.open(generatedVideoUrl, '_blank')}
                            className="bg-primary text-primary-foreground w-full"
                          >
                            🎬 Open Video in New Tab
                          </Button>
                          <Button 
                            onClick={() => {
                              navigator.clipboard.writeText(generatedVideoUrl);
                              alert('Video URL copied to clipboard!');
                            }}
                            variant="outline"
                            className="w-full text-white border-white"
                          >
                            📋 Copy Video URL
                          </Button>
                        </div>
                        <p className="text-xs mt-2 opacity-75">Note: Google video URLs may not embed directly due to CORS restrictions</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={heroImage}
                    alt="Happy dog"
                    className="w-full h-full object-cover"
                    data-testid="img-hero-dog"
                  />
                )}
              </div>
              {generatedVideoUrl ? (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    🎉 Video Generated Successfully!
                  </div>
                  <Button
                    variant="default"
                    size="lg"
                    className="gap-2 shadow-xl border-2 h-14 px-8 text-base font-semibold"
                    onClick={handleDownload}
                    data-testid="button-download-video"
                  >
                    <Download className="h-5 w-5" />
                    Download Video
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-xl border-2 h-14 px-8 text-base font-semibold"
                  onClick={() => console.log('Watch sample clicked')}
                  data-testid="button-watch-sample"
                >
                  <Play className="h-5 w-5" />
                  Watch Sample
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
