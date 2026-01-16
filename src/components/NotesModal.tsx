import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useDragControls, useMotionValue } from 'framer-motion';
import { FileText, Save, Download, X, Minus, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOTES_STORAGE_KEY = 'conceptCapsuleNotes';
const NOTES_UI_STORAGE_KEY = 'conceptCapsuleNotesUI';

interface NotesUIState {
  x: number;
  y: number;
  isMinimized: boolean;
}

const DEFAULT_UI_STATE: NotesUIState = {
  x: 0,
  y: 0,
  isMinimized: false,
};

export function NotesModal({ isOpen, onClose }: NotesModalProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  // Motion values for position persistence
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Load notes and UI state on mount
  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes) {
        setNotes(storedNotes);
      }
      
      const storedUI = localStorage.getItem(NOTES_UI_STORAGE_KEY);
      if (storedUI) {
        const uiState: NotesUIState = JSON.parse(storedUI);
        x.set(uiState.x);
        y.set(uiState.y);
        setIsMinimized(uiState.isMinimized);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }, []);

  // Save UI state helper
  const saveUIState = useCallback(() => {
    try {
      const uiState: NotesUIState = {
        x: x.get(),
        y: y.get(),
        isMinimized,
      };
      localStorage.setItem(NOTES_UI_STORAGE_KEY, JSON.stringify(uiState));
    } catch (error) {
      console.error('Error saving UI state:', error);
    }
  }, [x, y, isMinimized]);

  // Save UI state when minimized changes
  useEffect(() => {
    saveUIState();
  }, [isMinimized, saveUIState]);

  // Save notes with debounce
  const saveNotes = useCallback((value: string) => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, value);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, []);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== undefined) {
        saveNotes(notes);
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [notes, saveNotes]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleDragEnd = () => {
    saveUIState();
  };

  const downloadNotes = () => {
    if (!notes || !notes.trim()) {
      toast({
        title: "No notes to download yet",
        description: "Start taking notes while watching videos.",
      });
      return;
    }

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content = `# Concept Capsule Notes

Date: ${today}

---

${notes}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ConceptCapsule_Notes.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Notes downloaded!",
      description: "Your notes have been saved as a markdown file.",
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={constraintsRef}
      className="fixed inset-0 pointer-events-none z-50"
    >
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragElastic={0}
        style={{ x, y, width: isMinimized ? '200px' : '360px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onDragEnd={handleDragEnd}
        className="absolute pointer-events-auto right-5 top-20"
      >
        <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Drag Handle Header */}
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="flex items-center justify-between px-4 py-3 bg-muted/50 cursor-grab active:cursor-grabbing border-b border-border/50"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
              <div className="w-8 h-8 rounded-lg gradient-secondary flex items-center justify-center">
                <FileText className="w-4 h-4 text-secondary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Notes</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 rounded-lg hover:bg-muted"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content - Hidden when minimized */}
          {!isMinimized && (
            <div className="p-4 flex flex-col gap-3">
              {/* Notes Textarea */}
              <Textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Take notes while watching videos..."
                className="resize-none rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary text-sm min-h-[200px] max-h-[300px]"
              />
              
              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Auto-save indicator */}
                <div className="text-xs text-muted-foreground">
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
                
                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadNotes}
                  className="rounded-xl gap-2 h-8"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
