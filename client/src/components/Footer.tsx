import { Link } from "wouter";
import { Mail, Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-card-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">MakeMyDogTalk.com</h3>
            <p className="text-sm text-muted-foreground">
              Bring your furry friends to life with AI-powered talking videos.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/how-to" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-howto">
                How to
              </Link>
              <Link href="/examples" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-examples">
                Examples
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-pricing">
                Pricing
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-terms">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-privacy">
                Privacy Policy
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:hello@makemydogtalk.com"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                data-testid="link-footer-email"
              >
                <Mail className="h-4 w-4" />
                hello@makemydogtalk.com
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Follow Us</h4>
            <div className="flex gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-footer-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-footer-facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-footer-twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-card-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MakeMyDogTalk.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
