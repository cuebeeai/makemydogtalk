import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple Pricing
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Create amazing talking dog videos at an affordable price
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="p-8 border-2 border-primary/20 shadow-lg">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Video Bundle
                </h2>
                <p className="text-muted-foreground">
                  Perfect for multiple occasions
                </p>
              </div>

              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-primary">$20</span>
                </div>
                <p className="text-muted-foreground mt-2">for 5 videos</p>
                <p className="text-sm text-muted-foreground mt-1">($4 per video)</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-foreground">5 high-quality talking dog videos</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-foreground">6 seconds per video</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-foreground">Download and share anywhere</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <p className="text-foreground">Use any photo and custom prompts</p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full text-lg font-semibold h-14"
                data-testid="button-get-started"
                asChild
              >
                <Link href="/">
                  Get Started
                </Link>
              </Button>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Questions about pricing? <a href="mailto:hello@makemydogtalk.com" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
