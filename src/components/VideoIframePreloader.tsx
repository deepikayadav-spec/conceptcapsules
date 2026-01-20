import { useEffect, useState, useRef } from "react";

interface VideoIframePreloaderProps {
  src: string;
  enabled?: boolean;
  onPreloaded?: () => void;
}

/**
 * Preloads a Google Drive preview iframe offscreen to reduce perceived load time
 * when switching to the next video. Starts preloading after a short delay to
 * prioritize the current video's loading.
 */
export function VideoIframePreloader({ src, enabled = true, onPreloaded }: VideoIframePreloaderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any existing timeout when src changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setShouldLoad(false);
    
    if (enabled && src) {
      // Delay preloading by 2 seconds to prioritize current video
      timeoutRef.current = window.setTimeout(() => {
        setShouldLoad(true);
      }, 2000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, src]);

  if (!shouldLoad) return null;

  return (
    <iframe
      key={src}
      src={src}
      title="Video preloader"
      aria-hidden="true"
      tabIndex={-1}
      onLoad={onPreloaded}
      className="absolute -left-[9999px] -top-[9999px] w-[1px] h-[1px] opacity-0 pointer-events-none"
      allow="autoplay; encrypted-media"
      loading="eager"
    />
  );
}
