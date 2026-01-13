import { useState, useEffect, useCallback } from 'react';

const PROGRESS_STORAGE_KEY = 'concept-capsule-progress';

interface VideoProgress {
  [byteId: string]: {
    watchedSeconds: number;
    duration: number;
    percentage: number;
    lastWatched: number;
  };
}

export function useVideoProgress(byteId: string) {
  const [progress, setProgress] = useState<VideoProgress>({});

  // Load progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }, []);

  const updateProgress = useCallback((watchedSeconds: number, duration: number) => {
    if (duration <= 0) return;
    
    const percentage = Math.min((watchedSeconds / duration) * 100, 100);
    
    setProgress(prev => {
      const newProgress = {
        ...prev,
        [byteId]: {
          watchedSeconds,
          duration,
          percentage,
          lastWatched: Date.now(),
        },
      };
      
      try {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
      } catch (error) {
        console.error('Error saving progress:', error);
      }
      
      return newProgress;
    });
  }, [byteId]);

  const getProgress = useCallback((id: string) => {
    return progress[id] || null;
  }, [progress]);

  const currentProgress = progress[byteId] || null;
  
  const hasWatchedEnough = currentProgress 
    ? currentProgress.watchedSeconds >= 10 || currentProgress.percentage >= 20
    : false;

  const shouldAutoComplete = currentProgress
    ? currentProgress.percentage >= 90
    : false;

  return {
    progress,
    currentProgress,
    updateProgress,
    getProgress,
    hasWatchedEnough,
    shouldAutoComplete,
  };
}
