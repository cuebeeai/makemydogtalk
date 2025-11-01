import { Menu, X, User, LogOut, Sparkles, Coins } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/AuthDialog";
import PromoCodeDialog from "@/components/PromoCodeDialog";
import logoImage from "@assets/MakeMyDogTalkLogo_1760988429734_1761186294239.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [promoCodeOpen, setPromoCodeOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout, isLoading } = useAuth();

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

          <nav className="hidden md:flex items-center gap-6">
            {/* Credits Display - Show if user has credits */}
            {user && user.credits > 0 && (
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-md">
                <Coins className="h-4 w-4" />
                {user.credits} {user.credits === 1 ? 'Credit' : 'Credits'} Remaining
              </div>
            )}

            {/* Promo Code Button - Left Side */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (user) {
                  setPromoCodeOpen(true);
                } else {
                  setAuthDialogOpen(true);
                }
              }}
              className="border-2 !border-primary !text-primary hover:!bg-primary hover:!text-primary-foreground font-medium transition-colors"
              data-testid="button-promo-code"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Promo Code
            </Button>

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

            {/* Auth Section */}
            {!isLoading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setAuthDialogOpen(true)} variant="default" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )
            )}
          </nav>

          <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
          <PromoCodeDialog
            open={promoCodeOpen}
            onOpenChange={setPromoCodeOpen}
            onSuccess={(creditsAdded) => {
              // Credits will be refreshed by the auth context
              console.log(`Promo code applied: ${creditsAdded} credits added`);
            }}
          />

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
              {/* Credits Display - Mobile */}
              {user && user.credits > 0 && (
                <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-md w-fit">
                  <Coins className="h-4 w-4" />
                  {user.credits} {user.credits === 1 ? 'Credit' : 'Credits'} Remaining
                </div>
              )}

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

              {/* Promo Code Button - Mobile */}
              <Button
                variant="outline"
                onClick={() => {
                  if (user) {
                    setPromoCodeOpen(true);
                  } else {
                    setAuthDialogOpen(true);
                  }
                  setMobileMenuOpen(false);
                }}
                className="w-full border-2 !border-primary !text-primary hover:!bg-primary hover:!text-primary-foreground font-medium transition-colors"
                data-testid="button-promo-code-mobile"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Promo Code
              </Button>

              {/* Mobile Auth Section */}
              {!isLoading && (
                <div className="pt-4 border-t border-border">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.picture} alt={user.name} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center w-full text-left text-foreground hover:text-primary transition-colors py-2 font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setAuthDialogOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      variant="default"
                      className="w-full"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  )}
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
