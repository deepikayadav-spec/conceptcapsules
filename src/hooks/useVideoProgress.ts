import { useState, useEffect, useCallback } from 'react';

const PROGRESS_STORAGE_KEY = 'concept-capsule-progress-v2';

interface VideoProgressData {
  watchedSeconds: number;
  duration: number;
  percentage: number;
  lastWatched: number;
  isCompleted: boolean;
}

interface VideoProgress {
  [byteId: string]: VideoProgressData;
}

export function useVideoProgress() {
  const [progress, setProgress] = useState<VideoProgress>({});

  // Load progress from localStorage on mount
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

  // Save progress to localStorage
  const saveProgress = useCallback((newProgress: VideoProgress) => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, []);

  const updateProgress = useCallback((byteId: string, watchedSeconds: number, duration: number) => {
    if (duration <= 0 || !byteId) return;
    
    const percentage = Math.min((watchedSeconds / duration) * 100, 100);
    
    setProgress(prev => {
      // Don't decrease progress (no rewinding effects)
      const existing = prev[byteId];
      if (existing && existing.percentage > percentage && !existing.isCompleted) {
        return prev;
      }

      const newProgress = {
        ...prev,
        [byteId]: {
          watchedSeconds,
          duration,
          percentage,
          lastWatched: Date.now(),
          isCompleted: existing?.isCompleted || false,
        },
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  }, [saveProgress]);

  const markCompleted = useCallback((byteId: string) => {
    if (!byteId) return;

    setProgress(prev => {
      const existing = prev[byteId] || { 
        watchedSeconds: 0, 
        duration: 0, 
        percentage: 100,
        lastWatched: Date.now(),
        isCompleted: false,
      };

      const newProgress = {
        ...prev,
        [byteId]: {
          ...existing,
          percentage: 100,
          isCompleted: true,
          lastWatched: Date.now(),
        },
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  }, [saveProgress]);

  const getProgress = useCallback((byteId: string): VideoProgressData | null => {
    return progress[byteId] || null;
  }, [progress]);

  const isCompleted = useCallback((byteId: string): boolean => {
    return progress[byteId]?.isCompleted || false;
  }, [progress]);

  const getCompletedVideos = useCallback((): string[] => {
    return Object.entries(progress)
      .filter(([_, data]) => data.isCompleted)
      .map(([byteId]) => byteId);
  }, [progress]);

  const getCompletedCount = useCallback((): number => {
    return Object.values(progress).filter(data => data.isCompleted).length;
  }, [progress]);

  // Check if video should be auto-completed (>=95% watched)
  const shouldAutoComplete = useCallback((byteId: string): boolean => {
    const data = progress[byteId];
    if (!data || data.isCompleted) return false;
    return data.percentage >= 95;
  }, [progress]);

  return {
    progress,
    updateProgress,
    markCompleted,
    getProgress,
    isCompleted,
    getCompletedVideos,
    getCompletedCount,
    shouldAutoComplete,
  };
}
