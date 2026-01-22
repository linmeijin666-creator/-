
export type HighlightType = 'VIEWPOINT' | 'DATA' | 'QUOTE';

export interface Highlight {
  id: string;
  type: HighlightType;
  content: string;
  timestamp: number; // In seconds
  duration?: number;
}

export interface UserNote {
  id: string;
  text: string;
  selectedText: string;
  timestamp: number;
  createdAt: string;
}

export interface PodcastNoteSession {
  id: string;
  title: string;
  url: string;
  audioUrl: string;
  duration: number;
  transcript: string;
  highlights: Highlight[];
  notes: UserNote[];
  createdAt: string;
}

export interface TermQueryResponse {
  definition: string;
  links: { title: string; url: string }[];
}
