import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play } from "lucide-react";
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
      console.log('File selected:', file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Generate video clicked', { file: selectedFile?.name, prompt });
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
                  disabled={!selectedFile || !prompt}
                  data-testid="button-generate"
                >
                  Make My Dog Talk 🐾
                </Button>
              </form>
            </Card>
          </div>

          <div className="relative flex items-center justify-center order-first md:order-last">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl"></div>
              <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden border-4 border-primary/20 shadow-2xl">
                <img
                  src={heroImage}
                  alt="Happy dog"
                  className="w-full h-full object-cover"
                  data-testid="img-hero-dog"
                />
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 gap-2 shadow-xl border-2"
                onClick={() => console.log('Watch sample clicked')}
                data-testid="button-watch-sample"
              >
                <Play className="h-5 w-5" />
                Watch Sample
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
