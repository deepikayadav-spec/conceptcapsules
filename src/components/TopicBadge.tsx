import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTopicDisplayName } from '@/types/byte';

interface TopicBadgeProps {
  topic: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

const topicColors: Record<string, { bg: string; text: string; activeBg: string }> = {
  DICTIONARIES: { bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', activeBg: 'bg-violet-500' },
  LISTS: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500' },
  TUPLES: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-500' },
  SETS: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', activeBg: 'bg-rose-500' },
  STRINGS: { bg: 'bg-cyan-500/15', text: 'text-cyan-600 dark:text-cyan-400', activeBg: 'bg-cyan-500' },
  DATA_TYPES: { bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', activeBg: 'bg-indigo-500' },
  RECURSION: { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400', activeBg: 'bg-pink-500' },
  LOOPS: { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', activeBg: 'bg-orange-500' },
  CONDITIONAL_STATEMENTS: { bg: 'bg-teal-500/15', text: 'text-teal-600 dark:text-teal-400', activeBg: 'bg-teal-500' },
  PYTHON_GENERAL: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-500' },
  TYPE_CONVERSION: { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-500' },
  FUNCTIONS: { bg: 'bg-lime-500/15', text: 'text-lime-600 dark:text-lime-400', activeBg: 'bg-lime-500' },
};

export const TopicBadge = forwardRef<HTMLButtonElement, TopicBadgeProps>(
  ({ topic, size = 'md', onClick, active = false, className }, ref) => {
    const colors = topicColors[topic] || { 
      bg: 'bg-muted', 
      text: 'text-muted-foreground', 
      activeBg: 'bg-primary' 
    };

    const displayName = getTopicDisplayName(topic);

    return (
      <motion.button
        ref={ref}
        whileHover={onClick ? { scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        onClick={onClick}
        disabled={!onClick}
        type="button"
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-all duration-200',
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
          active 
            ? `${colors.activeBg} text-white` 
            : `${colors.bg} ${colors.text}`,
          onClick && 'cursor-pointer hover:opacity-80',
          !onClick && 'cursor-default',
          className
        )}
      >
        {displayName}
      </motion.button>
    );
  }
);

TopicBadge.displayName = 'TopicBadge';
