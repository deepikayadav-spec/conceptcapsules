import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pill } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ProgressIndicator } from './ProgressIndicator';

interface HeaderProps {
  showProgress?: boolean;
  completed?: number;
  total?: number;
}

export function Header({ showProgress, completed = 0, total = 0 }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 px-4 lg:px-6 flex items-center justify-between glass border-b border-border/50"
    >
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow transition-shadow group-hover:shadow-glow-lg">
          <Pill className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-xl text-foreground hidden sm:block">
          Concept Capsule
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {showProgress && (
          <ProgressIndicator completed={completed} total={total} />
        )}
        <ThemeToggle />
      </div>
    </motion.header>
  );
}
