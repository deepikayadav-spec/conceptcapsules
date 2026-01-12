import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { PlaylistPanel } from '@/components/PlaylistPanel';
import { VideoPlayer } from '@/components/VideoPlayer';
import { AIChatPanel } from '@/components/AIChatPanel';
import { useBytes } from '@/hooks/useBytes';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { WatchState, STORAGE_KEY, Byte } from '@/types/byte';
import { Loader2 } from 'lucide-react';

const defaultState: WatchState = {
  lastVideoId: null,
  completedVideos: [],
  leftPanelOpen: true,
  rightPanelOpen: true,
};

export default function Watch() {
  const { bytes, loading, error, getAllTopics } = useBytes();
  const [state, setState] = useLocalStorage<WatchState>(STORAGE_KEY, defaultState);
  const [currentByte, setCurrentByte] = useState<Byte | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentByte(bytes[currentIndex - 1]);
    }
  }, [bytes, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < bytes.length - 1) {
      setCurrentByte(bytes[currentIndex + 1]);
    }
  }, [bytes, currentIndex]);

  const handleMarkCompleted = useCallback(() => {
    if (currentByte) {
      setState(prev => {
        const isCompleted = prev.completedVideos.includes(currentByte.byte_id);
        return {
          ...prev,
          completedVideos: isCompleted
            ? prev.completedVideos.filter(id => id !== currentByte.byte_id)
            : [...prev.completedVideos, currentByte.byte_id],
        };
      });
    }
  }, [currentByte, setState]);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleToggleLeftPanel = useCallback(() => {
    setState(prev => ({ ...prev, leftPanelOpen: !prev.leftPanelOpen }));
  }, [setState]);

  const handleToggleRightPanel = useCallback(() => {
    setState(prev => ({ ...prev, rightPanelOpen: !prev.rightPanelOpen }));
  }, [setState]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNext: handleNext,
    onPrevious: handlePrevious,
    onFullscreen: handleToggleFullscreen,
    onToggleLeftPanel: handleToggleLeftPanel,
    onToggleAIPanel: handleToggleRightPanel,
  });

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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      {!isFullscreen && (
        <Header
          showProgress
          completed={state.completedVideos.length}
          total={bytes.length}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Playlist */}
        {!isFullscreen && (
          <PlaylistPanel
            bytes={bytes}
            currentByteId={currentByte.byte_id}
            completedVideos={state.completedVideos}
            allTopics={getAllTopics()}
            isOpen={state.leftPanelOpen}
            onToggle={handleToggleLeftPanel}
            onSelectByte={handleSelectByte}
          />
        )}

        {/* Center - Video Player */}
        <motion.div
          layout
          className="flex-1 min-w-0 p-4 lg:p-6"
        >
          <VideoPlayer
            byte={currentByte}
            byteNumber={currentIndex + 1}
            totalBytes={bytes.length}
            isCompleted={state.completedVideos.includes(currentByte.byte_id)}
            nextByte={currentIndex < bytes.length - 1 ? bytes[currentIndex + 1] : null}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onMarkCompleted={handleMarkCompleted}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </motion.div>

        {/* Right Panel - AI Chat */}
        {!isFullscreen && (
          <AIChatPanel
            isOpen={state.rightPanelOpen}
            onToggle={handleToggleRightPanel}
            currentTopic={currentByte.byte_topics[0]}
          />
        )}
      </div>
    </div>
  );
}
