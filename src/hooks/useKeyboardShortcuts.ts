import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onNext?: () => void;
  onPrevious?: () => void;
  onFullscreen?: () => void;
  onToggleLeftPanel?: () => void;
  onToggleAIPanel?: () => void;
}

export function useKeyboardShortcuts({
  onNext,
  onPrevious,
  onFullscreen,
  onToggleLeftPanel,
  onToggleAIPanel,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'n':
        event.preventDefault();
        onNext?.();
        break;
      case 'p':
        event.preventDefault();
        onPrevious?.();
        break;
      case 'f':
        event.preventDefault();
        onFullscreen?.();
        break;
      case 'l':
        event.preventDefault();
        onToggleLeftPanel?.();
        break;
      case 'a':
        event.preventDefault();
        onToggleAIPanel?.();
        break;
    }
  }, [onNext, onPrevious, onFullscreen, onToggleLeftPanel, onToggleAIPanel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
