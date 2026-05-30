export interface Book {
  id: string;

  ownerId: string;

  title: string;

  format: string;

  originalFilePath: string;

  processedFilePath: string;

  processingStatus:
    | 'uploading'
    | 'processing'
    | 'completed'
    | 'failed';

  uploadedAt?: unknown;

  readingProgress: number;
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
