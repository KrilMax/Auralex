import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { ReaderSettings } from '@/lib/types';
import { LayoutPage } from '@/hooks/useBookLayout';
import { PageContent } from '@/components/PageContent';

interface HiddenPaginatorProps {
  text: string;
  settings: ReaderSettings;
  pageHeight: number;
  onPagesReady: (
    pages: LayoutPage[]
  ) => void;
}

export function HiddenPaginator({
  text,
  settings,
  pageHeight,
  onPagesReady,
}: HiddenPaginatorProps) {



    const measureRef =
        useRef<HTMLDivElement>(null);

        const measureText = (
            candidate: string
            ): number => {

            const container =
                document.getElementById(
                'pagination-measure'
                );

            if (!container) {
                return 0;
            }

            container.innerHTML = '';

            candidate
                .split('\n\n')
                .forEach(para => {

                const p =
                    document.createElement('p');

                    p.className =
                'font-reading text-justify';
                
                    p.textContent = para;

                p.style.marginBottom =
                    `${settings.paragraphSpacing}em`;

                p.style.textAlign =
                    'justify';

                container.appendChild(p);
                });

            return (
                measureRef.current
                ?.scrollHeight ?? 0
            );
            };
  
        useEffect(() => {
            if (!text.trim()) {
                onPagesReady([]);
                return;
            }

            const pages: LayoutPage[] = [];

            let start = 0;

            while (start < text.length) {

                let low = start + 1;
                let high = text.length;
                let best = start + 1;

                while (low <= high) {

                    const mid = Math.floor(
                    (low + high) / 2
                    );

                    const height =
                    measureText(
                        text.slice(
                        start,
                        mid
                        )
                    );

                    if (height <= pageHeight) {

                    best = mid;
                    low = mid + 1;

                    } else {

                    high = mid - 1;

                    }
                }

                let end = best;

                if (
                end < text.length &&
                text[end] !== ' '
                ) {

                while (
                    end < text.length &&
                    text[end] !== ' ' &&
                    text[end] !== '\n'
                    ) {
                    end++;
                    }

                }

                const adjustedHeight =
                    measureText(
                        text.slice(
                        start,
                        end
                        )
                    );

                    const overflow =
                        adjustedHeight -
                        pageHeight;

                        if (
                        overflow > 12
                        ) {

                        const previousWordStart = end;

                            end = best;

                            while (
                                end > start &&
                                text[end] !== ' ' &&
                                text[end] !== '\n'
                                ) {
                                end--;
                                }

                            const rollbackHeight =
                            measureText(
                                text.slice(
                                start,
                                end
                                )
                            );

                            if (
                            pageHeight -
                            rollbackHeight >
                            30
                            ) {
                            end = previousWordStart;
                            }

                        }

                console.log(
                    'LAST CHARS:',
                    text.slice(
                        end - 50,
                        end
                    )
                    );

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

            console.log(
                'PAGES:',
                pages.length
                );

            onPagesReady(pages);

            }, [
            text,
            pageHeight,
            settings.fontSize,
            settings.lineHeight,
            settings.paragraphSpacing,
            settings.contentWidth,
            ]);

  return (
  <div
    ref={measureRef}
    style={{
      position: 'fixed',
      visibility: 'hidden',
      pointerEvents: 'none',
      zIndex: -9999,
      width: `${settings.contentWidth}px`,
      fontFamily: settings.fontFamily,
      fontSize: `${settings.fontSize}px`,
      lineHeight: settings.lineHeight,
      overflow: 'hidden',
    }}
  >
    <div id="pagination-measure">
        <PageContent
            text=""
            settings={settings}
        />
        </div>
  </div>
);
}