import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Tag } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import CheckoutDialog from "@/components/CheckoutDialog";

export default function Pricing() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ priceId: string; name: string } | null>(null);

  const handleOpenCheckout = (product: { priceId: string; name: string }) => {
    setSelectedProduct(product);
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Simple Pricing
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Create amazing talking dog videos at an affordable price
            </p>
          </div>


          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Jump The Line - Single Video */}
            <Card className="p-6 border-2 hover:border-primary/40 transition-colors shadow-lg flex flex-col">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {PRODUCTS.JUMP_LINE.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Try it out with one video
                </p>
              </div>

              <div className="text-center mb-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-primary">${PRODUCTS.JUMP_LINE.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">for {PRODUCTS.JUMP_LINE.credits} video</p>
              </div>

              <div className="space-y-2 mb-4 flex-1">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">1 high-quality talking dog video</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">6 seconds per video</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">Download and share anywhere</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">Priority Video Generation* </p>
                </div>
              </div>

              <Button
                size="default"
                className="w-full font-semibold"
                data-testid="button-buy-now-single"
                onClick={() => handleOpenCheckout({ priceId: PRODUCTS.JUMP_LINE.priceId, name: PRODUCTS.JUMP_LINE.name })}
              >
                Buy Now
              </Button>
            </Card>

            {/* 3 Video Pack - Best Value */}
            <Card className="p-6 border-2 border-primary shadow-lg relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-semibold">
                  Best Value
                </span>
              </div>

              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {PRODUCTS.THREE_PACK.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Perfect for multiple occasions
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
                  <p className="text-sm text-foreground">3 high-quality talking dog videos</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">6 seconds per video</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">Download and share anywhere</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">Priority Video Generation* </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground font-semibold">Save ${((PRODUCTS.JUMP_LINE.price * 3) - PRODUCTS.THREE_PACK.price).toFixed(2)}</p>
                </div>
              </div>

              <Button
                size="default"
                className="w-full font-semibold"
                data-testid="button-buy-now-pack"
                onClick={() => handleOpenCheckout({ priceId: PRODUCTS.THREE_PACK.priceId, name: PRODUCTS.THREE_PACK.name })}
              >
                Buy Now
              </Button>
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
              Questions about pricing? <a href="mailto:hello@makemydogtalk.com" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
      {selectedProduct && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          priceId={selectedProduct.priceId}
          productName={selectedProduct.name}
        />
      )}
    </div>
  );
}
