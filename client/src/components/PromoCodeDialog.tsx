import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";

interface PromoCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (credits: number) => void;
}

export default function PromoCodeDialog({ open, onOpenChange, onSuccess }: PromoCodeDialogProps) {
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);

    try {
      const response = await fetch('/api/redeem-promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies for auth
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      // Check if user is not authenticated
      if (response.status === 401) {
        toast({
          title: "Sign In Required",
          description: "Please sign in or create an account to redeem promo codes.",
          variant: "destructive",
        });
        return;
      }

      if (!response.ok || !data.success) {
        toast({
          title: "Invalid Code",
          description: data.error || "This promo code is not valid.",
          variant: "destructive",
        });
        return;
      }

      // Success!
      toast({
        title: "Success! 🎉",
        description: `${data.credits} credits added to your account!`,
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(data.credits);
      }

      // Close dialog and reset
      setCode("");
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error redeeming promo code:', error);
      toast({
        title: "Error",
        description: "Failed to redeem promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRedeeming) {
      handleRedeem();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enter Promo Code
          </DialogTitle>
          <DialogDescription className="text-center">
            Have a promo code? Enter it below to get 5 free video credits!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter your promo code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              disabled={isRedeeming}
              className="text-center text-lg font-semibold tracking-wider"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground text-center">
              Promo codes are case-insensitive
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCode("");
                onOpenChange(false);
              }}
              disabled={isRedeeming}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={isRedeeming || !code.trim()}
              className="flex-1"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redeeming...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Redeem Code
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
