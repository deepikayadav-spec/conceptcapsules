import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBytes } from './useBytes';

interface VideoLike {
  byte_id: string;
  count: number;
}

interface VideoFeedback {
  byte_id: string;
  count: number;
  avgRating: number;
  comments: Array<{
    rating: number;
    comment: string | null;
    created_at: string;
  }>;
}

interface AnalyticsData {
  likes: VideoLike[];
  feedback: VideoFeedback[];
  totalLikes: number;
  totalFeedback: number;
  totalUniqueUsers: number;
  overallAvgRating: number;
}

export function useAdminAnalytics() {
  const { bytes, loading: bytesLoading } = useBytes();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // Fetch all likes
        const { data: likesData, error: likesError } = await supabase
          .from('video_likes')
          .select('byte_id, user_fingerprint');
        
        if (likesError) throw likesError;

        // Fetch all feedback
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('video_feedback')
          .select('byte_id, rating, comment, created_at, user_fingerprint');
        
        if (feedbackError) throw feedbackError;

        // Aggregate likes by byte_id
        const likesMap = new Map<string, number>();
        const uniqueUsersFromLikes = new Set<string>();
        
        likesData?.forEach(like => {
          likesMap.set(like.byte_id, (likesMap.get(like.byte_id) || 0) + 1);
          uniqueUsersFromLikes.add(like.user_fingerprint);
        });

        const likes: VideoLike[] = Array.from(likesMap.entries()).map(([byte_id, count]) => ({
          byte_id,
          count
        }));

        // Aggregate feedback by byte_id
        const feedbackMap = new Map<string, { ratings: number[]; comments: Array<{ rating: number; comment: string | null; created_at: string }> }>();
        const uniqueUsersFromFeedback = new Set<string>();

        feedbackData?.forEach(fb => {
          const existing = feedbackMap.get(fb.byte_id) || { ratings: [], comments: [] };
          existing.ratings.push(fb.rating);
          existing.comments.push({
            rating: fb.rating,
            comment: fb.comment,
            created_at: fb.created_at
          });
          feedbackMap.set(fb.byte_id, existing);
          uniqueUsersFromFeedback.add(fb.user_fingerprint);
        });

        const feedback: VideoFeedback[] = Array.from(feedbackMap.entries()).map(([byte_id, data]) => ({
          byte_id,
          count: data.ratings.length,
          avgRating: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
          comments: data.comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }));

        // Calculate totals
        const totalLikes = likesData?.length || 0;
        const totalFeedback = feedbackData?.length || 0;
        
        // Combine unique users
        const allUniqueUsers = new Set([...uniqueUsersFromLikes, ...uniqueUsersFromFeedback]);
        const totalUniqueUsers = allUniqueUsers.size;

        // Overall average rating
        const allRatings = feedbackData?.map(fb => fb.rating) || [];
        const overallAvgRating = allRatings.length > 0 
          ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
          : 0;

        setData({
          likes,
          feedback,
          totalLikes,
          totalFeedback,
          totalUniqueUsers,
          overallAvgRating
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Merge analytics with byte info
  const getVideoAnalytics = () => {
    if (!data || !bytes.length) return [];

    return bytes.map(byte => {
      const likeData = data.likes.find(l => l.byte_id === byte.byte_id);
      const feedbackData = data.feedback.find(f => f.byte_id === byte.byte_id);

      return {
        byte_id: byte.byte_id,
        byte_name: byte.byte_name,
        byte_description: byte.byte_description,
        topics: byte.byte_topics,
        likes: likeData?.count || 0,
        feedbackCount: feedbackData?.count || 0,
        avgRating: feedbackData?.avgRating || null,
        comments: feedbackData?.comments || []
      };
    });
  };

  return {
    analytics: data,
    videoAnalytics: getVideoAnalytics(),
    loading: loading || bytesLoading,
    error
  };
}
