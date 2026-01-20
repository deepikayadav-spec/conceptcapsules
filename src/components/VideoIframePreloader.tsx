import { useEffect, useState } from "react";

interface VideoIframePreloaderProps {
  src: string;
  enabled?: boolean;
}

/**
 * Preloads a Google Drive preview iframe offscreen to reduce perceived load time
 * when switching to the next video.
 */
export function VideoIframePreloader({ src, enabled = true }: VideoIframePreloaderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (enabled && src) setShouldLoad(true);
  }, [enabled, src]);

  if (!shouldLoad) return null;

  return (
    <iframe
      key={src}
      src={src}
      title="Video preloader"
      aria-hidden="true"
      tabIndex={-1}
      className="absolute -left-[9999px] -top-[9999px] w-[1px] h-[1px] opacity-0 pointer-events-none"
      allow="autoplay; encrypted-media"
      loading="eager"
    />
  );
}
