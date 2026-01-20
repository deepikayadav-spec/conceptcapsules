import { useState, useEffect } from 'react';
import { Byte, TOPIC_SEQUENCE } from '@/types/byte';

// Helper to get the priority of a byte based on its first topic in the sequence
const getTopicPriority = (byte: Byte): number => {
  for (const topic of byte.byte_topics) {
    const index = TOPIC_SEQUENCE.indexOf(topic);
    if (index !== -1) return index;
  }
  return TOPIC_SEQUENCE.length; // Put unknown topics at the end
};

export function useBytes() {
  const [bytes, setBytes] = useState<Byte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBytes = async () => {
      try {
        const response = await fetch('/data/bytes.json');
        if (!response.ok) throw new Error('Failed to fetch bytes');
        const data: Byte[] = await response.json();
        
        // Sort bytes by topic sequence priority
        const sortedBytes = [...data].sort((a, b) => {
          return getTopicPriority(a) - getTopicPriority(b);
        });
        
        setBytes(sortedBytes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBytes();
  }, []);

  const getAllTopics = (): string[] => {
    const topics = new Set<string>();
    bytes.forEach(byte => {
      byte.byte_topics.forEach(topic => topics.add(topic));
    });
    return Array.from(topics).sort();
  };

  return { bytes, loading, error, getAllTopics };
}
