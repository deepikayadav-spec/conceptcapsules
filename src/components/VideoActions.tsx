import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Star, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVideoLikes } from '@/hooks/useVideoLikes';
import { useVideoFeedback } from '@/hooks/useVideoFeedback';
import { cn } from '@/lib/utils';

interface VideoActionsProps {
  byteId: string;
}

export function VideoActions({ byteId }: VideoActionsProps) {
  const { likesCount, isLiked, toggleLike, isLoading: likeLoading } = useVideoLikes(byteId);
  const { userFeedback, submitFeedback, isSubmitting } = useVideoFeedback(byteId);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmitFeedback = async () => {
    if (rating === 0) return;
    
    const success = await submitFeedback(rating, comment);
    if (success) {
      setFeedbackOpen(false);
      setRating(0);
      setComment('');
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <>
      {/* Floating Action Sidebar */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-4 z-20">
        {/* Like Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleLike}
          disabled={likeLoading}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
            "bg-black/30 backdrop-blur-sm hover:bg-black/50",
            isLiked && "bg-red-500/20"
          )}>
            <Heart
              className={cn(
                "w-6 h-6 transition-all duration-200",
                isLiked 
                  ? "fill-red-500 text-red-500" 
                  : "text-white group-hover:text-red-400"
              )}
            />
          </div>
          <span 
            className="text-sm font-bold text-white px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}
          >
            {formatCount(likesCount)}
          </span>
        </motion.button>

        {/* Feedback Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setFeedbackOpen(true)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
            "bg-black/30 backdrop-blur-sm hover:bg-black/50",
            userFeedback && "bg-primary/20"
          )}>
            <MessageSquare
              className={cn(
                "w-6 h-6 transition-all duration-200",
                userFeedback 
                  ? "fill-primary text-primary" 
                  : "text-white group-hover:text-primary"
              )}
            />
          </div>
          <span 
            className="text-sm font-bold text-white px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}
          >
            {userFeedback ? 'Sent' : 'Rate'}
          </span>
        </motion.button>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setFeedbackOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-background rounded-2xl p-6 shadow-xl border border-border"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Rate this video</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFeedbackOpen(false)}
                  className="rounded-full h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {userFeedback ? (
                <div className="text-center py-4">
                  <div className="flex justify-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-8 h-8",
                          star <= userFeedback.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Thanks for your feedback!
                  </p>
                  {userFeedback.comment && (
                    <p className="text-sm mt-2 text-foreground/80 italic">
                      "{userFeedback.comment}"
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Star Rating */}
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "w-10 h-10 transition-colors",
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground hover:text-yellow-300"
                          )}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Comment */}
                  <Textarea
                    placeholder="Share your thoughts (optional)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mb-4 resize-none rounded-xl"
                    rows={3}
                  />

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={rating === 0 || isSubmitting}
                    className="w-full rounded-xl gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
