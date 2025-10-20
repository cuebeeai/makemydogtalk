import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Try it out",
    features: [
      "1 video generation",
      "6-second video length",
      "With watermark",
      "Basic quality",
    ],
    cta: "Get Started Free",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$5",
    description: "Per video",
    features: [
      "Single video",
      "6-second video length",
      "No watermark",
      "High quality",
    ],
    cta: "Buy Now",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Bundle",
    price: "$20",
    description: "5 videos",
    features: [
      "5 video generations",
      "6-second video length",
      "No watermark",
      "High quality",
      "Save $5",
    ],
    cta: "Get Bundle",
    variant: "outline" as const,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
          Simple Pricing
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Choose the plan that works best for you
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 space-y-6 relative hover-elevate transition-all ${
                plan.popular ? 'border-primary border-2' : ''
              }`}
              data-testid={`card-pricing-${index}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-card-foreground">{plan.name}</h3>
                <div className="text-4xl font-bold text-foreground">{plan.price}</div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.variant}
                size="lg"
                className="w-full"
                onClick={() => console.log(`Selected ${plan.name} plan`)}
                data-testid={`button-select-${plan.name.toLowerCase()}`}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
