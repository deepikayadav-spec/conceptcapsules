import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pill, RotateCcw } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ProgressIndicator } from './ProgressIndicator';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';

interface HeaderProps {
  showProgress?: boolean;
  completed?: number;
  total?: number;
  onResetProgress?: () => void;
}

export function Header({ showProgress, completed = 0, total = 0, onResetProgress }: HeaderProps) {
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
          <>
            <ProgressIndicator completed={completed} total={total} />
            {onResetProgress && completed > 0 && (
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl hover:bg-muted h-9 w-9"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all progress</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear your watch history and mark all videos as unwatched. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onResetProgress}>
                      Reset Progress
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
        <ThemeToggle />
      </div>
    </motion.header>
  );
}
