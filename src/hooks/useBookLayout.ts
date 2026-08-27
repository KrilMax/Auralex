import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Book,
  ReaderSettings,
} from '@/lib/types';

export interface LayoutLine {
  text: string;
  startOffset: number;
  endOffset: number;
  paragraphIndex: number;
  height: number;
  spacingAfter: number;
}

export interface LayoutPage {
  content: string;
  chapterIndex: number;
  startOffset: number;
  endOffset: number;
  lines: LayoutLine[];
  startsChapter: boolean;
  chapterTitle: string;
}

export interface BookLayoutResult {
  pages: LayoutPage[];
  totalCharacters: number;
  isCalculating: boolean;
  findPageByOffset: (offset: number) => number;
  calculatedChapterIndex: number;
}

type Chapter =
  NonNullable<Book['chapters']>[number];

const createContainer = (
  settings: ReaderSettings,
  width: number
) => {
  const container =
    document.createElement('div');

  Object.assign(container.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',

    width: `${width}px`,

    visibility: 'hidden',
    pointerEvents: 'none',

    fontFamily: settings.fontFamily,
    fontSize: `${settings.fontSize}px`,
    lineHeight: `${settings.lineHeight}`,

    whiteSpace: 'normal',
    wordBreak: 'normal',
    overflowWrap: 'break-word',

    margin: '0',
    padding: '0',
  });

  document.body.appendChild(container);

  return container;
};

const measureParagraph = (
  container: HTMLDivElement,
  text: string,
  paragraphIndex: number,
  startOffset: number,
  settings: ReaderSettings
): LayoutLine[] => {
  const element =
    document.createElement('div');

  Object.assign(element.style, {
    margin: '0',
    padding: '0',

    fontFamily: settings.fontFamily,
    fontSize: `${settings.fontSize}px`,
    lineHeight: `${settings.lineHeight}`,

    whiteSpace: 'normal',
    wordBreak: 'normal',
    overflowWrap: 'break-word',
  });

  container.appendChild(element);

  if (text.length === 0) {
    element.textContent = '\u00A0';

    const computed =
      window.getComputedStyle(element);

    const lineHeight =
      parseFloat(computed.lineHeight);

    container.removeChild(element);

    return [
      {
        text: '',
        startOffset,
        endOffset: startOffset,
        paragraphIndex,
        height: lineHeight,
        spacingAfter:
          settings.fontSize *
          settings.paragraphSpacing,
      },
    ];
  }

  const textNode =
    document.createTextNode(text);

  element.appendChild(textNode);

  const computed =
    window.getComputedStyle(element);

  const lineHeight =
    parseFloat(computed.lineHeight);

  const lines: LayoutLine[] = [];

  let lineStart = 0;

  let previousTop: number | null = null;

  for (
    let charIndex = 0;
    charIndex < text.length;
    charIndex++
  ) {
    const range =
      document.createRange();

    range.setStart(
      textNode,
      charIndex
    );

    range.setEnd(
      textNode,
      charIndex + 1
    );

    const rect =
      range.getBoundingClientRect();

    const top =
      Math.round(rect.top * 10) / 10;

    if (previousTop === null) {
      previousTop = top;
      lineStart = charIndex;
      continue;
    }

    if (Math.abs(top - previousTop) > 0.5) {
      lines.push({
        text: text.slice(
          lineStart,
          charIndex
        ),

        startOffset:
          startOffset + lineStart,

        endOffset:
          startOffset + charIndex,

        paragraphIndex,

        height: lineHeight,

        spacingAfter: 0,
      });

      lineStart = charIndex;
      previousTop = top;
    }
  }

  lines.push({
    text: text.slice(lineStart),

    startOffset:
      startOffset + lineStart,

    endOffset:
      startOffset + text.length,

    paragraphIndex,

    height: lineHeight,

    spacingAfter:
      settings.fontSize *
      settings.paragraphSpacing,
  });

  container.removeChild(element);

  return lines;
};

const buildPages = (
  chapter: Chapter,
  chapterIndex: number,
  settings: ReaderSettings,
  width: number,
  height: number
): LayoutPage[] => {
  const container =
    createContainer(
      settings,
      width
    );

  const paragraphs =
    chapter.content.split('\n\n');

  const lines: LayoutLine[] = [];

  let offset = 0;

  for (
    let paragraphIndex = 0;
    paragraphIndex < paragraphs.length;
    paragraphIndex++
  ) {
    const paragraph =
      paragraphs[paragraphIndex];

    const paragraphLines =
      measureParagraph(
        container,
        paragraph,
        paragraphIndex,
        offset,
        settings
      );

    lines.push(...paragraphLines);

    offset += paragraph.length;

    if (
      paragraphIndex <
      paragraphs.length - 1
    ) {
      offset += 2;
    }
  }

  document.body.removeChild(
    container
  );

  const pages: LayoutPage[] = [];

  let currentLines: LayoutLine[] = [];

  let currentHeight = 0;

  const pushPage = () => {
    if (
      currentLines.length === 0
    ) {
      return;
    }

    const first =
      currentLines[0];

    const last =
      currentLines[
        currentLines.length - 1
      ];

    pages.push({
      content:
        chapter.content.slice(
          first.startOffset,
          last.endOffset
        ),

      chapterIndex,

      startOffset:
        first.startOffset,

      endOffset:
        last.endOffset,

      lines: currentLines,

      startsChapter:
        pages.length === 0,

      chapterTitle:
        chapter.title,
    });

    currentLines = [];
    currentHeight = 0;
  };

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    const line = lines[i];

    const requiredHeight =
      line.height +
      line.spacingAfter;

    if (
      currentLines.length > 0 &&
      currentHeight +
        requiredHeight >
        height
    ) {
      pushPage();
    }

    currentLines.push(line);

    currentHeight +=
      requiredHeight;
  }

  pushPage();

  return pages;
};

export const useBookLayout = (
  book: Book | null,
  chapterIndex: number,
  settings: ReaderSettings,
  width: number,
  height: number
): BookLayoutResult => {
  const [pages, setPages] =
    useState<LayoutPage[]>([]);

  const [isCalculating, setIsCalculating] =
    useState(false);

  const [calculatedChapterIndex, setCalculatedChapterIndex] =
    useState<number | null>(null);

  const chapter =
    book?.chapters?.[chapterIndex];

  useEffect(() => {
    if (
      !chapter ||
      width <= 0 ||
      height <= 0
    ) {
      setPages([]);
      setIsCalculating(false);
      setCalculatedChapterIndex(null);
      return;
    }

    let cancelled = false;

    setIsCalculating(true);
    setCalculatedChapterIndex(null);

    const frame =
      requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }

        try {
          const result =
            buildPages(
              chapter,
              chapterIndex,
              settings,
              width,
              height
            );

          if (!cancelled) {
            setPages(result);
            setCalculatedChapterIndex(
              chapterIndex
            );
          }
        } catch (error) {
          console.error(
            'Book layout calculation failed:',
            error
          );

          if (!cancelled) {
            setPages([]);
          }
        } finally {
          if (!cancelled) {
            setIsCalculating(false);
          }
        }
      });

    return () => {
      cancelled = true;

      cancelAnimationFrame(
        frame
      );
    };
  }, [
    chapter,
    chapterIndex,

    settings.fontFamily,
    settings.fontSize,
    settings.lineHeight,
    settings.paragraphSpacing,

    width,
    height,
  ]);

  const findPageByOffset =
    useMemo(
      () => (offset: number) => {
        if (pages.length === 0) {
          return 0;
        }

        for (
          let i = 0;
          i < pages.length;
          i++
        ) {
          const page = pages[i];

          if (
            offset >=
              page.startOffset &&
            offset <
              page.endOffset
          ) {
            return i;
          }
        }

        return pages.length - 1;
      },
      [pages]
    );

  return {
    pages,
    totalCharacters:
      chapter?.content.length ?? 0,
    isCalculating,
    calculatedChapterIndex,
    findPageByOffset,
  };
};