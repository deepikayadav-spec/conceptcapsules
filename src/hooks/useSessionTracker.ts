import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserIdentity } from './useFingerprint';

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useSessionTracker() {
  const identity = useUserIdentity();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!identity.identifier) return;

    const upsertSession = async () => {
      try {
        // Try to update first
        const { data } = await supabase
          .from('user_sessions')
          .update({ 
            last_active_at: new Date().toISOString(),
            source: identity.source 
          })
          .eq('user_identifier', identity.identifier)
          .select('id')
          .maybeSingle();

        // If no row updated, insert
        if (!data) {
          await supabase
            .from('user_sessions')
            .insert({
              user_identifier: identity.identifier,
              source: identity.source,
              last_active_at: new Date().toISOString(),
            });
        }

        // Record activity snapshot for timeline graph
        await supabase
          .from('activity_snapshots')
          .insert({
            user_identifier: identity.identifier,
          });
      } catch (err) {
        console.error('Session tracking error:', err);
      }
    };

    // Initial upsert
    upsertSession();

    // Heartbeat every 5 minutes
    heartbeatRef.current = setInterval(upsertSession, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [identity.identifier, identity.source]);
}
