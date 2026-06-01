export interface GeneratedPage {
  content: string;
  startOffset: number;
  endOffset: number;
  pageNumber: number;
}

export interface PaginationOptions {
  pageHeight: number;
  pageWidth: number;
  fontSize: number;
  lineHeight: number;
}

export interface TextMeasurer {
  measure: (text: string) => number;
}

export function generatePages(
  text: string,
  options: PaginationOptions,
  measurer: TextMeasurer
): GeneratedPage[] {
  if (!text.trim()) {
    return [];
  }

const pages: GeneratedPage[] = [];

let start = 0;

while (start < text.length) {

  let low = start + 100;

  let high = Math.min(
    start + 5000,
    text.length
  );

  let bestEnd = low;

  while (low <= high) {

    const mid = Math.floor(
      (low + high) / 2
    );

    const candidate =
      text.slice(
        start,
        mid
      );

    const height =
      measurer.measure(
        candidate
      );

    if (
      height <=
      options.pageHeight
    ) {
      bestEnd = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  let end = bestEnd;

  const paragraphBreak =
  text.lastIndexOf(
    '\n\n',
    end
  );

if (
  paragraphBreak > start + 500 &&
  end - paragraphBreak < 300
) {
  end = paragraphBreak;
}

  if (end <= start) {
    break;
    }

  pages.push({
    content: text.slice(
      start,
      end
    ),
    startOffset: start,
    endOffset: end,
    pageNumber:
      pages.length + 1,
  });

  start = end;
}

return pages;
}