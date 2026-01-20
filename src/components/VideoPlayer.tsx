import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  CheckCircle2,
  SkipForward,
  FileText,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopicBadge } from '@/components/TopicBadge';
import { Byte } from '@/types/byte';
import { NotesModal } from '@/components/NotesModal';
import { VideoActions } from '@/components/VideoActions';

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
  onMarkCompleted,
  isFullscreen,
  onToggleFullscreen,
  autoStart = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasUserEngaged, setHasUserEngaged] = useState(false);
  const [showStartOverlay, setShowStartOverlay] = useState(true);
  const [isWatching, setIsWatching] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const progressIntervalRef = useRef<number | null>(null);
  const didMarkCompletedRef = useRef(false);

  // Track tab visibility to pause progress when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Handle click on the start overlay to begin tracking
  const handleStartTracking = useCallback(() => {
    setHasUserEngaged(true);
    setShowStartOverlay(false);
    setIsWatching(true);
  }, []);

  // Reset watch time/loop count when byte changes
  useEffect(() => {
    setWatchTime(0);
    setLoopCount(0);
    setIsWatching(false);
    didMarkCompletedRef.current = false;
    
    // Show overlay again for new byte, unless user has engaged before and autoStart is true
    // This creates a "session" behavior: once you've clicked once, subsequent videos auto-start
    if (!hasUserEngaged) {
      setShowStartOverlay(true);
    } else if (autoStart) {
      // User has engaged before in this session, auto-start this video
      setShowStartOverlay(false);
      setIsWatching(true);
    } else {
      setShowStartOverlay(true);
    }

    // Clear previous interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [byte.byte_id, hasUserEngaged, autoStart]);

  // Auto-start is now handled in the byte change effect above
  // This effect is kept for any edge cases where autoStart changes after mount
  useEffect(() => {
    if (autoStart && hasUserEngaged && !isWatching && !showStartOverlay) {
      setIsWatching(true);
    }
  }, [autoStart, hasUserEngaged, isWatching, showStartOverlay]);

  // Simulate progress tracking (since we can't access iframe video events)
  // Assume average video is ~60 seconds for progress calculation
  const ESTIMATED_VIDEO_DURATION = 60; // seconds

  // Track watch time with interval
  useEffect(() => {
    // ONLY track time when user is actively watching AND tab is visible
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
        progressIntervalRef.current = null;
      }
    };
  }, [byte.byte_id, isWatching, isTabVisible]);

  // Calculate and update progress based on watch time
  useEffect(() => {
    if (!isWatching || !isTabVisible) return;

    const percentage = Math.min((watchTime / ESTIMATED_VIDEO_DURATION) * 100, 100);

    // Only update progress if not yet completed
    if (!isCompleted && percentage > currentProgress) {
      onProgressUpdate(percentage);
    }
  }, [watchTime, isCompleted, isWatching, isTabVisible, currentProgress, onProgressUpdate]);

  // Explicitly mark as completed when threshold is reached (exactly once per byte)
  useEffect(() => {
    if (isCompleted || didMarkCompletedRef.current) return;
    
    const percentage = Math.min((watchTime / ESTIMATED_VIDEO_DURATION) * 100, 100);
    
    if (percentage >= 95) {
      didMarkCompletedRef.current = true;
      onMarkCompleted();
    }
  }, [watchTime, isCompleted, onMarkCompleted]);

  // Track when a loop completes based on watch time.
  // This MUST keep working even after completion, because auto-advance is based on 3 full loops.
  useEffect(() => {
    if (!isWatching || !isTabVisible) return;

    if (watchTime >= ESTIMATED_VIDEO_DURATION) {
      setLoopCount(prev => prev + 1);
      setWatchTime(0);
    }
  }, [watchTime, isWatching, isTabVisible]);

  // Auto-advance after exactly 3 loops
  useEffect(() => {
    if (loopCount === 3 && nextByte) {
      const timer = setTimeout(() => {
        onNext();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loopCount, nextByte, onNext]);

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
            {/* Iframe crop container - shifts iframe up to hide Google Drive toolbar */}
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                src={getEmbedUrl(byte.byte_url)}
                className="absolute w-full"
                style={{ 
                  objectFit: 'contain',
                  top: '-48px',
                  height: 'calc(100% + 48px)',
                }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={byte.byte_description}
                onLoad={() => {
                  document.body.focus();
                }}
              />
            </div>
            
            {/* Click blocker for any remaining toolbar area (transparent) */}
            <div 
              className="absolute top-0 right-0 w-20 h-8 z-10 pointer-events-auto"
              style={{ borderTopRightRadius: '12px' }}
            />

            {/* Click to Start Overlay - captures first interaction */}
            <AnimatePresence>
              {showStartOverlay && !isCompleted && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleStartTracking}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer group"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:bg-primary transition-colors"
                  >
                    <Play className="w-10 h-10 text-primary-foreground ml-1" />
                  </motion.div>
                  <p className="mt-4 text-white/90 text-sm font-medium">
                    Click to start tracking
                  </p>
                  <p className="mt-1 text-white/60 text-xs">
                    Progress will be saved automatically
                  </p>
                </motion.button>
              )}
            </AnimatePresence>

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
