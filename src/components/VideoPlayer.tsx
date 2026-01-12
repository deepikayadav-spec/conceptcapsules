import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  CheckCircle2,
  Play,
  SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopicBadge } from '@/components/TopicBadge';
import { Byte } from '@/types/byte';
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
}: VideoPlayerProps) {
  const [showNextPreview, setShowNextPreview] = useState(false);

  // Extract file ID from Google Drive URL
  const getEmbedUrl = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      // Using preview instead of embed for better security
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  const handleMarkCompleted = useCallback(() => {
    if (!isCompleted) {
      // Fire confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#8b5cf6', '#f59e0b', '#ec4899'],
      });
    }
    onMarkCompleted();
  }, [isCompleted, onMarkCompleted]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  useEffect(() => {
    if (nextByte) {
      setShowNextPreview(true);
      const timer = setTimeout(() => setShowNextPreview(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [byte.byte_id, nextByte]);

  return (
    <motion.div
      layout
      className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6' : 'h-full'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
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
          onClick={onToggleFullscreen}
          className="rounded-xl hover:bg-muted shrink-0 ml-4"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Video Container */}
      <div 
        className="relative flex-1 min-h-0 rounded-2xl overflow-hidden bg-muted no-context-menu"
        onContextMenu={handleContextMenu}
      >
        <iframe
          src={getEmbedUrl(byte.byte_url)}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={byte.byte_description}
        />
        
        {/* Next Up Preview */}
        <AnimatePresence>
          {showNextPreview && nextByte && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 right-4 glass rounded-xl p-3 max-w-xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg gradient-secondary shrink-0">
                  <SkipForward className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Next up</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {nextByte.byte_description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4 gap-4">
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
      <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded">P</kbd> Previous</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded">N</kbd> Next</span>
        <span><kbd className="px-1.5 py-0.5 bg-muted rounded">F</kbd> Fullscreen</span>
      </div>
    </motion.div>
  );
}
