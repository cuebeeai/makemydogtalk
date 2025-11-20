import { useState, useEffect } from "react";
import { Play, X, Minimize2 } from "lucide-react";

interface VideoCollageProps {
  videos: {
    videoUrl: string;
    thumbnailUrl: string;
    title: string;
  }[];
}

export default function VideoCollage({ videos }: VideoCollageProps) {
  const [expandedVideo, setExpandedVideo] = useState<{ url: string; title: string; index: number } | null>(null);

  // Ensure we have exactly 5 videos for the collage
  const collageVideos = videos.slice(0, 5);

  // Handle ESC key to close expanded video
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedVideo) {
        setExpandedVideo(null);
      }
    };

    if (expandedVideo) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [expandedVideo]);

  return (
    <div className="relative w-full h-full p-2">
      {/* Pinterest-style Masonry Grid Layout */}
      <div className="grid grid-cols-2 gap-2 h-full">
        {/* Left Column */}
        <div className="flex flex-col gap-2 h-full">
          {/* Video 0 - Small square at top */}
          <div
            className={`relative overflow-hidden cursor-pointer group rounded-lg transition-all ${
              expandedVideo?.index === 0 ? 'opacity-50' : 'opacity-100'
            }`}
            style={{ height: 'calc(38% - 4px)' }}
            onClick={() => setExpandedVideo({ url: collageVideos[0].videoUrl, title: collageVideos[0].title, index: 0 })}
          >
            <img
              src={collageVideos[0].thumbnailUrl}
              alt={collageVideos[0].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-xl">
                <Play className="h-5 w-5 text-primary fill-primary ml-0.5" />
              </div>
            </div>
          </div>

          {/* Video 1 - Tall rectangle */}
          <div
            className={`relative overflow-hidden cursor-pointer group rounded-lg transition-all ${
              expandedVideo?.index === 1 ? 'opacity-50' : 'opacity-100'
            }`}
            style={{ height: 'calc(62% - 4px)' }}
            onClick={() => setExpandedVideo({ url: collageVideos[1].videoUrl, title: collageVideos[1].title, index: 1 })}
          >
            <img
              src={collageVideos[1].thumbnailUrl}
              alt={collageVideos[1].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-xl">
                <Play className="h-5 w-5 text-primary fill-primary ml-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-2 h-full">
          {/* Video 2 - Medium rectangle at top */}
          <div
            className={`relative overflow-hidden cursor-pointer group rounded-lg transition-all ${
              expandedVideo?.index === 2 ? 'opacity-50' : 'opacity-100'
            }`}
            style={{ height: 'calc(48% - 5px)' }}
            onClick={() => setExpandedVideo({ url: collageVideos[2].videoUrl, title: collageVideos[2].title, index: 2 })}
          >
            <img
              src={collageVideos[2].thumbnailUrl}
              alt={collageVideos[2].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-xl">
                <Play className="h-5 w-5 text-primary fill-primary ml-0.5" />
              </div>
            </div>
          </div>

          {/* Video 3 - Small square */}
          <div
            className={`relative overflow-hidden cursor-pointer group rounded-lg transition-all ${
              expandedVideo?.index === 3 ? 'opacity-50' : 'opacity-100'
            }`}
            style={{ height: 'calc(22% - 5px)' }}
            onClick={() => setExpandedVideo({ url: collageVideos[3].videoUrl, title: collageVideos[3].title, index: 3 })}
          >
            <img
              src={collageVideos[3].thumbnailUrl}
              alt={collageVideos[3].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-xl">
                <Play className="h-5 w-5 text-primary fill-primary ml-0.5" />
              </div>
            </div>
          </div>

          {/* Video 4 - Wide rectangle at bottom */}
          <div
            className={`relative overflow-hidden cursor-pointer group rounded-lg transition-all ${
              expandedVideo?.index === 4 ? 'opacity-50' : 'opacity-100'
            }`}
            style={{ height: 'calc(30% - 6px)' }}
            onClick={() => setExpandedVideo({ url: collageVideos[4].videoUrl, title: collageVideos[4].title, index: 4 })}
          >
            <img
              src={collageVideos[4].thumbnailUrl}
              alt={collageVideos[4].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-xl">
                <Play className="h-5 w-5 text-primary fill-primary ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Video Overlay */}
      {expandedVideo && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setExpandedVideo(null)}
        >
          <div className="relative w-full h-full max-w-3xl max-h-full p-4 flex items-center justify-center">
            {/* Close/Collapse Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedVideo(null);
              }}
              className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-xl group"
              aria-label="Close video"
            >
              <X className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            </button>

            {/* Video Player */}
            <div
              className="relative w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                key={expandedVideo.url}
                src={expandedVideo.url}
                controls
                autoPlay
                preload="auto"
                playsInline
                className="w-full rounded-lg shadow-2xl"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
                onError={(e) => {
                  console.error("Video playback error:", e);
                  console.error("Video src:", expandedVideo.url);
                  console.error("Error details:", e.currentTarget.error);
                }}
                onLoadedData={() => {
                  console.log("Video loaded successfully:", expandedVideo.url);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
