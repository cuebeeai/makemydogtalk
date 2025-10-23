import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Upload, MessageSquare, Video, Download } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function HowTo() {
  const steps = [
    {
      icon: Upload,
      title: "1. Upload a Photo",
      description: "Choose a clear photo of your dog. Make sure their face is visible and well-lit for best results.",
    },
    {
      icon: MessageSquare,
      title: "2. Write Your Prompt",
      description: "Tell us what you want your dog to say or do. Be creative! Examples: 'Say happy birthday!', 'Sing a song', 'Tell a joke'.",
    },
    {
      icon: Video,
      title: "3. Generate Video",
      description: "Click the button and let our AI work its magic. Your talking dog video will be ready in moments!",
    },
    {
      icon: Download,
      title: "4. Download & Share",
      description: "Download your video and share it with friends, family, or on social media. Watch the smiles multiply!",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Create amazing talking dog videos in just four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <Card 
                key={index}
                className="p-8 space-y-4 hover-elevate transition-all"
                data-testid={`card-step-${index + 1}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Card className="p-8 bg-primary/5 border-primary/20">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Tips for Best Results
              </h2>
              <ul className="text-left max-w-2xl mx-auto space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Use a high-quality, well-lit photo with your dog's face clearly visible
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Keep prompts clear and specific for the best results
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Experiment with different prompts to see what works best
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  Videos are 6 seconds long - perfect for sharing on social media
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
