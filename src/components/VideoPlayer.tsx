import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  CheckCircle2,
  SkipForward,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopicBadge } from '@/components/TopicBadge';
import { Byte } from '@/types/byte';
import { NotesModal } from '@/components/NotesModal';

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
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  autoStart?: boolean; // Auto-start watching when selected from playlist
}

/**
 * Video Player Component
 * 
 * Note: Google Drive iframes don't expose video events (timeupdate, ended).
 * Progress is simulated based on time spent watching ONLY when iframe is focused.
 * Auto-advances to next video after 3 complete loops.
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
  isFullscreen,
  onToggleFullscreen,
  autoStart = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isWatching, setIsWatching] = useState(autoStart);
  const [notesOpen, setNotesOpen] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const progressIntervalRef = useRef<number | null>(null);

  // Track tab visibility to pause progress when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Handle click on video area to start watching
  const handleVideoAreaClick = useCallback(() => {
    if (!isWatching) {
      setIsWatching(true);
    }
  }, [isWatching]);

  // Reset watch time, loop count, and start watching when byte changes (if autoStart)
  useEffect(() => {
    setWatchTime(0);
    setLoopCount(0);
    setIsWatching(autoStart); // Auto-start if selected from playlist
    // Clear previous interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, [byte.byte_id, autoStart]);

  // Simulate progress tracking (since we can't access iframe video events)
  // Assume average video is ~60 seconds for progress calculation
  const ESTIMATED_VIDEO_DURATION = 60; // seconds

  // Track watch time with interval
  useEffect(() => {
    // Don't track if already completed
    if (isCompleted) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // ONLY track progress when user is actively watching AND tab is visible
    if (!isWatching || !isTabVisible) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Update watch time every second ONLY when watching
    progressIntervalRef.current = window.setInterval(() => {
      setWatchTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [byte.byte_id, isCompleted, isWatching, isTabVisible]);

  // Calculate and update progress based on watch time
  useEffect(() => {
    if (isCompleted || !isWatching || !isTabVisible) return;
    
    const percentage = Math.min((watchTime / ESTIMATED_VIDEO_DURATION) * 100, 100);
    
    if (percentage > currentProgress) {
      onProgressUpdate(percentage);
    }
  }, [watchTime, isCompleted, isWatching, isTabVisible, currentProgress, onProgressUpdate]);

  // Track when a loop completes (progress reaches 100%)
  useEffect(() => {
    if (currentProgress >= 100 && !isCompleted) {
      setLoopCount(prev => prev + 1);
      setWatchTime(0); // Reset for next loop
    }
  }, [currentProgress, isCompleted]);

  // Auto-advance after 3 loops
  useEffect(() => {
    if (loopCount >= 3 && nextByte && !isCompleted) {
      const timer = setTimeout(() => {
        onNext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loopCount, nextByte, isCompleted, onNext]);

  // Extract file ID from Google Drive URL
  const getEmbedUrl = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) {
      onToggleFullscreen();
      return;
    }

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        onToggleFullscreen();
      });
    } else {
      document.exitFullscreen().catch(() => {
        onToggleFullscreen();
      });
    }
  }, [onToggleFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      if (isNowFullscreen !== isFullscreen) {
        onToggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen, onToggleFullscreen]);

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
        className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Byte {byteNumber} of {totalBytes}
              </span>
              {isCompleted && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 text-xs font-medium text-primary"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </motion.span>
              )}
            </div>
            <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground truncate">
              {byte.byte_description}
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {byte.byte_topics.map(topic => (
                <TopicBadge key={topic} topic={topic} />
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
          className="relative flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-2xl overflow-hidden cursor-pointer"
          onContextMenu={handleContextMenu}
          onClick={handleVideoAreaClick}
        >
          {/* Video wrapper with proper vertical aspect ratio */}
          <div 
            className="relative bg-black rounded-xl overflow-hidden no-context-menu"
            style={{
              maxHeight: '70vh',
              maxWidth: '420px',
              width: '100%',
              aspectRatio: '9/16',
            }}
          >
            <iframe
              src={getEmbedUrl(byte.byte_url)}
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'contain' }}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={byte.byte_description}
              onLoad={() => {
                document.body.focus();
              }}
            />

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
                  <p className="text-xs text-muted-foreground font-medium">Up Next</p>
                  <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">
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
            className="rounded-xl gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>


          <Button
            variant="outline"
            onClick={onNext}
            disabled={byteNumber === totalBytes}
            className="rounded-xl gap-2"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
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
