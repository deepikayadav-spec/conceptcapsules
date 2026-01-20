import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFingerprint } from './useFingerprint';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function useVideoFeedback(byteId: string) {
  const [userFeedback, setUserFeedback] = useState<Feedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fingerprint = useFingerprint();

  // Fetch user's existing feedback
  useEffect(() => {
    if (!byteId || !fingerprint) return;

    const fetchFeedback = async () => {
      const { data } = await supabase
        .from('video_feedback')
        .select('*')
        .eq('byte_id', byteId)
        .eq('user_fingerprint', fingerprint)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setUserFeedback({
          id: data.id,
          rating: data.rating,
          comment: data.comment,
          created_at: data.created_at,
        });
      } else {
        setUserFeedback(null);
      }
    };

    fetchFeedback();
  }, [byteId, fingerprint]);

  const submitFeedback = useCallback(async (rating: number, comment?: string) => {
    if (!fingerprint || isSubmitting) return false;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('video_feedback')
        .insert({
          byte_id: byteId,
          user_fingerprint: fingerprint,
          rating,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) throw error;

      setUserFeedback({
        id: data.id,
        rating: data.rating,
        comment: data.comment,
        created_at: data.created_at,
      });

      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [byteId, fingerprint, isSubmitting]);

  return { userFeedback, submitFeedback, isSubmitting };
}
