import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, X, Check, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { TopicBadge } from '@/components/TopicBadge';
import { Byte, ALL_TOPICS, getTopicDisplayName } from '@/types/byte';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

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
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
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
        selectedTopics.length === 0 ||
        byte.byte_topics.some(topic => selectedTopics.includes(topic));

      const matchesCompletion =
        !showUnwatchedOnly || 
        !completedVideos.includes(byte.byte_id);

      return matchesSearch && matchesTopic && matchesCompletion;
    });
  }, [bytes, searchQuery, selectedTopics, showUnwatchedOnly, completedVideos]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTopics([]);
    setShowUnwatchedOnly(false);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const hasActiveFilters = searchQuery || selectedTopics.length > 0 || showUnwatchedOnly;

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

        {/* Topic Multi-Select Filter */}
        <div className="mt-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between rounded-xl bg-muted/50 border-0 focus:ring-1 focus:ring-primary font-normal"
              >
                <span className="truncate">
                  {selectedTopics.length === 0
                    ? 'All Topics'
                    : selectedTopics.length === 1
                      ? getTopicDisplayName(selectedTopics[0])
                      : `${selectedTopics.length} topics selected`}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border border-border z-50" align="start">
              <ScrollArea className="h-[250px]">
                <div className="p-2 space-y-1">
                  <label
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTopics.length === 0}
                      onCheckedChange={() => setSelectedTopics([])}
                    />
                    <span className="text-sm font-medium">All Topics</span>
                  </label>
                  <div className="h-px bg-border my-1" />
                  {ALL_TOPICS.map(topic => (
                    <label
                      key={topic}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedTopics.includes(topic)}
                        onCheckedChange={() => toggleTopic(topic)}
                      />
                      <span className="text-sm">{getTopicDisplayName(topic)}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
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
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-sm font-medium line-clamp-2',
                        isActive ? 'text-foreground' : 'text-foreground/80'
                      )}>
                        {byte.byte_description}
                      </p>
                      {!isCompleted && progress && progress.percentage > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                          {Math.round(progress.percentage)}%
                        </span>
                      )}
                    </div>
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
