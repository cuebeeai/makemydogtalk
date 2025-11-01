import { Camera, MessageSquare, Sparkles, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Recommendations() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Tips for Best Results
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Follow these recommendations to create amazing talking dog videos
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {/* Tip 1 - Photo Quality */}
          <AccordionItem
            value="item-1"
            className="border-2 border-primary/20 rounded-xl px-6 bg-gradient-to-br from-primary/5 to-accent/5 data-[state=open]:border-primary/40"
          >
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  How should I choose the right photo?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-5">
              <div className="pl-14 space-y-3">
                <p className="text-muted-foreground mb-4">
                  The quality of your photo directly affects the final video. Here's what works best:
                </p>
                <ul className="space-y-2.5 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Front-facing or side angle:</strong> Make sure your dog's face is clearly visible</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Good lighting:</strong> Natural light works best - avoid dark or backlit photos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Clear focus:</strong> Avoid blurry images or photos where the dog is far away</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Mouth visibility:</strong> Photos where you can see the mouth area produce better results</span>
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Tip 2 - Script Writing */}
          <AccordionItem
            value="item-2"
            className="border-2 border-primary/20 rounded-xl px-6 bg-gradient-to-br from-primary/5 to-accent/5 data-[state=open]:border-primary/40"
          >
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  What makes a good script for my dog?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-5">
              <div className="pl-14 space-y-3">
                <p className="text-muted-foreground mb-4">
                  Writing natural, conversational dialogue helps create more engaging videos:
                </p>
                <ul className="space-y-2.5 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Keep it short:</strong> Aim for 1-3 sentences that fit naturally in an 8-second video</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Use everyday language:</strong> Write like your dog would actually speak</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Add personality:</strong> Include emotions, exclamations, or your dog's unique quirks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Be conversational:</strong> Imagine what your dog would say if they could talk</span>
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Tip 3 - Voice Style */}
          <AccordionItem
            value="item-3"
            className="border-2 border-primary/20 rounded-xl px-6 bg-gradient-to-br from-primary/5 to-accent/5 data-[state=open]:border-primary/40"
          >
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-semibold text-foreground">
                  How do I customize the voice to match my dog?
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-5">
              <div className="pl-14 space-y-3">
                <p className="text-muted-foreground mb-4">
                  The voice style field lets you describe exactly how you want your dog to sound:
                </p>
                <ul className="space-y-2.5 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Describe the tone:</strong> Try "excited and playful" or "calm and gentle"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Specify gender:</strong> "Deep male voice" or "high-pitched female voice"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Add character:</strong> "Energetic puppy voice" or "wise old dog voice"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-1 text-lg">•</span>
                    <span><strong className="text-foreground">Experiment:</strong> Try different styles to find what fits your dog's personality best</span>
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
