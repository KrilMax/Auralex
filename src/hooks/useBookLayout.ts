import { Book, ReaderSettings } from '@/lib/types';
import { TextMeasurer } from '@/lib/pagination';
import { useMemo, useState, useEffect } from 'react';
import { generatePages, } from '@/lib/pagination';

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
  measurer: TextMeasurer
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

    const [pages, setPages] =
  useState<LayoutPage[]>([]);

  useEffect(() => {
  if (!fullText) {
    setPages([]);
    return;
  }

  const generated =
    generatePages(
      fullText,
      {
        pageHeight:
          metrics.pageHeight,
        pageWidth:
          settings.contentWidth,
        fontSize:
          settings.fontSize,
        lineHeight:
          settings.lineHeight,
      },
      measurer
    );

    console.log(
  'LAYOUT PAGES:',
  generated.length
);

  setPages(generated);
}, [
  fullText,
  metrics.pageHeight,
  settings.contentWidth,
  settings.fontSize,
  settings.lineHeight,
  measurer,
]);

    return {
        pages,
        currentOffset,
        setCurrentOffset,
        fullText,
        progress,
    };
}