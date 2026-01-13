import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  CheckCircle2,
  SkipForward,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopicBadge } from '@/components/TopicBadge';
import { Byte } from '@/types/byte';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface VideoPlayerProps {
  byte: Byte;
  byteNumber: number;
  totalBytes: number;
  isCompleted: boolean;
  nextByte: Byte | null;
  onPrevious: () => void;
  onNext: () => void;
  onMarkCompleted: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  hasWatchedEnough: boolean;
  onAutoComplete: () => void;
  shouldAutoComplete: boolean;
}

/**
 * Video Player Component
 * 
 * Security Note: 
 * We're using Google Drive preview URLs which don't expose the direct download link.
 * Right-click is disabled on the video container.
 * For full security, a backend proxy would be needed to stream videos without exposing URLs.
 * Complete prevention of downloads is not possible in a browser environment.
 */
export function VideoPlayer({
  byte,
  byteNumber,
  totalBytes,
  isCompleted,
  nextByte,
  onPrevious,
  onNext,
  onMarkCompleted,
  isFullscreen,
  onToggleFullscreen,
  hasWatchedEnough,
  onAutoComplete,
  shouldAutoComplete,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [autoCompleteTriggered, setAutoCompleteTriggered] = useState(false);
  const [iframeFocused, setIframeFocused] = useState(false);

  // Track when iframe gets/loses focus
  useEffect(() => {
    const checkFocus = () => {
      const isIframeFocused = document.activeElement instanceof HTMLIFrameElement;
      setIframeFocused(isIframeFocused);
    };

    // Check focus on window focus/blur events
    window.addEventListener('focus', checkFocus, true);
    window.addEventListener('blur', checkFocus, true);
    document.addEventListener('focusin', checkFocus);
    document.addEventListener('focusout', checkFocus);
    
    // Also check periodically since iframe focus can be tricky to detect
    const interval = setInterval(checkFocus, 500);

    return () => {
      window.removeEventListener('focus', checkFocus, true);
      window.removeEventListener('blur', checkFocus, true);
      document.removeEventListener('focusin', checkFocus);
      document.removeEventListener('focusout', checkFocus);
      clearInterval(interval);
    };
  }, []);

  // Extract file ID from Google Drive URL
  const getEmbedUrl = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      // Using preview instead of embed for better security
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  // Reset auto-complete trigger when byte changes
  useEffect(() => {
    setAutoCompleteTriggered(false);
  }, [byte.byte_id]);

  // Auto-complete when progress reaches 90%
  useEffect(() => {
    if (shouldAutoComplete && !isCompleted && !autoCompleteTriggered) {
      setAutoCompleteTriggered(true);
      onAutoComplete();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#8b5cf6', '#f59e0b', '#ec4899'],
      });
      toast({
        title: "🎉 Byte Completed!",
        description: "Great job! Moving to the next concept...",
      });
    }
  }, [shouldAutoComplete, isCompleted, autoCompleteTriggered, onAutoComplete, toast]);

  const handleMarkCompleted = useCallback(() => {
    if (isCompleted) {
      // Allow unmarking
      onMarkCompleted();
      return;
    }

    if (!hasWatchedEnough) {
      toast({
        title: "Watch some of the video first",
        description: "Please watch at least 10 seconds or 20% of the video before marking it complete.",
        variant: "destructive",
      });
      return;
    }

    // Fire confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#14b8a6', '#8b5cf6', '#f59e0b', '#ec4899'],
    });
    onMarkCompleted();
  }, [isCompleted, hasWatchedEnough, onMarkCompleted, toast]);

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
        // Fallback to internal fullscreen state
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFullscreen}
          className="rounded-xl hover:bg-muted shrink-0 ml-4"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </Button>
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
              // Ensure document maintains focus for keyboard shortcuts
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
      <div className="flex items-center justify-between mt-4 gap-4 shrink-0">
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
          onClick={handleMarkCompleted}
          className={`rounded-xl gap-2 transition-all ${
            isCompleted 
              ? 'bg-primary/20 text-primary hover:bg-primary/30' 
              : 'gradient-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isCompleted ? 'Completed!' : 'Mark Complete'}
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

      {/* Keyboard Shortcuts Hint */}
      <div className="flex justify-center items-center gap-4 mt-3 text-xs text-muted-foreground shrink-0">
        <button 
          onClick={onPrevious}
          disabled={byteNumber === 1}
          className="flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded hover:bg-muted/80">P</kbd> Previous
        </button>
        <button 
          onClick={onNext}
          disabled={byteNumber === totalBytes}
          className="flex items-center gap-1 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded hover:bg-muted/80">N</kbd> Next
        </button>
        <button 
          onClick={handleToggleFullscreen}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded hover:bg-muted/80">F</kbd> Fullscreen
        </button>
        {iframeFocused && (
          <span className="text-primary/70 animate-pulse ml-2">
            Click outside video for shortcuts
          </span>
        )}
      </div>
    </motion.div>
  );
}
