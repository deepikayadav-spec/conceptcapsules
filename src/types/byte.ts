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

// Topic mapping from JSON (uppercase with underscores) to display labels
export const TOPIC_DISPLAY_MAP: Record<string, string> = {
  'DICTIONARIES': 'Dictionaries',
  'LISTS': 'Lists',
  'TUPLES': 'Tuples',
  'SETS': 'Sets',
  'STRINGS': 'Strings',
  'DATA_TYPES': 'Data Types',
  'RECURSION': 'Recursion',
  'LOOPS': 'Loops',
  'CONDITIONAL_STATEMENTS': 'Conditional Statements',
  'PYTHON_GENERAL': 'Python General',
  'TYPE_CONVERSION': 'Type Conversion',
  'FUNCTIONS': 'Functions',
};

// All topic keys in display order
export const ALL_TOPICS = [
  'DICTIONARIES',
  'LISTS',
  'TUPLES',
  'SETS',
  'STRINGS',
  'DATA_TYPES',
  'RECURSION',
  'LOOPS',
  'CONDITIONAL_STATEMENTS',
  'PYTHON_GENERAL',
  'TYPE_CONVERSION',
  'FUNCTIONS',
];

export const getTopicDisplayName = (topic: string): string => {
  return TOPIC_DISPLAY_MAP[topic] || topic;
};

export const getTopicClass = (topic: string): string => {
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '_');
  return `topic-${normalizedTopic}`;
};
