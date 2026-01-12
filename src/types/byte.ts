export interface Byte {
  byte_id: string;
  byte_name: string;
  byte_description: string;
  byte_topics: string[];
  byte_url: string;
}

export interface WatchState {
  lastVideoId: string | null;
  completedVideos: string[];
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
}

export const STORAGE_KEY = 'concept-capsule-state';

export const getTopicClass = (topic: string): string => {
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '_');
  return `topic-${normalizedTopic}`;
};
