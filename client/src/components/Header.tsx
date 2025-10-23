import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import logoImage from "@assets/MakeMyDogTalkLogo_1760988429734_1761186294239.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/how-to", label: "How to", testId: "link-howto" },
    { href: "/examples", label: "Examples", testId: "link-examples" },
    { href: "/pricing", label: "Pricing", testId: "link-pricing" },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3" data-testid="link-home-logo">
            <img 
              src={logoImage} 
              alt="Make My Dog Talk Logo" 
              className="h-12 w-12"
              data-testid="img-logo"
            />
            <span className="text-xl md:text-2xl font-semibold text-foreground">
              MakeMyDogTalk.com
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-foreground hover:text-primary transition-colors font-medium ${
                  location === link.href ? "text-primary" : ""
                }`}
                data-testid={link.testId}
              >
                {link.label}
              </Link>
            ))}
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
          <nav className="md:hidden py-4 bg-background/95 backdrop-blur rounded-lg">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-left text-foreground hover:text-primary transition-colors py-2 font-medium ${
                    location === link.href ? "text-primary" : ""
                  }`}
                  data-testid={`${link.testId}-mobile`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
