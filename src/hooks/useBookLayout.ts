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
  metrics: LayoutMetrics
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

useEffect(() => {
  console.log(
    'LAYOUT HEIGHT:',
    metrics.pageHeight
  );
}, [metrics.pageHeight]);

useEffect(() => {
  console.log({
    pageHeight: metrics.pageHeight,
    contentWidth: settings.contentWidth,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
  });
}, [
  metrics.pageHeight,
  settings.contentWidth,
  settings.fontSize,
  settings.lineHeight,
]);

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

    const pages = useMemo(() => {
        if (!fullText) {
            return [];
        }

        const result: LayoutPage[] = [];

        const chunkSize = 3000;

        for (
            let start = 0;
            start < fullText.length;
            start += chunkSize
        ) {
            const end = Math.min(
            start + chunkSize,
            fullText.length
            );

            result.push({
            content: fullText.slice(
                start,
                end
            ),
            startOffset: start,
            endOffset: end,
            pageNumber:
                result.length + 1,
            });
        }

        return result;
        }, [fullText]);

        

    return {
        pages,
        currentOffset,
        setCurrentOffset,
        fullText,
        progress,
    };
}