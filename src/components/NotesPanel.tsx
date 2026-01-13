import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface NotesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  byteId: string;
  byteName: string;
}

const NOTES_STORAGE_KEY = 'concept-capsule-notes';

interface NotesStorage {
  [byteId: string]: string;
}

export function NotesPanel({ isOpen, onToggle, byteId, byteName }: NotesPanelProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load notes for current byte
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) {
        const allNotes: NotesStorage = JSON.parse(stored);
        setNotes(allNotes[byteId] || '');
      } else {
        setNotes('');
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes('');
    }
  }, [byteId]);

  // Auto-save notes with debounce
  const saveNotes = useCallback((value: string) => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      const allNotes: NotesStorage = stored ? JSON.parse(stored) : {};
      allNotes[byteId] = value;
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, [byteId]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== undefined) {
        saveNotes(notes);
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [notes, saveNotes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-full glass border-l border-border/50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Notes</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {byteName}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="rounded-xl hover:bg-muted h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notes Area */}
          <div className="flex-1 p-4 flex flex-col min-h-0">
            <Textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Take notes while watching this video..."
              className="flex-1 resize-none rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary text-sm min-h-[200px]"
            />
            
            {/* Auto-save indicator */}
            <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
              {isSaving ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  Saved
                </motion.span>
              ) : (
                <span>Auto-saves as you type</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">A</kbd> to toggle
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onToggle}
          className="h-full w-12 glass border-l border-border/50 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <FileText className="w-4 h-4 text-secondary" />
          <span className="text-xs font-medium text-muted-foreground [writing-mode:vertical-lr]">
            Notes
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
