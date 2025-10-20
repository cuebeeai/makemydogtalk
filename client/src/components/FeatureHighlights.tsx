import { Button } from "@/components/ui/button";
import { Play, MessageCircle } from "lucide-react";

export default function FeatureHighlights() {
  return (
    <section className="py-16 md:py-24 bg-primary/5">
      <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
        <div className="flex justify-center gap-8 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-3xl">🐾</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Play className="h-8 w-8 text-primary" />
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          Start your dog's first video now
        </h2>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Join thousands of happy pet parents who've brought their furry friends to life with AI. 
          Your first video is free - no credit card, no commitment, just pure fun!
        </p>

        <Button
          size="lg"
          className="text-lg px-8 py-6"
          onClick={() => {
            console.log('CTA clicked - scroll to hero');
            document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
          }}
          data-testid="button-cta-start"
        >
          Create Your First Video 🎥
        </Button>

        <p className="text-sm text-muted-foreground italic">
          "My dog never looked so chatty! This is amazing!" - Sarah K.
        </p>
      </div>
    </section>
  );
}
