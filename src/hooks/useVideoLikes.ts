import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFingerprint } from './useFingerprint';

export function useVideoLikes(byteId: string) {
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fingerprint = useFingerprint();

  // Fetch likes count and check if user has liked
  useEffect(() => {
    if (!byteId || !fingerprint) return;

    const fetchLikes = async () => {
      // Get total likes count
      const { count } = await supabase
        .from('video_likes')
        .select('*', { count: 'exact', head: true })
        .eq('byte_id', byteId);

      setLikesCount(count || 0);

      // Check if current user has liked
      const { data } = await supabase
        .from('video_likes')
        .select('id')
        .eq('byte_id', byteId)
        .eq('user_fingerprint', fingerprint)
        .maybeSingle();

      setIsLiked(!!data);
    };

    fetchLikes();
  }, [byteId, fingerprint]);

  const toggleLike = useCallback(async () => {
    if (!fingerprint || isLoading) return;

    setIsLoading(true);

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('video_likes')
          .delete()
          .eq('byte_id', byteId)
          .eq('user_fingerprint', fingerprint);

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from('video_likes')
          .insert({
            byte_id: byteId,
            user_fingerprint: fingerprint,
          });

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  }, [byteId, fingerprint, isLiked, isLoading]);

  return { likesCount, isLiked, toggleLike, isLoading };
}
