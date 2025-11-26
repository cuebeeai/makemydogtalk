import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Gift, TrendingUp, Heart, Calendar, Video, Briefcase, Laugh, CloudRain, Users } from "lucide-react";

const useCases = [
  {
    icon: Laugh,
    title: "Funny & Shareable Videos",
    description: [
      "Turn your dog's photo into a hilarious talking video for social media.",
      "Make your dog roast your friends, complain about the mailman, or review snacks.",
      "Create birthday messages, holiday greetings, or 'talking reaction' clips.",
    ],
  },
  {
    icon: Gift,
    title: "Personalized Gifts & Messages",
    description: [
      "Surprise someone with a video of their dog saying 'Happy Birthday' or 'I miss you.'",
      "Perfect for anniversaries, Valentine's Day, or funny breakup messages.",
      "Create 'from the dog' videos for family or coworkers — guaranteed smiles.",
    ],
  },
  {
    icon: TrendingUp,
    title: "Social Media & Marketing Content",
    description: [
      "Boost engagement by featuring your talking pet in Reels, TikToks, or Stories.",
      "Pet influencers and small pet brands can use talking dog content to stand out.",
      "Great for shelters or breeders introducing new pups with personality.",
    ],
  },
  {
    icon: Heart,
    title: "Rescue, Breeder, and Adoption Intros",
    description: [
      "Introduce adoptable dogs in a fun, emotional way — let them 'speak' for themselves.",
      "Add personality to breeder announcements ('Hi! I'm new here and ready to cuddle!').",
      "Give each puppy a unique voice for their profile video.",
    ],
  },
  {
    icon: Calendar,
    title: "Holiday Cards and Seasonal Fun",
    description: [
      "Create talking dog holiday cards or greetings for friends and family.",
      "Make themed videos like 'My dog reviewing Christmas dinner' or 'Thanksgiving leftovers.'",
      "Add custom captions, music, or voice tones for each season.",
    ],
  },
  {
    icon: Video,
    title: "Voiceover and Creative Storytelling",
    description: [
      "Bring your dog's inner monologue to life — dramatic, sarcastic, or heartwarming.",
      "Recreate memes or movie scenes starring your pup as the lead.",
      "Create short 'dog thoughts' series for YouTube Shorts or TikTok.",
    ],
  },
  {
    icon: Briefcase,
    title: "Business and Brand Promotion",
    description: [
      "Groomers, trainers, pet shops, and dog walkers can use talking dogs to advertise services.",
      "Add a talking dog mascot to your website or promotional video.",
      "Perfect for local businesses and brands looking for unique, attention-grabbing ads.",
    ],
  },
  {
    icon: Sparkles,
    title: "Just for Laughs",
    description: [
      "Make your dog complain about Mondays.",
      "Give voice to your dog's chaotic thoughts during Zoom calls.",
      "Let your pet finally say what you know they're thinking.",
    ],
  },
  {
    icon: CloudRain,
    title: "Memorial and Sentimental Videos",
    description: [
      "Recreate your late pet's voice for a heartfelt tribute or family memory.",
      "Use old photos to make one final, loving 'goodbye' video.",
      "Turn memories into moments that speak again.",
    ],
  },
  {
    icon: Users,
    title: "Kids and Family Fun",
    description: [
      "Let kids write the script and hear their dog say it out loud.",
      "Use it as a fun tool for storytelling or creative writing projects.",
      "A great family activity: 'What would Max say today?'",
    ],
  },
];

export default function UseCases() {
  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Popular Use Cases for MakeMyDogTalk.com
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Discover creative ways to bring your dog's voice to life
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {useCases.map((useCase, index) => {
            const IconComponent = useCase.icon;
            return (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-2 border-border rounded-xl px-6 bg-background hover:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-base md:text-lg font-semibold text-foreground">
                      {useCase.title}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-5">
                  <div className="pl-14 space-y-2.5">
                    {useCase.description.map((line, lineIndex) => (
                      <p key={lineIndex} className="text-sm text-muted-foreground leading-relaxed">
                        • {line}
                      </p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </section>
  );
}
