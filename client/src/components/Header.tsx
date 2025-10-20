import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/MakeMyDogTalkLogo_1760988429734.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="Make My Dog Talk Logo" 
              className="h-10"
              data-testid="img-logo"
            />
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-foreground dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-medium"
              data-testid="link-home"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-foreground dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-medium"
              data-testid="link-features"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('examples')}
              className="text-foreground dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-medium"
              data-testid="link-examples"
            >
              Examples
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-foreground dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-medium"
              data-testid="link-pricing"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-foreground dark:text-white hover:text-primary dark:hover:text-primary transition-colors font-medium"
              data-testid="link-contact"
            >
              Contact
            </button>
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 bg-background/95 backdrop-blur">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-left text-foreground hover:text-primary transition-colors py-2 font-medium"
                data-testid="link-mobile-home"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left text-foreground hover:text-primary transition-colors py-2 font-medium"
                data-testid="link-mobile-features"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('examples')}
                className="text-left text-foreground hover:text-primary transition-colors py-2 font-medium"
                data-testid="link-mobile-examples"
              >
                Examples
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left text-foreground hover:text-primary transition-colors py-2 font-medium"
                data-testid="link-mobile-pricing"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left text-foreground hover:text-primary transition-colors py-2 font-medium"
                data-testid="link-mobile-contact"
              >
                Contact
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
