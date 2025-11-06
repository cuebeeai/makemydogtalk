import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface Example {
  id: number;
  category: string;
  beforeImage: string;
  afterVideo: string;
  dialogue: string;
  voiceStyle: string;
  action: string;
}

const examples: Example[] = [
  {
    id: 1,
    category: "Content Creation",
    beforeImage: "/examples/beforeimage1.png",
    afterVideo: "/examples/afterimage1.mp4",
    dialogue: "Yeah, I drive stick. I handle corners, chase squirrels, and now I talk. Honestly, I'm basically the full package. What's your dog up to?",
    voiceStyle: "Confident Male Jock Voice",
    action: "Talking while driving assertively",
  },
  {
    id: 2,
    category: "Business Advertisement",
    beforeImage: "/examples/statelinepoolservicedog.png",
    afterVideo: "/examples/statelinepooldog.mp4",
    dialogue: "Yeah, the neighbors are jealous. But what can I say? I called Stateline Pool Service first.",
    voiceStyle: "Chill but braggy",
    action: "Relaxing poolside with confidence",
  },
  {
    id: 3,
    category: "Content Creation",
    beforeImage: "/examples/beforeimage2.png",
    afterVideo: "/examples/afterimage2.mp4",
    dialogue: "I've chewed more jerseys than the Browns have playoff wins. Still… loyal to the Dawg Pound.",
    voiceStyle: "Disappointed Old Male Voice",
    action: "Looks up disappointed, tilts head to the side, then looks away in disgust",
  },
  {
    id: 4,
    category: "Content Creation",
    beforeImage: "/examples/beforeimage4.png",
    afterVideo: "/examples/afterimage4.mp4",
    dialogue: "Placeholder dialogue for example 4",
    voiceStyle: "Placeholder voice style",
    action: "Placeholder action description",
  },
];

export default function Examples() {
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      <main className="flex-1 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block relative mb-6">
              <div
                className="absolute inset-0 bg-white transform -rotate-1 rounded-sm shadow-lg border-2"
                style={{
                  margin: '-8px -16px',
                  borderColor: '#faa939',
                  boxShadow: '3px 3px 0px #b66a00, inset 0 0 15px rgba(0,0,0,0.02)'
                }}
              ></div>
              <h1 className="text-4xl md:text-5xl font-handwriting-bold text-foreground relative px-4">
                Unlimited Use Cases
              </h1>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              From content creation to business ads, explore the endless possibilities for your talking dog videos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            {examples.map((example) => (
              <div key={example.id} className="space-y-4">
                {/* Category Tag */}
                <div className="flex justify-center">
                  <span
                    className="text-2xl font-handwriting-bold tracking-wide relative inline-block uppercase"
                    style={{
                      color: '#faa939',
                      textShadow: `-1px 1px 0px #b66a00, -2px 2px 0px #b66a00`
                    }}
                  >
                    {example.category}
                  </span>
                </div>
                {/* Before and After Frames */}
                <div className="relative flex items-center justify-center gap-8 min-h-[400px]">
                  {/* Before Frame */}
                  <div
                    className="relative transform -rotate-3 hover:rotate-0 transition-transform duration-300"
                    style={{ zIndex: playingVideo === example.id ? 1 : 2 }}
                  >
                    <div className="bg-white p-4 shadow-2xl rounded-sm">
                      <div className="absolute -bottom-3 left-4 bg-white px-3 py-1 shadow-md rounded-sm z-10">
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Before
                        </span>
                      </div>
                      <img
                        src={example.beforeImage}
                        alt="Before"
                        className="w-64 h-80 object-cover rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Transition Arrow */}
                  <div className="absolute z-30 pointer-events-none -ml-8">
                    <img
                      src="/orangearrow.png"
                      alt="Transition arrow"
                      className="w-16 h-16 drop-shadow-lg"
                    />
                  </div>

                  {/* After Frame */}
                  <div
                    className="relative transform rotate-2 hover:rotate-0 transition-transform duration-300 cursor-pointer"
                    style={{ zIndex: playingVideo === example.id ? 2 : 1 }}
                    onClick={() => setPlayingVideo(playingVideo === example.id ? null : example.id)}
                  >
                    <div className="bg-white p-4 shadow-2xl rounded-sm">
                      <div className="absolute -bottom-3 right-4 bg-white px-3 py-1 shadow-md rounded-sm z-10">
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          After
                        </span>
                      </div>
                      <div className="relative w-64 h-80 bg-black rounded-sm overflow-hidden">
                        <video
                          src={example.afterVideo}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                          loop
                          autoPlay={playingVideo === example.id}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Card */}
                <Card className="p-6 bg-[#faa939] backdrop-blur-sm shadow-[8px_8px_0px_0px_#b66a00]">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-1">
                        Dialogue
                      </h3>
                      <p className="text-lg text-white italic">
                        "{example.dialogue}"
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-1">
                          Voice Style
                        </h3>
                        <p className="text-white">{example.voiceStyle}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-1">
                          Action
                        </h3>
                        <p className="text-white">{example.action}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <Card className="p-8 bg-white/80 backdrop-blur-sm max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Ready to Make Your Dog Talk?
              </h2>
              <p className="text-muted-foreground mb-6">
                Upload your dog's photo and create your own amazing talking video in minutes!
              </p>
              <a
                href="/"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Started Now
              </a>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
