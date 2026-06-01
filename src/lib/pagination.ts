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

const chunkSize = 3000;

for (
let start = 0;
start < text.length;
start += chunkSize
) {
const end = Math.min(
    start + chunkSize,
    text.length
);

pages.push({
    content: text.slice(start, end),
    startOffset: start,
    endOffset: end,
    pageNumber: pages.length + 1,
});
}

return pages;
}