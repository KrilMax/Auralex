export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  progress: number; // 0-100
  lastRead?: Date;
  chapters: Chapter[];
  totalPages: number;
  currentChapter: number;
  genre: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ReaderSettings {
  theme: 'dark' | 'light' | 'sepia';
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  contentWidth: number;
  paragraphSpacing: number;
  readingMode: 'scroll' | 'paginate';
}

export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  fragment: string;
  relevance: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}
