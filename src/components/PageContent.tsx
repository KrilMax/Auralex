import { ReaderSettings } from '@/lib/types';

interface PageContentProps {
  text: string;
  settings: ReaderSettings;
  highlightedText?: string;
}

export function PageContent({
  text,
  settings,
  highlightedText,
}: PageContentProps) {
  return (
    <>
      {text
        .split('\n\n')
        .map((para, j) => (
          <p
            key={j}
            className={`
              text-foreground/90
              font-reading
              transition-colors
              duration-500
              rounded-md
              text-left
              ${
                highlightedText &&
                para
                  .replace(/[—–]/g, '-')
                  .replace(/\s+/g, ' ')
                  .includes(highlightedText)
                  ? 'bg-primary/15'
                  : 'bg-transparent'
              }
            `}
            style={{
              marginBottom:
                `${settings.paragraphSpacing}em`,
            }}
          >
            {para}
          </p>
        ))}
    </>
  );
}