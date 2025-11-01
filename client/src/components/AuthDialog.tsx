import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'signup';
}

export function AuthDialog({ open, onOpenChange, defaultTab = 'login' }: AuthDialogProps) {
  const { login, loginWithEmail, signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');

  const handleGoogleLogin = () => {
    login(); // Redirects to Google OAuth
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginWithEmail(loginEmail, loginPassword);
      if (result.success) {
        onOpenChange(false);
        // Reset form
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(signupEmail, signupPassword, signupName);
      if (result.success) {
        // If promo code was provided, redeem it
        if (promoCode.trim()) {
          try {
            const promoResponse = await fetch('/api/redeem-promo-code', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ code: promoCode.trim() }),
            });

            const promoData = await promoResponse.json();

            if (promoResponse.ok && promoData.success) {
              toast({
                title: "Welcome! 🎉",
                description: `Account created and ${promoData.credits} free credits added!`,
              });
            } else {
              // Signup succeeded but promo code failed - still show success
              toast({
                title: "Account created!",
                description: promoData.error ? `Note: ${promoData.error}` : 'Promo code could not be applied.',
              });
            }
          } catch (promoErr) {
            // Signup succeeded but promo redemption had error
            toast({
              title: "Account created!",
              description: "However, there was an issue applying the promo code.",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to MakeMyDogTalk!",
          });
        }

        onOpenChange(false);
        // Reset form
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setPromoCode('');
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Welcome to MakeMyDogTalk.com</DialogTitle>
          <DialogDescription className="text-sm">
            Sign in to create amazing talking dog videos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-3">
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-sm">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-sm">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-9"
                />
              </div>

              {error && (
                <div className="text-sm text-red-500">{error}</div>
              )}

              <Button type="submit" className="w-full h-9" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-9"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3">
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name" className="text-sm">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="text-sm">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-sm">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm-password" className="text-sm">Confirm Password</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promo-code" className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Promo Code (Optional)
                </Label>
                <Input
                  id="promo-code"
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  maxLength={50}
                  className="text-center font-semibold tracking-wider"
                />
                <p className="text-xs text-muted-foreground">
                  Get 5 free video credits with a valid promo code!
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-500">{error}</div>
              )}

              <Button type="submit" className="w-full h-9" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-9"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Have a promo code? Click "Promo Code" in the header after signing in!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
