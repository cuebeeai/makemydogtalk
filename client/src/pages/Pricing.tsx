import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Tag, Mail } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import CheckoutDialog from "@/components/CheckoutDialog";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function Pricing() {
  const { user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    priceId: string;
    name: string;
  } | null>(null);

  const handleBuyNow = (priceId: string, productName: string) => {
    if (!user) {
      // Show auth dialog if user is not logged in
      setAuthDialogOpen(true);
      // Store the product they wanted to buy
      setSelectedProduct({ priceId, name: productName });
      return;
    }

    // User is logged in, proceed with checkout
    setSelectedProduct({ priceId, name: productName });
    setCheckoutOpen(true);
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    // After successful auth, open checkout with the selected product
    if (selectedProduct) {
      setCheckoutOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block relative mb-6">
              <div
                className="absolute inset-0 bg-white shadow-lg"
                style={{
                  margin: '-12px -20px',
                  border: '4px solid #faa939',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                }}
              ></div>
              <h1 className="text-4xl md:text-5xl font-handwriting-bold relative px-6 py-2" style={{
                letterSpacing: '0.05em',
                color: '#faa939',
                textShadow: '-1px 1px 0px #b66a00, -2px 2px 0px #b66a00'
              }}>
                SIMPLE PRICING
              </h1>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Create amazing talking dog videos at an affordable price
            </p>
          </div>


          {/* Pay As You Go Section */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
              Pay As You Go
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* 3 Video Pack */}
              <Card className="p-6 border-2 hover:border-primary/40 transition-colors shadow-lg flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {PRODUCTS.THREE_PACK.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {PRODUCTS.THREE_PACK.description}
                  </p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-primary">${PRODUCTS.THREE_PACK.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">for {PRODUCTS.THREE_PACK.credits} videos</p>
                  <p className="text-xs text-muted-foreground">(${(PRODUCTS.THREE_PACK.price / PRODUCTS.THREE_PACK.credits).toFixed(2)} per video)</p>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">One-time payment</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">8 seconds per video</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">Download and share anywhere</p>
                  </div>
                </div>

                <Button
                  size="default"
                  className="w-full font-semibold"
                  data-testid="button-buy-now-3-pack"
                  onClick={() => handleBuyNow(PRODUCTS.THREE_PACK.priceId, PRODUCTS.THREE_PACK.name)}
                >
                  Buy Now
                </Button>
              </Card>

              {/* 10 Video Pack */}
              <Card className="p-6 border-2 hover:border-primary/40 transition-colors shadow-lg flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {PRODUCTS.TEN_PACK.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {PRODUCTS.TEN_PACK.description}
                  </p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-primary">${PRODUCTS.TEN_PACK.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">for {PRODUCTS.TEN_PACK.credits} videos</p>
                  <p className="text-xs text-muted-foreground">(${(PRODUCTS.TEN_PACK.price / PRODUCTS.TEN_PACK.credits).toFixed(2)} per video)</p>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">One-time payment</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">8 seconds per video</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">Download and share anywhere</p>
                  </div>
                </div>

                <Button
                  size="default"
                  className="w-full font-semibold"
                  data-testid="button-buy-now-10-pack"
                  onClick={() => handleBuyNow(PRODUCTS.TEN_PACK.priceId, PRODUCTS.TEN_PACK.name)}
                >
                  Buy Now
                </Button>
              </Card>
            </div>
          </div>

          {/* Monthly Subscriptions Section */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
              Monthly Subscriptions
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6">
              {/* Monthly Subscription */}
              <Card className="p-6 border-2 hover:border-primary/40 transition-colors shadow-lg flex flex-col">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {PRODUCTS.MONTHLY_SUBSCRIPTION.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {PRODUCTS.MONTHLY_SUBSCRIPTION.description}
                  </p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-primary">${PRODUCTS.MONTHLY_SUBSCRIPTION.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{PRODUCTS.MONTHLY_SUBSCRIPTION.credits} videos per month</p>
                  <p className="text-xs text-muted-foreground">(${(PRODUCTS.MONTHLY_SUBSCRIPTION.price / PRODUCTS.MONTHLY_SUBSCRIPTION.credits).toFixed(2)} per video)</p>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">20 videos every month</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">Cancel anytime</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">8 seconds per video</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">Download and share anywhere</p>
                  </div>
                </div>

                <Button
                  size="default"
                  className="w-full font-semibold"
                  data-testid="button-buy-now-monthly"
                  onClick={() => handleBuyNow(PRODUCTS.MONTHLY_SUBSCRIPTION.priceId, PRODUCTS.MONTHLY_SUBSCRIPTION.name)}
                >
                  Subscribe Monthly
                </Button>
              </Card>

              {/* Annual Subscription - Best Value */}
              <Card className="p-6 border-2 border-primary shadow-lg relative flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-semibold">
                    Best Value
                  </span>
                </div>

                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    {PRODUCTS.ANNUAL_SUBSCRIPTION.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {PRODUCTS.ANNUAL_SUBSCRIPTION.description}
                  </p>
                </div>

                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-primary">${PRODUCTS.ANNUAL_SUBSCRIPTION.price}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{PRODUCTS.ANNUAL_SUBSCRIPTION.credits} videos per year</p>
                  <p className="text-xs text-muted-foreground">(${(PRODUCTS.ANNUAL_SUBSCRIPTION.price / PRODUCTS.ANNUAL_SUBSCRIPTION.credits).toFixed(2)} per video)</p>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">240 videos per year (20/month)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">Save $60 vs monthly plan</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">Cancel anytime</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">8 seconds per video</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground">Download and share anywhere</p>
                  </div>
                </div>

                <Button
                  size="default"
                  className="w-full font-semibold"
                  data-testid="button-buy-now-annual"
                  onClick={() => handleBuyNow(PRODUCTS.ANNUAL_SUBSCRIPTION.priceId, PRODUCTS.ANNUAL_SUBSCRIPTION.name)}
                >
                  Subscribe Annually
                </Button>
              </Card>
            </div>

            {/* Enterprise/Custom Pricing Card */}
            <Card className="p-6 max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Need More Videos?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Contact us to discuss a custom pricing plan tailored to your needs
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => window.location.href = 'mailto:makemydogtalk@gmail.com?subject=Custom%20Pricing%20Inquiry'}
                >
                  <Mail className="h-4 w-4" />
                  Contact for Custom Pricing
                </Button>
              </div>
            </Card>
          </div>

{/* Promo Code Section */}
<Card className="p-4 max-w-2xl mx-auto bg-muted/30 border-2 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Have a promo code?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Apply it at checkout to receive your discount or extra credits when you create your video.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Questions about pricing? <a href="mailto:makemydogtalk@gmail.com" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />

      {/* Checkout Dialog */}
      {selectedProduct && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          priceId={selectedProduct.priceId}
          productName={selectedProduct.name}
        />
      )}

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
