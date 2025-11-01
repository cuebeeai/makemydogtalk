import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

const samples = [
  {
    title: "Boing Intel",
    videoUrl: "/uploads/videos/1761227873195_ane3jf.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop",
  },
  {
    title: "Tom Ving'e",
    videoUrl: "/uploads/videos/1761414205882_be4lqv.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop",
  },
  {
    title: "Phoning...",
    videoUrl: "/uploads/videos/1761482054965_fi6qg.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1568572933382-74d440642117?w=300&h=300&fit=crop",
  },
  {
    title: "See Medes",
    videoUrl: "/uploads/videos/1761497132502_8bk6tm.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=300&fit=crop",
  },
];

export default function SampleVideos() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  const handleSampleClick = (videoUrl: string, title: string) => {
    setSelectedVideo(videoUrl);
    setSelectedTitle(title);
  };

  return (
    <>
      <section id="examples" className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-muted-foreground">
            Watch a Sample Video
          </h2>

          <div className="flex justify-center gap-6 md:gap-12 flex-wrap">
            {samples.map((sample, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-3 cursor-pointer group"
                onClick={() => handleSampleClick(sample.videoUrl, sample.title)}
                data-testid={`sample-video-${index}`}
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/50 transition-all group-hover:scale-105 shadow-lg">
                  <img
                    src={sample.thumbnailUrl}
                    alt={sample.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm md:text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {sample.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedTitle}</DialogTitle>
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
            aria-label="Close video"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          {selectedVideo && (
            <video
              key={selectedVideo}
              src={selectedVideo}
              controls
              autoPlay
              playsInline
              className="w-full"
              data-testid="sample-video-player"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
