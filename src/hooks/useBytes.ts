import { useState, useEffect } from 'react';
import { Byte } from '@/types/byte';

export function useBytes() {
  const [bytes, setBytes] = useState<Byte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBytes = async () => {
      try {
        const response = await fetch('/data/bytes.json');
        if (!response.ok) throw new Error('Failed to fetch bytes');
        const data = await response.json();
        setBytes(data);
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
