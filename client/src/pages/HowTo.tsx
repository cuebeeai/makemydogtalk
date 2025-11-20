import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Upload, Sparkles, MessageSquare, Mic, Video, Zap, Lightbulb, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function HowTo() {
  const steps = [
    {
      icon: Upload,
      number: "1",
      title: "Pick Your Dog Image",
      description: "Start with a photo of your dog (or any dog). Any angle, any breed — it all works.",
    },
    {
      icon: Sparkles,
      number: "2",
      title: "(Optional) Edit or Enhance the Photo Using AI",
      description: "If you want the dog in a fun setting — like a TED Talk stage, a comedy club, or a pirate ship — upload your image into ChatGPT and ask it to generate a new edited version. This step is optional, but it can make your final video funnier or more thematic.",
    },
    {
      icon: Lightbulb,
      number: "3",
      title: "Use AI to Brainstorm Your Script (Optional but Powerful)",
      description: "Upload the photo to ChatGPT and ask for a script, joke, or voiceover idea for your dog.",
      bullets: [
        "A specific tone (sassy, shy, dramatic, pirate, baby voice, etc.)",
        "A specific theme (stand-up comedy, therapist dog, coach dog, CEO dog)",
        "Multi-dog conversations (\"Dog 1:\" \"Dog 2:\" etc.)",
      ],
      note: "This step helps spark creativity and produces better final videos.",
    },
    {
      icon: Upload,
      number: "4",
      title: "Upload Your (Edited or Original) Dog Image to MakeMyDogTalk",
      description: "Click Upload Image and select the dog photo you're ready to animate.",
    },
    {
      icon: Mic,
      number: "5",
      title: "Choose Your Dog's Tone of Voice",
      description: "Define the style the dog will talk in.",
      examples: [
        "\"Happy, high-energy female\"",
        "\"Sarcastic, dry humor male\"",
        "\"Cute puppy voice\"",
        "\"Deep pirate voice with attitude\"",
      ],
      note: "The more specific you are, the better the results.",
    },
    {
      icon: Video,
      number: "6",
      title: "Tell the System What the Dog Is Doing",
      description: "Give a quick description of the dog's action based on the image.",
      examples: [
        "\"Dog standing at a podium, giving a TED Talk\"",
        "\"Dog sitting in a car, looking nervous\"",
        "\"Dog lounging on couch, looks judgmental\"",
      ],
      note: "This helps the AI match the voice to the moment.",
    },
    {
      icon: MessageSquare,
      number: "7",
      title: "Enter the Exact Script You Want the Dog to Say",
      description: "Type in your dialogue exactly as you want it spoken.",
      multiCharacter: true,
      note: "You can copy the script directly from ChatGPT if you generated one there.",
    },
    {
      icon: Zap,
      number: "8",
      title: "Click Generate and Use One Credit",
      description: "Hit the button, let the AI do its magic, and your fully animated dog video will be ready in seconds.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-6">
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
                TIPS & TRICKS
              </h1>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Once you're logged in, here's the exact step-by-step process to create the funniest, most viral-ready dog talking videos
            </p>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="p-6 md:p-8 border-2"
                data-testid={`card-step-${index + 1}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Step {step.number}: {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {step.description}
                    </p>

                    {step.bullets && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-foreground mb-2">You can request:</p>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {step.bullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-primary font-bold mt-0.5">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.examples && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-foreground mb-2">Examples:</p>
                        <ul className="space-y-1.5 text-muted-foreground">
                          {step.examples.map((example, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-primary font-bold mt-0.5">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.multiCharacter && (
                      <div className="mb-3 bg-muted/30 p-4 rounded-lg border border-primary/10">
                        <p className="text-sm font-semibold text-foreground mb-2">For multiple characters, use clear labels:</p>
                        <div className="font-mono text-sm text-muted-foreground space-y-1">
                          <div>Dog 1: ...</div>
                          <div>Dog 2: ...</div>
                          <div>Narrator: ...</div>
                        </div>
                      </div>
                    )}

                    {step.note && (
                      <p className="text-sm italic text-primary/80">
                        {step.note}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-16">
            <Card className="p-8 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Pro Tips for Viral-Ready Videos
                </h2>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg">✨</span>
                  <span><strong className="text-foreground">Be specific with voice descriptions:</strong> "Sassy female with attitude" works better than just "female voice"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg">🎭</span>
                  <span><strong className="text-foreground">Match tone to setting:</strong> Use ChatGPT to create themed environments that match your script</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg">🎬</span>
                  <span><strong className="text-foreground">Multi-dog conversations:</strong> Create hilarious dialogues by using "Dog 1:" and "Dog 2:" labels</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg">💡</span>
                  <span><strong className="text-foreground">Let AI help you brainstorm:</strong> Upload your photo to ChatGPT and ask for script ideas</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg">⏱️</span>
                  <span><strong className="text-foreground">Keep it punchy:</strong> Videos are 8 seconds long - perfect for social media sharing</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
