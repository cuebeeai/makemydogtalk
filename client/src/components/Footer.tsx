import { SiFacebook, SiInstagram, SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer id="contact" className="bg-primary/5 border-t py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold text-foreground">Make My Dog Talk</span>
            </div>
            <p className="text-muted-foreground">
              Turn your dog into a star with AI-powered video generation.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-footer-home"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-footer-features"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-footer-pricing"
                >
                  Pricing
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <p className="text-muted-foreground mb-4">
              support@makemydogtalk.com
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => console.log('Facebook clicked')}
                data-testid="button-social-facebook"
              >
                <SiFacebook className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => console.log('Instagram clicked')}
                data-testid="button-social-instagram"
              >
                <SiInstagram className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => console.log('Twitter clicked')}
                data-testid="button-social-twitter"
              >
                <SiX className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Make My Dog Talk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
