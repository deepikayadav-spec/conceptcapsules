import { useState, useEffect, useCallback } from 'react';

const PROGRESS_STORAGE_KEY = 'concept-capsule-progress-v3';

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

  // Load and normalize progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (stored) {
        const parsed: VideoProgress = JSON.parse(stored);
        
        // Normalize legacy data: ensure completed items have 100% and fix inconsistencies
        let needsUpdate = false;
        const normalized = Object.entries(parsed).reduce((acc, [byteId, data]) => {
          let updatedData = { ...data };
          
          // If marked completed but percentage isn't 100, fix it
          if (data.isCompleted && data.percentage !== 100) {
            updatedData.percentage = 100;
            needsUpdate = true;
          }
          
          // If percentage >= 95 but not marked completed, mark it
          if (data.percentage >= 95 && !data.isCompleted) {
            updatedData.isCompleted = true;
            updatedData.percentage = 100;
            needsUpdate = true;
          }
          
          acc[byteId] = updatedData;
          return acc;
        }, {} as VideoProgress);
        
        setProgress(normalized);
        
        // Save normalized data back if we made changes
        if (needsUpdate) {
          localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
        }
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

  // Update progress for a video (percentage-based)
  const updateProgress = useCallback((byteId: string, percentage: number) => {
    if (!byteId || percentage < 0) return;
    
    const clampedPercentage = Math.min(percentage, 100);
    
    setProgress(prev => {
      const existing = prev[byteId];
      
      // If already completed, ensure it stays at 100% (repair if needed)
      if (existing?.isCompleted) {
        if (existing.percentage !== 100) {
          // Repair inconsistent state
          const repairedProgress = {
            ...prev,
            [byteId]: { ...existing, percentage: 100 },
          };
          saveProgress(repairedProgress);
          return repairedProgress;
        }
        return prev; // Already correct, no change needed
      }
      
      // Don't decrease progress (no rewinding effects)
      if (existing && existing.percentage > clampedPercentage) {
        return prev;
      }

      // If reaching completion threshold, lock to 100%
      const isNowCompleted = clampedPercentage >= 95;
      const finalPercentage = isNowCompleted ? 100 : clampedPercentage;

      const newProgress = {
        ...prev,
        [byteId]: {
          watchedSeconds: 0,
          duration: 0,
          percentage: finalPercentage,
          lastWatched: Date.now(),
          isCompleted: isNowCompleted,
        },
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  }, [saveProgress]);

  // Mark video as completed
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

  // Get progress for a specific video
  const getProgress = useCallback((byteId: string): VideoProgressData | null => {
    return progress[byteId] || null;
  }, [progress]);

  // Check if video is completed
  const isCompleted = useCallback((byteId: string): boolean => {
    return progress[byteId]?.isCompleted || false;
  }, [progress]);

  // Get list of completed video IDs
  const getCompletedVideos = useCallback((): string[] => {
    return Object.entries(progress)
      .filter(([_, data]) => data.isCompleted)
      .map(([byteId]) => byteId);
  }, [progress]);

  // Get count of completed videos
  const getCompletedCount = useCallback((): number => {
    return Object.values(progress).filter(data => data.isCompleted).length;
  }, [progress]);

  // Check if video should be auto-completed (>=95% watched)
  const shouldAutoComplete = useCallback((byteId: string): boolean => {
    const data = progress[byteId];
    if (!data || data.isCompleted) return false;
    return data.percentage >= 95;
  }, [progress]);

  // Reset all progress (clear localStorage and state)
  const resetAllProgress = useCallback(() => {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
      setProgress({});
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  }, []);

  // Reset progress for a single video
  const resetVideoProgress = useCallback((byteId: string) => {
    if (!byteId) return;
    
    setProgress(prev => {
      const { [byteId]: removed, ...rest } = prev;
      saveProgress(rest);
      return rest;
    });
  }, [saveProgress]);

  return {
    progress,
    updateProgress,
    markCompleted,
    getProgress,
    isCompleted,
    getCompletedVideos,
    getCompletedCount,
    shouldAutoComplete,
    resetAllProgress,
    resetVideoProgress,
  };
}
