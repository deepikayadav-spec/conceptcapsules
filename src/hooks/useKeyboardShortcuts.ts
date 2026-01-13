import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcuts {
  onNext?: () => void;
  onPrevious?: () => void;
  onFullscreen?: () => void;
  onToggleLeftPanel?: () => void;
  onToggleNotesPanel?: () => void;
}

export function useKeyboardShortcuts({
  onNext,
  onPrevious,
  onFullscreen,
  onToggleLeftPanel,
  onToggleNotesPanel,
}: KeyboardShortcuts) {
  // Use refs to always have the latest callback references
  const onNextRef = useRef(onNext);
  const onPreviousRef = useRef(onPrevious);
  const onFullscreenRef = useRef(onFullscreen);
  const onToggleLeftPanelRef = useRef(onToggleLeftPanel);
  const onToggleNotesPanelRef = useRef(onToggleNotesPanel);

  // Update refs when callbacks change
  useEffect(() => {
    onNextRef.current = onNext;
    onPreviousRef.current = onPrevious;
    onFullscreenRef.current = onFullscreen;
    onToggleLeftPanelRef.current = onToggleLeftPanel;
    onToggleNotesPanelRef.current = onToggleNotesPanel;
  }, [onNext, onPrevious, onFullscreen, onToggleLeftPanel, onToggleNotesPanel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 'n':
          event.preventDefault();
          event.stopPropagation();
          onNextRef.current?.();
          break;
        case 'p':
          event.preventDefault();
          event.stopPropagation();
          onPreviousRef.current?.();
          break;
        case 'f':
          event.preventDefault();
          event.stopPropagation();
          onFullscreenRef.current?.();
          break;
        case 'l':
          event.preventDefault();
          event.stopPropagation();
          onToggleLeftPanelRef.current?.();
          break;
        case 'a':
          event.preventDefault();
          event.stopPropagation();
          onToggleNotesPanelRef.current?.();
          break;
      }
    };

    // Use capture phase to ensure we get the event first
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}
