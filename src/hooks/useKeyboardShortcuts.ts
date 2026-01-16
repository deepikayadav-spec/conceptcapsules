import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcuts {
  onToggleLeftPanel?: () => void;
  onToggleNotesPanel?: () => void;
}

export function useKeyboardShortcuts({
  onToggleLeftPanel,
  onToggleNotesPanel,
}: KeyboardShortcuts) {
  // Use refs to always have the latest callback references
  const onToggleLeftPanelRef = useRef(onToggleLeftPanel);
  const onToggleNotesPanelRef = useRef(onToggleNotesPanel);

  // Update refs when callbacks change
  useEffect(() => {
    onToggleLeftPanelRef.current = onToggleLeftPanel;
    onToggleNotesPanelRef.current = onToggleNotesPanel;
  }, [onToggleLeftPanel, onToggleNotesPanel]);

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
    document.addEventListener('keydown', handleKeyDown, true);
    
    // Periodically check if focus is on an iframe and return it to document
    const focusInterval = setInterval(() => {
      if (document.activeElement instanceof HTMLIFrameElement) {
        // Don't steal focus if user is interacting with video controls
        // Just ensure keyboard events work by listening on document level
      }
    }, 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      clearInterval(focusInterval);
    };
  }, []);
}
