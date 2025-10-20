import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
import birthdayDog from "@assets/generated_images/Corgi_birthday_celebration_339f13f0.png";
import funnyDog from "@assets/generated_images/Silly_french_bulldog_e8445150.png";
import lovingDog from "@assets/generated_images/Loving_labrador_puppy_8047c728.png";

const samples = [
  {
    title: "Birthday",
    description: "Watch your pup wish happy birthday",
    image: birthdayDog,
  },
  {
    title: "Funny Voice",
    description: "Silly voices that make everyone laugh",
    image: funnyDog,
  },
  {
    title: "Dog Says I Love You",
    description: "Heartwarming messages from your best friend",
    image: lovingDog,
  },
];

export default function SampleVideos() {
  return (
    <section id="examples" className="py-16 md:py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
          See how it works
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Check out these example videos created by our users
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {samples.map((sample, index) => (
            <Card
              key={index}
              className="overflow-hidden hover-elevate transition-all cursor-pointer"
              onClick={() => console.log(`Play ${sample.title} video`)}
              data-testid={`card-sample-${index}`}
            >
              <div className="relative aspect-square">
                <img
                  src={sample.image}
                  alt={sample.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-8 w-8 text-primary ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                  {sample.title}
                </h3>
                <p className="text-muted-foreground">
                  {sample.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
