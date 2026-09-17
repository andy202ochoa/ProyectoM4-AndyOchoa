export type NoteColor = 'menta' | 'lavanda' | 'coral' | 'cielo' | 'ambar' | 'grafito';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  tags: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
