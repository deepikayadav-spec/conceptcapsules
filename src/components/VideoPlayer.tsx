import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  CheckCircle2,
  SkipForward,
  FileText,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopicBadge } from '@/components/TopicBadge';
import { Byte } from '@/types/byte';
import { NotesModal } from '@/components/NotesModal';
import { VideoActions } from '@/components/VideoActions';
import { driveUrlToDirect, driveUrlToPreview } from '@/lib/driveUrl';

interface VideoPlayerProps {
  byte: Byte;
  byteNumber: number;
  totalBytes: number;
  isCompleted: boolean;
  currentProgress: number;
  nextByte: Byte | null;
  onPrevious: () => void;
  onNext: () => void;
  onProgressUpdate: (percentage: number) => void;
  onMarkCompleted: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  autoStart?: boolean;
}

/**
 * Video Player Component
 * 
 * Uses HTML5 video element for accurate progress tracking.
 * Falls back to iframe for Google Drive if direct video fails.
 */
export function VideoPlayer({
  byte,
  byteNumber,
  totalBytes,
  isCompleted,
  currentProgress,
  nextByte,
  onPrevious,
  onNext,
  onProgressUpdate,
  onMarkCompleted,
  isFullscreen,
  onToggleFullscreen,
  autoStart = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [useFallbackIframe, setUseFallbackIframe] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const didMarkCompletedRef = useRef(false);
  
  // For iframe fallback - simulated tracking
  const [iframeWatchTime, setIframeWatchTime] = useState(0);
  const [iframeIsWatching, setIframeIsWatching] = useState(false);
  const iframeIntervalRef = useRef<number | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);
  
  const ESTIMATED_VIDEO_DURATION = 60; // For iframe fallback

  // Track tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Reset state when byte changes
  useEffect(() => {
    setLoopCount(0);
    setIsPlaying(false);
    didMarkCompletedRef.current = false;
    setVideoError(false);
    setUseFallbackIframe(false);
    setIframeWatchTime(0);
    setIframeIsWatching(true); // Auto-start tracking for iframe fallback
    
    // Clear iframe interval
    if (iframeIntervalRef.current) {
      clearInterval(iframeIntervalRef.current);
      iframeIntervalRef.current = null;
    }

    // Reset video element
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [byte.byte_id]);

  // Handle video time updates - ONLY updates progress when video is actually playing
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused || !video.duration || video.duration === 0) return;
    
    const percentage = (video.currentTime / video.duration) * 100;
    
    // Only update if greater than current progress (no regression)
    if (percentage > currentProgress && !isCompleted) {
      onProgressUpdate(percentage);
    }
    
    // Mark completed at 95%
    if (percentage >= 95 && !isCompleted && !didMarkCompletedRef.current) {
      didMarkCompletedRef.current = true;
      onMarkCompleted();
    }
  }, [currentProgress, isCompleted, onProgressUpdate, onMarkCompleted]);

  // Handle video ended event - marks completion immediately
  const handleVideoEnded = useCallback(() => {
    if (!isCompleted && !didMarkCompletedRef.current) {
      didMarkCompletedRef.current = true;
      onProgressUpdate(100);
      onMarkCompleted();
    }
    
    // Increment loop count for auto-advance
    setLoopCount(prev => prev + 1);
    
    // Loop the video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }
  }, [isCompleted, onProgressUpdate, onMarkCompleted]);

  // Handle play/pause events
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Handle video error - fall back to iframe
  const handleVideoError = useCallback(() => {
    console.warn('HTML5 video failed to load, falling back to iframe');
    setVideoError(true);
    setUseFallbackIframe(true);
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  // Restart video
  const restartVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = 0;
    video.play().catch(console.error);
  }, []);

  // Auto-advance after 3 loops
  useEffect(() => {
    if (loopCount === 3 && nextByte) {
      const timer = setTimeout(() => {
        onNext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loopCount, nextByte, onNext]);

  // === IFRAME FALLBACK LOGIC ===
  // Only runs when using iframe fallback mode
  
  // Handle iframe click to start tracking
  const handleIframeClick = useCallback(() => {
    setIframeIsWatching(true);
  }, []);

  // Iframe simulated progress tracking
  useEffect(() => {
    if (!useFallbackIframe || !iframeIsWatching || !isTabVisible) {
      if (iframeIntervalRef.current) {
        clearInterval(iframeIntervalRef.current);
        iframeIntervalRef.current = null;
      }
      return;
    }

    iframeIntervalRef.current = window.setInterval(() => {
      setIframeWatchTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (iframeIntervalRef.current) {
        clearInterval(iframeIntervalRef.current);
        iframeIntervalRef.current = null;
      }
    };
  }, [useFallbackIframe, iframeIsWatching, isTabVisible]);

  // Update progress from iframe watch time
  useEffect(() => {
    if (!useFallbackIframe || !iframeIsWatching || !isTabVisible) return;

    const percentage = Math.min((iframeWatchTime / ESTIMATED_VIDEO_DURATION) * 100, 100);

    if (!isCompleted && percentage > currentProgress) {
      onProgressUpdate(percentage);
    }
    
    // Mark completed at 95%
    if (percentage >= 95 && !isCompleted && !didMarkCompletedRef.current) {
      didMarkCompletedRef.current = true;
      onMarkCompleted();
    }
    
    // Handle loop for iframe
    if (iframeWatchTime >= ESTIMATED_VIDEO_DURATION) {
      setLoopCount(prev => prev + 1);
      setIframeWatchTime(0);
    }
  }, [iframeWatchTime, useFallbackIframe, iframeIsWatching, isTabVisible, isCompleted, currentProgress, onProgressUpdate, onMarkCompleted]);

  // Get video URLs
  const directUrl = driveUrlToDirect(byte.byte_url);
  const previewUrl = driveUrlToPreview(byte.byte_url);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleToggleFullscreen = useCallback(() => {
    onToggleFullscreen();
  }, [onToggleFullscreen]);

  const handlePlayNext = useCallback(() => {
    if (nextByte) {
      onNext();
    }
  }, [nextByte, onNext]);

  return (
    <>
      <motion.div
        ref={containerRef}
        layout
        className="flex flex-col h-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-medium text-muted-foreground uppercase tracking-wide ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                Byte {byteNumber} of {totalBytes}
              </span>
              {isCompleted && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex items-center gap-1 font-medium text-primary ${isFullscreen ? 'text-sm' : 'text-xs'}`}
                >
                  <CheckCircle2 className={isFullscreen ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                  Completed
                </motion.span>
              )}
            </div>
            <h2 className={`font-display font-bold text-foreground truncate ${isFullscreen ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'}`}>
              {byte.byte_description}
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {byte.byte_topics.map(topic => (
                <TopicBadge key={topic} topic={topic} size={isFullscreen ? 'md' : 'sm'} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotesOpen(!notesOpen)}
              className="rounded-xl gap-2"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFullscreen}
              className="rounded-xl hover:bg-muted"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Video Container - Vertical/Shorts aspect ratio */}
        <div 
          className="relative flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-2xl overflow-hidden"
          onContextMenu={handleContextMenu}
        >
          {/* Video wrapper with proper vertical aspect ratio */}
          <div 
            className="relative bg-black rounded-xl overflow-hidden no-context-menu"
            style={{
              maxHeight: isFullscreen ? '90vh' : '70vh',
              maxWidth: isFullscreen ? '500px' : '420px',
              width: '100%',
              aspectRatio: '9/16',
            }}
          >
            {!useFallbackIframe ? (
              /* HTML5 Video Player - Primary */
              <>
                <video
                  ref={videoRef}
                  key={byte.byte_id}
                  src={directUrl}
                  className="absolute inset-0 w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onError={handleVideoError}
                  playsInline
                  preload="metadata"
                />
                
                {/* Play/Pause overlay button */}
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-transparent group"
                >
                  {!isPlaying && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:bg-primary transition-colors"
                    >
                      <Play className="w-10 h-10 text-primary-foreground ml-1" />
                    </motion.div>
                  )}
                </button>
                
                {/* Video controls */}
                {isPlaying && (
                  <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                      className="rounded-full w-10 h-10 bg-black/60 hover:bg-black/80"
                    >
                      <Pause className="w-5 h-5 text-white" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); restartVideo(); }}
                      className="rounded-full w-10 h-10 bg-black/60 hover:bg-black/80"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Iframe Fallback - for when direct video fails */
              <>
                <div className="absolute inset-0 overflow-hidden">
                  <iframe
                    src={previewUrl}
                    className="absolute w-full"
                    style={{ 
                      objectFit: 'contain',
                      top: '-48px',
                      height: 'calc(100% + 48px)',
                    }}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={byte.byte_description}
                  />
                </div>
                
                
                {/* Click blocker for toolbar area */}
                <div 
                  className="absolute top-0 right-0 w-20 h-8 z-10 pointer-events-auto"
                  style={{ borderTopRightRadius: '12px' }}
                />
              </>
            )}

            {/* Video Actions - Like & Feedback (inside video) */}
            <VideoActions byteId={byte.byte_id} />
          </div>
          
          {/* Up Next Card - Bottom right corner */}
          {nextByte && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handlePlayNext}
              className="absolute bottom-4 right-4 glass rounded-xl p-3 max-w-xs cursor-pointer hover:bg-muted/80 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg gradient-secondary shrink-0 group-hover:scale-105 transition-transform">
                  <SkipForward className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="min-w-0 text-left">
                  <p className={`text-muted-foreground font-medium ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Up Next</p>
                  <p className={`font-semibold text-foreground truncate max-w-[160px] ${isFullscreen ? 'text-base' : 'text-sm'}`}>
                    {nextByte.byte_description}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {nextByte.byte_topics.slice(0, 1).map(topic => (
                      <TopicBadge key={topic} topic={topic} size="sm" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center mt-4 gap-3 shrink-0 flex-wrap">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={byteNumber === 1}
            className={`rounded-xl gap-2 ${isFullscreen ? 'text-base px-5 py-2.5' : ''}`}
          >
            <ChevronLeft className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <Button
            variant="outline"
            onClick={onNext}
            disabled={byteNumber === totalBytes}
            className={`rounded-xl gap-2 ${isFullscreen ? 'text-base px-5 py-2.5' : ''}`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} />
          </Button>
        </div>

      </motion.div>

      {/* Notes Panel */}
      <NotesModal
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
      />
    </>
  );
}
