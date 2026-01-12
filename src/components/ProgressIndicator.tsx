import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface ProgressIndicatorProps {
  completed: number;
  total: number;
}

export function ProgressIndicator({ completed, total }: ProgressIndicatorProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 px-4 py-2 rounded-2xl glass"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl gradient-primary">
        <Zap className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">
          {completed}/{total} Completed
        </span>
        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full gradient-primary rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}
