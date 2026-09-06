export type MoodSentiment = 'positive' | 'neutral' | 'contemplative' | 'challenging';
export type EnergyLevel = 'high' | 'medium' | 'calm';
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  priority: PriorityLevel;
}

export interface MindMapBranch {
  title: string;
  subIdeas: string[];
  color?: string;
}

export interface MindMapData {
  centralConcept: string;
  branches: MindMapBranch[];
}

export interface CognitivePulse {
  mood: {
    label: string;
    emoji: string;
    sentiment: MoodSentiment;
    energy: EnergyLevel;
  };
  actionItems: ActionItem[];
  topicTags: string[];
  summary: string;
  mindMap: MindMapData;
  analyzedAt: number;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: JournalMessage[];
  cognitivePulse?: CognitivePulse;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type ViewMode = 'split' | 'chat' | 'cognitive';
