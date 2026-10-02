'use client';

import React from 'react';
import { Play, Sparkles, AlertCircle } from 'lucide-react';
import type { VideoBlock } from '@ai-news/schemas';

const resolveVideoUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '/videos/starship-downlink.mp4';
  const lower = rawUrl.toLowerCase();
  // Known 403 or broken external domains
  if (
    lower.includes('gtv-videos-bucket') ||
    lower.includes('commondatastorage.googleapis.com') ||
    lower.includes('example.com') ||
    lower.includes('placeholder')
  ) {
    return '/videos/starship-downlink.mp4';
  }
  return rawUrl;
};

export const VideoBlockView: React.FC<{ data: VideoBlock['data'] }> = ({ data }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const resolvedUrl = React.useMemo(() => resolveVideoUrl(data.url), [data.url]);
  const [currentUrl, setCurrentUrl] = React.useState<string>(resolvedUrl);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [fallbackAttempted, setFallbackAttempted] = React.useState(false);

  // Sync state when data.url changes
  React.useEffect(() => {
    setCurrentUrl(resolveVideoUrl(data.url));
    setHasError(false);
    setFallbackAttempted(false);
  }, [data.url]);

  const handleVideoError = () => {
    if (!fallbackAttempted && currentUrl !== '/videos/starship-downlink.mp4') {
      setFallbackAttempted(true);
      setCurrentUrl('/videos/starship-downlink.mp4');
      if (videoRef.current) {
        videoRef.current.load();
      }
    } else {
      setHasError(true);
    }
  };

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          handleVideoError();
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const aspectClass =
    data.aspectRatio === '9:16'
      ? 'aspect-[9/16] max-w-sm mx-auto'
      : data.aspectRatio === '1:1'
        ? 'aspect-square max-w-lg mx-auto'
        : 'aspect-video w-full';

  return (
    <div className="my-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md transition-all">
      <div
        className={`relative ${aspectClass} bg-slate-950 group select-none overflow-hidden flex items-center justify-center`}
      >
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-900/90 z-20">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
            <p className="text-sm font-semibold text-slate-200">
              Video source temporarily unavailable
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              The external stream could not be loaded. You can watch the built-in downlink recording
              instead.
            </p>
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setCurrentUrl('/videos/starship-downlink.mp4');
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              Play Backup Downlink Video
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={currentUrl}
              poster={data.posterUrl}
              controls
              playsInline
              preload="metadata"
              onError={handleVideoError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            />

            {/* Play button overlay when paused */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handlePlayToggle}
                className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-900/40 backdrop-blur-xs transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer z-10"
                aria-label="Play Video"
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1" fill="currentColor" />
              </button>
            )}

            {/* Duration pill badge */}
            {data.durationSeconds && !isPlaying && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/80 text-[11px] font-mono font-medium text-slate-200 backdrop-blur-xs pointer-events-none z-10 border border-white/10">
                {Math.floor(data.durationSeconds / 60)}:
                {(data.durationSeconds % 60).toString().padStart(2, '0')}
              </div>
            )}
          </>
        )}
      </div>

      {data.caption && (
        <div className="px-5 py-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800/80 flex items-start gap-2.5">
          <span className="inline-block mt-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <p className="leading-relaxed">{data.caption}</p>
        </div>
      )}

      {data.transcription && (
        <details className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 transition-colors group">
          <summary className="px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Video Transcript & Verified Telemetry
            </span>
            <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="px-5 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-line leading-relaxed border-t border-slate-200/50 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/50">
            {data.transcription}
          </div>
        </details>
      )}
    </div>
  );
};
