import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import heroImage from "@assets/generated_images/Happy_golden_retriever_hero_087f9099.png";

export default function Hero() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    <section id="hero" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
              Turn Your Dog Into a Star
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Generate a 6-second talking video from a photo + prompt. Watch your furry friend come to life!
            </p>

            <Card className="p-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover-elevate transition-all"
                    data-testid="input-file-upload"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload your dog's photo</p>
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
                    className="min-h-24"
                    data-testid="input-prompt"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg"
                  disabled={!selectedFile || !prompt}
                  data-testid="button-generate"
                >
                  Make My Dog Talk 🎥
                </Button>
              </form>
            </Card>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative">
              <div className="w-80 h-80 md:w-96 md:h-96 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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
                className="absolute bottom-4 left-1/2 -translate-x-1/2 gap-2 shadow-lg"
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
