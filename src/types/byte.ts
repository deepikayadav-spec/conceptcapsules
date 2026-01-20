export interface Byte {
  byte_id: string;
  byte_name: string;
  byte_description: string;
  byte_topics: string[];
  byte_url: string;
  duration?: number; // Duration in seconds for progress tracking
}

export interface WatchState {
  lastVideoId: string | null;
  completedVideos: string[];
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftPanelSize?: number;
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
  'PYTHON_GENERAL': 'Miscellaneous',
  'TYPE_CONVERSION': 'Type Conversion',
  'FUNCTIONS': 'Functions',
};

// Topic keys in alphabetical order (for filter dropdown)
export const ALL_TOPICS = [
  'CONDITIONAL_STATEMENTS',
  'DATA_TYPES',
  'DICTIONARIES',
  'FUNCTIONS',
  'LISTS',
  'LOOPS',
  'PYTHON_GENERAL',
  'RECURSION',
  'SETS',
  'STRINGS',
  'TUPLES',
  'TYPE_CONVERSION',
];

// Topic sequence for playlist ordering
// Data Types -> Type Conversion -> Conditional Statements -> Loops -> Strings -> Lists -> Functions -> Recursion -> Tuples -> Sets -> Dictionaries -> Miscellaneous
export const TOPIC_SEQUENCE = [
  'DATA_TYPES',
  'TYPE_CONVERSION',
  'CONDITIONAL_STATEMENTS',
  'LOOPS',
  'STRINGS',
  'LISTS',
  'FUNCTIONS',
  'RECURSION',
  'TUPLES',
  'SETS',
  'DICTIONARIES',
  'PYTHON_GENERAL',
];

export const getTopicDisplayName = (topic: string): string => {
  return TOPIC_DISPLAY_MAP[topic] || topic;
};

export const getTopicClass = (topic: string): string => {
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '_');
  return `topic-${normalizedTopic}`;
};
