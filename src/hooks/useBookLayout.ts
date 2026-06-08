import { Book, ReaderSettings } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';

export interface BookLayout {
  pages: LayoutPage[];

  currentOffset: number;

  setCurrentOffset: (
    offset: number
  ) => void;

  fullText: string;

  progress: number;
}

export interface LayoutPage {
  content: string;
  startOffset: number;
  endOffset: number;
  pageNumber: number;
}

export interface LayoutMetrics {
  pageHeight: number;
}

export function useBookLayout(
  book: Book | null,
  settings: ReaderSettings,
  metrics: LayoutMetrics,
): BookLayout {

  const fullText = useMemo(() => {
    if (!book?.chapters?.length) {
      return '';
    }

    return book.chapters
      .map(
        chapter =>
          `${chapter.title}\n\n${chapter.content}`
      )
      .join('\n\n');
  }, [book]);

  const [currentOffset, setCurrentOffset] =
  useState(0);

  const progress = useMemo(() => {
    if (!fullText.length) {
        return 0;
    }

    return (
        currentOffset /
        fullText.length
    ) * 100;
    }, [
    currentOffset,
    fullText,
    ]);

    const pages: LayoutPage[] = [];

    return {
        pages,
        currentOffset,
        setCurrentOffset,
        fullText,
        progress,
    };
}