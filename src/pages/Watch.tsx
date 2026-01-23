import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { PlaylistPanel } from '@/components/PlaylistPanel';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useBytes } from '@/hooks/useBytes';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useVideoProgress } from '@/hooks/useVideoProgress';
import { WatchState, STORAGE_KEY, Byte } from '@/types/byte';
import { Loader2 } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

const defaultState: WatchState = {
  lastVideoId: null,
  completedVideos: [],
  leftPanelOpen: true,
  rightPanelOpen: false,
  leftPanelSize: 25, // Default size percentage
};

export default function Watch() {
  const { bytes, loading, error } = useBytes();
  const [state, setState] = useLocalStorage<WatchState>(STORAGE_KEY, defaultState);
  const [currentByte, setCurrentByte] = useState<Byte | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoStartVideo, setAutoStartVideo] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Progress tracking
  const { 
    getProgress, 
    updateProgress,
    markCompleted,
    getCompletedVideos,
    getCompletedCount,
    resetAllProgress,
  } = useVideoProgress();

  const completedVideos = getCompletedVideos();
  const completedCount = getCompletedCount();

  // Initialize current byte
  useEffect(() => {
    if (bytes.length > 0) {
      if (state.lastVideoId) {
        const lastByte = bytes.find(b => b.byte_id === state.lastVideoId);
        setCurrentByte(lastByte || bytes[0]);
      } else {
        setCurrentByte(bytes[0]);
      }
    }
  }, [bytes, state.lastVideoId]);

  // Update last watched video
  useEffect(() => {
    if (currentByte) {
      setState(prev => ({ ...prev, lastVideoId: currentByte.byte_id }));
    }
  }, [currentByte, setState]);

  const currentIndex = currentByte
    ? bytes.findIndex(b => b.byte_id === currentByte.byte_id)
    : 0;

  const handleSelectByte = useCallback((byte: Byte) => {
    setCurrentByte(byte);
    setAutoStartVideo(true); // Auto-start when selected from playlist
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentByte(bytes[currentIndex - 1]);
      setAutoStartVideo(true);
    }
  }, [bytes, currentIndex]);

  const handleNext = useCallback(() => {
    // Mark current video as complete before navigating
    if (currentByte) {
      markCompleted(currentByte.byte_id);
    }
    
    // Navigate to next video
    if (currentIndex < bytes.length - 1) {
      setCurrentByte(bytes[currentIndex + 1]);
      setAutoStartVideo(true);
    }
  }, [bytes, currentIndex, currentByte, markCompleted]);

  // Reset autoStartVideo after it's consumed
  useEffect(() => {
    if (autoStartVideo) {
      const timer = setTimeout(() => setAutoStartVideo(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentByte, autoStartVideo]);

  // Handle progress update from video player
  const handleProgressUpdate = useCallback((percentage: number) => {
    if (currentByte) {
      updateProgress(currentByte.byte_id, percentage);
    }
  }, [currentByte, updateProgress]);


  const handleToggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement && containerRef.current) {
      await containerRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  // Sync React state with browser fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-enter fullscreen when navigating from Home with fullscreen param
  // useLayoutEffect runs synchronously before paint, maximizing chance of user gesture validity
  useLayoutEffect(() => {
    const shouldFullscreen = searchParams.get('fullscreen') === 'true';
    
    if (shouldFullscreen) {
      // Clear the URL parameter immediately to prevent re-triggering
      setSearchParams({}, { replace: true });
      
      // Request fullscreen on document.documentElement for most reliable behavior
      document.documentElement.requestFullscreen().catch((err) => {
        console.log('Fullscreen request blocked by browser:', err);
      });
    }
  }, []);

  const handleToggleLeftPanel = useCallback(() => {
    setState(prev => ({ ...prev, leftPanelOpen: !prev.leftPanelOpen }));
  }, [setState]);

  const handlePanelResize = useCallback((sizes: number[]) => {
    if (sizes[0] !== undefined) {
      setState(prev => ({ ...prev, leftPanelSize: sizes[0] }));
    }
  }, [setState]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleLeftPanel: handleToggleLeftPanel,
    onToggleFullscreen: handleToggleFullscreen,
  });

  // Get current video progress
  const currentProgress = currentByte ? (getProgress(currentByte.byte_id)?.percentage || 0) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Loading capsules...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !currentByte) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load videos</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header
        showProgress
        completed={completedCount}
        total={bytes.length}
        onResetProgress={resetAllProgress}
      />

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={handlePanelResize}
          className="h-full"
        >
          {/* Left Panel - Playlist */}
          {state.leftPanelOpen && (
            <>
              <ResizablePanel
                defaultSize={state.leftPanelSize || 25}
                minSize={15}
                maxSize={40}
                className="min-w-[200px]"
              >
                <PlaylistPanel
                  bytes={bytes}
                  currentByteId={currentByte.byte_id}
                  completedVideos={completedVideos}
                  isOpen={state.leftPanelOpen}
                  onToggle={handleToggleLeftPanel}
                  onSelectByte={handleSelectByte}
                  getProgress={getProgress}
                />
              </ResizablePanel>
              <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/20 transition-colors" />
            </>
          )}

          {/* Center - Video Player */}
          <ResizablePanel defaultSize={state.leftPanelOpen ? (100 - (state.leftPanelSize || 25)) : 100}>
            <motion.div
              layout
              className="h-full p-4 lg:p-6"
            >
              <VideoPlayer
                byte={currentByte}
                byteNumber={currentIndex + 1}
                totalBytes={bytes.length}
                isCompleted={completedVideos.includes(currentByte.byte_id)}
                currentProgress={currentProgress}
                nextByte={currentIndex < bytes.length - 1 ? bytes[currentIndex + 1] : null}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onProgressUpdate={handleProgressUpdate}
                onMarkCompleted={() => markCompleted(currentByte.byte_id)}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                autoStart={autoStartVideo}
              />
            </motion.div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Collapsed panel toggle button */}
        {!state.leftPanelOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleToggleLeftPanel}
            className="fixed left-0 top-1/2 -translate-y-1/2 h-24 w-6 glass border border-border/50 rounded-r-lg flex items-center justify-center hover:bg-muted/50 transition-colors z-10"
          >
            <span className="text-xs font-medium text-muted-foreground [writing-mode:vertical-lr]">
              Playlist
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}