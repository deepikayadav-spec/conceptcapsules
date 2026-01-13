import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTopicDisplayName, ALL_TOPICS } from '@/types/byte';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  byteId: string;
  byteName: string;
  byteTopic: string;
}

const NOTES_STORAGE_KEY = 'concept-capsule-notes-v2';

// Storage structure: { [topic]: { [byteId]: { byteName: string, notes: string } } }
interface NotesStorage {
  [topic: string]: {
    [byteId: string]: {
      byteName: string;
      notes: string;
    };
  };
}

export function NotesModal({ isOpen, onClose, byteId, byteName, byteTopic }: NotesModalProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load notes for current byte
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) {
        const allNotes: NotesStorage = JSON.parse(stored);
        const topicNotes = allNotes[byteTopic];
        if (topicNotes && topicNotes[byteId]) {
          setNotes(topicNotes[byteId].notes || '');
        } else {
          setNotes('');
        }
      } else {
        setNotes('');
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes('');
    }
  }, [byteId, byteTopic, isOpen]);

  // Save notes
  const saveNotes = useCallback((value: string) => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      const allNotes: NotesStorage = stored ? JSON.parse(stored) : {};
      
      if (!allNotes[byteTopic]) {
        allNotes[byteTopic] = {};
      }
      
      allNotes[byteTopic][byteId] = {
        byteName,
        notes: value,
      };
      
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }, [byteId, byteName, byteTopic]);

  // Debounced auto-save
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (notes !== undefined) {
        saveNotes(notes);
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 500);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [notes, saveNotes, isOpen]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const downloadTopicNotes = (topic: string) => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (!stored) {
        toast({
          title: "No notes available",
          description: "No notes available for this topic yet.",
          variant: "destructive",
        });
        return;
      }

      const allNotes: NotesStorage = JSON.parse(stored);
      const topicNotes = allNotes[topic];

      if (!topicNotes || Object.keys(topicNotes).length === 0) {
        toast({
          title: "No notes available",
          description: `No notes available for ${getTopicDisplayName(topic)} yet.`,
          variant: "destructive",
        });
        return;
      }

      // Check if there are any actual notes content
      const hasContent = Object.values(topicNotes).some(n => n.notes && n.notes.trim());
      if (!hasContent) {
        toast({
          title: "No notes available",
          description: `No notes available for ${getTopicDisplayName(topic)} yet.`,
          variant: "destructive",
        });
        return;
      }

      // Generate markdown content
      let content = `# Topic: ${getTopicDisplayName(topic)}\n\n`;
      content += `Generated from Concept Capsule\n`;
      content += `Date: ${new Date().toLocaleDateString()}\n\n`;
      content += `---\n\n`;

      Object.entries(topicNotes).forEach(([id, data]) => {
        if (data.notes && data.notes.trim()) {
          content += `## ${data.byteName}\n\n`;
          content += `${data.notes}\n\n`;
          content += `---\n\n`;
        }
      });

      // Create and download file
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ConceptCapsule_Notes_${getTopicDisplayName(topic).replace(/\s+/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Notes downloaded!",
        description: `${getTopicDisplayName(topic)} notes saved as markdown file.`,
      });
    } catch (error) {
      console.error('Error downloading notes:', error);
      toast({
        title: "Download failed",
        description: "Failed to download notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadCurrentTopicNotes = () => {
    downloadTopicNotes(byteTopic);
  };

  // Get topics that have notes
  const getTopicsWithNotes = (): string[] => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (!stored) return [];
      const allNotes: NotesStorage = JSON.parse(stored);
      return Object.keys(allNotes).filter(topic => {
        const topicNotes = allNotes[topic];
        return Object.values(topicNotes).some(n => n.notes && n.notes.trim());
      });
    } catch {
      return [];
    }
  };

  const topicsWithNotes = getTopicsWithNotes();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
              <FileText className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block">Notes</span>
              <span className="text-xs font-normal text-muted-foreground truncate block max-w-[300px]">
                {byteName}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Notes Textarea */}
          <Textarea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Take notes while watching this video..."
            className="flex-1 resize-none rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary text-sm min-h-[200px]"
          />
          
          {/* Auto-save indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
            
            <span className="text-muted-foreground/70">
              Topic: {getTopicDisplayName(byteTopic)}
            </span>
          </div>

          {/* Download Section */}
          <div className="pt-3 border-t border-border/50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCurrentTopicNotes}
                className="rounded-xl gap-2"
              >
                <Download className="w-4 h-4" />
                Download {getTopicDisplayName(byteTopic)} Notes
              </Button>
            </div>

            {topicsWithNotes.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Or download other topics:</span>
                <Select onValueChange={downloadTopicNotes}>
                  <SelectTrigger className="w-[180px] h-8 text-xs rounded-lg">
                    <SelectValue placeholder="Select topic..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {topicsWithNotes.map(topic => (
                      <SelectItem key={topic} value={topic} className="text-xs">
                        {getTopicDisplayName(topic)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
