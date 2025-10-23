import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import heroImage from "@assets/generated_images/Happy_golden_retriever_hero_087f9099.png";

const useCases = [
  "Birthday Gifts",
  "Apology Videos",
  "Adoption or Rescue",
  "Business Marketing"
];

export default function Hero() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentUseCaseIndex, setCurrentUseCaseIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const interval = setInterval(() => {
      setFade(false);
      timeoutId = setTimeout(() => {
        setCurrentUseCaseIndex((prev) => (prev + 1) % useCases.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Generate video clicked', { file: selectedFile?.name, prompt });
  };

  return (
    <section id="hero" className="pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                Bring Your Pup to Life
              </h1>
              <p className="text-3xl md:text-4xl font-bold leading-tight mt-2">
                <span className="text-foreground">for </span>
                <span 
                  className={`italic text-primary transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
                  data-testid="text-rotating-usecase"
                >
                  {useCases[currentUseCaseIndex]}
                </span>
              </p>
            </div>
            
            <p className="text-base md:text-lg text-muted-foreground">
              Generate a 6-second talking video from a photo + prompt.
              Watch your furry friend come to life!
            </p>

            <Card className="p-6 space-y-4 bg-card/50">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-md cursor-pointer hover-elevate transition-all bg-background/50"
                    data-testid="input-file-upload"
                  >
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="h-full w-full object-contain rounded-md p-2" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-4">
                        <div className="w-20 h-20 rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                          <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    )}
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
                    className="min-h-24 resize-none"
                    data-testid="input-prompt"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg font-medium gap-2"
                  data-testid="button-generate"
                >
                  <Sparkles className="h-5 w-5" />
                  Make My Dog Talk
                </Button>
              </form>
            </Card>
          </div>

          <div className="relative flex items-center justify-center">
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="aspect-square w-full max-w-md">
                <img
                  src={heroImage}
                  alt="Happy dog"
                  className="w-full h-full object-cover"
                  data-testid="img-hero-dog"
                />
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <Button
                  variant="secondary"
                  size="lg"
                  className="gap-2 shadow-lg bg-background/90 backdrop-blur"
                  onClick={() => console.log('Watch sample clicked')}
                  data-testid="button-watch-sample"
                >
                  <Play className="h-5 w-5" />
                  Watch Sample
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
