import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

interface VideoCarouselProps {
  videos: {
    videoUrl: string;
    thumbnailUrl: string;
    title: string;
  }[];
}

export default function VideoCarousel({ videos }: VideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-advance carousel every 5 seconds when not playing
  useEffect(() => {
    if (!isPlaying && videos.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, videos.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
    setIsPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
    setIsPlaying(false);
  };

  const currentVideo = videos[currentIndex];

  if (!currentVideo) return null;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Main Video Display */}
      <div className="relative flex-1 rounded-2xl overflow-hidden bg-black/5">
        {!isPlaying ? (
          <>
            {/* Thumbnail with Play Button */}
            <img
              src={currentVideo.thumbnailUrl}
              alt={currentVideo.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/30 hover:bg-black/40 transition-all group"
            >
              <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-2xl">
                <Play className="h-10 w-10 md:h-12 md:w-12 text-primary fill-primary ml-1" />
              </div>
              <div className="px-6 py-3 bg-white/95 rounded-full shadow-xl">
                <p className="text-base md:text-lg font-bold text-foreground">
                  {currentVideo.title}
                </p>
              </div>
            </button>
          </>
        ) : (
          /* Video Player */
          <video
            key={currentVideo.videoUrl}
            src={currentVideo.videoUrl}
            controls
            autoPlay
            preload="auto"
            playsInline
            className="w-full h-full object-contain"
            onEnded={() => {
              setIsPlaying(false);
              goToNext();
            }}
            onError={(e) => {
              console.error("Video playback error:", e);
              console.error("Video src:", currentVideo.videoUrl);
              setIsPlaying(false);
            }}
            onLoadedData={() => {
              console.log("Video loaded successfully:", currentVideo.videoUrl);
            }}
          />
        )}

        {/* Navigation Arrows */}
        {!isPlaying && videos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-xl group z-10"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-xl group z-10"
              aria-label="Next video"
            >
              <ChevronRight className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation Dots */}
      {videos.length > 1 && (
        <div className="flex justify-center gap-3 mt-4 px-4">
          {videos.map((video, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsPlaying(false);
              }}
              className={`relative group transition-all ${
                index === currentIndex
                  ? "w-16 h-16 md:w-20 md:h-20"
                  : "w-12 h-12 md:w-14 md:h-14 opacity-60 hover:opacity-100"
              }`}
              aria-label={`Go to ${video.title}`}
            >
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover rounded-lg border-2 border-primary/20 group-hover:border-primary/50 transition-all"
              />
              {index === currentIndex && (
                <div className="absolute inset-0 border-3 border-primary rounded-lg"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
