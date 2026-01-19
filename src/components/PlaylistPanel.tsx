import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { TopicBadge } from '@/components/TopicBadge';
import { Byte, ALL_TOPICS, getTopicDisplayName } from '@/types/byte';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlaylistPanelProps {
  bytes: Byte[];
  currentByteId: string;
  completedVideos: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelectByte: (byte: Byte) => void;
  getProgress?: (byteId: string) => { percentage: number } | null;
}

export function PlaylistPanel({
  bytes,
  currentByteId,
  completedVideos,
  isOpen,
  onToggle,
  onSelectByte,
  getProgress,
}: PlaylistPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [showUnwatchedOnly, setShowUnwatchedOnly] = useState(false);

  const filteredBytes = useMemo(() => {
    return bytes.filter(byte => {
      const matchesSearch = 
        byte.byte_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        byte.byte_topics.some(t => 
          t.toLowerCase().includes(searchQuery.toLowerCase()) ||
          getTopicDisplayName(t).toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      const matchesTopic = 
        selectedTopic === 'all' ||
        byte.byte_topics.includes(selectedTopic);

      const matchesCompletion = 
        !showUnwatchedOnly || 
        !completedVideos.includes(byte.byte_id);

      return matchesSearch && matchesTopic && matchesCompletion;
    });
  }, [bytes, searchQuery, selectedTopic, showUnwatchedOnly, completedVideos]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTopic('all');
    setShowUnwatchedOnly(false);
  };

  const handleTopicChange = (value: string) => {
    setSelectedTopic(value);
  };

  const hasActiveFilters = searchQuery || selectedTopic !== 'all' || showUnwatchedOnly;

  return (
    <div className="h-full glass border-r border-border/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-foreground">Playlist</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="rounded-xl hover:bg-muted h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        {/* Topic Dropdown Filter */}
        <div className="mt-3">
          <Select value={selectedTopic} onValueChange={handleTopicChange}>
            <SelectTrigger className="w-full rounded-xl bg-muted/50 border-0 focus:ring-1 focus:ring-primary">
              <SelectValue>
                {selectedTopic === 'all' 
                  ? 'Select Topic' 
                  : `Topic: ${getTopicDisplayName(selectedTopic)}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50 max-h-[300px]">
              <SelectItem value="all" className="cursor-pointer">
                All Topics
              </SelectItem>
              {ALL_TOPICS.map(topic => (
                <SelectItem key={topic} value={topic} className="cursor-pointer">
                  {getTopicDisplayName(topic)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Unwatched filter toggle */}
        <div className="mt-3 flex items-center justify-between">
          <label 
            htmlFor="unwatched-toggle" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Show unwatched only
          </label>
          <Switch 
            id="unwatched-toggle"
            checked={showUnwatchedOnly}
            onCheckedChange={setShowUnwatchedOnly}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Playlist Items */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredBytes.map((byte, index) => {
            const isActive = byte.byte_id === currentByteId;
            const isCompleted = completedVideos.includes(byte.byte_id);
            const originalIndex = bytes.findIndex(b => b.byte_id === byte.byte_id);
            const progress = getProgress?.(byte.byte_id);

            return (
              <motion.button
                key={byte.byte_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onSelectByte(byte)}
                className={cn(
                  'w-full p-3 rounded-xl text-left transition-all duration-200 mb-1',
                  'hover:bg-muted/80 group',
                  isActive && 'bg-primary/10 ring-1 ring-primary/30'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-colors',
                    isCompleted
                      ? 'bg-green-500/20 text-green-500'
                      : isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      originalIndex + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium line-clamp-2',
                      isActive ? 'text-foreground' : 'text-foreground/80'
                    )}>
                      {byte.byte_description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {byte.byte_topics.slice(0, 2).map(topic => (
                        <TopicBadge key={topic} topic={topic} size="sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <p className="text-xs text-center text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">L</kbd> to toggle
        </p>
      </div>
    </div>
  );
}
