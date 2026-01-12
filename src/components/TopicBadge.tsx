import { getTopicClass } from '@/types/byte';
import { cn } from '@/lib/utils';

interface TopicBadgeProps {
  topic: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
  active?: boolean;
}

export function TopicBadge({ topic, size = 'sm', onClick, active }: TopicBadgeProps) {
  const topicClass = getTopicClass(topic);
  const formattedTopic = topic.replace(/_/g, ' ');

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center border font-medium transition-all duration-200',
        topicClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs rounded-md' : 'px-3 py-1 text-sm rounded-lg',
        onClick && 'cursor-pointer hover:scale-105 active:scale-95',
        active && 'ring-2 ring-offset-2 ring-primary'
      )}
    >
      {formattedTopic}
    </span>
  );
}
