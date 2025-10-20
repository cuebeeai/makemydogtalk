import { Gift, Sparkles, UserX, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Gift,
    title: "One Free Video",
    description: "Every user gets their first video completely free - no credit card required!",
  },
  {
    icon: Sparkles,
    title: "Custom Animation",
    description: "Your real dog photo transformed with AI magic into a unique talking video.",
  },
  {
    icon: UserX,
    title: "No Sign-Up Required",
    description: "Start creating immediately - no account needed to try it out!",
  },
  {
    icon: Crown,
    title: "Watermark Removal",
    description: "Upgrade to remove the watermark and get pristine, shareable videos.",
  },
];

export default function WhyChooseUs() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground lowercase">
          why choose us?
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 text-center space-y-4 hover-elevate transition-all"
                data-testid={`card-feature-${index}`}
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
