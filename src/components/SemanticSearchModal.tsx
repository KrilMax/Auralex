import React, { useState } from 'react';
import { searchSemanticIndex } from '@/services/semanticSearch';
import { Search, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onClose: () => void;
  onJumpTo: (
    chapterIndex: number,
    startOffset: number
  ) => void;
  isBuildingIndex: boolean;
  indexProgress: number;
  semanticIndex: Awaited<
    ReturnType<typeof import('@/services/semanticSearch').createSemanticSearchIndex>
  > | null;
  chapters: {
    title?: string;
  }[];
}

const SemanticSearchModal: React.FC<Props> = ({
  open,
  onClose,
  onJumpTo,
  isBuildingIndex,
  indexProgress,
  semanticIndex,
  chapters,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<
    Awaited<
      ReturnType<typeof searchSemanticIndex>
    >
  >([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
  if (!query.trim() || !semanticIndex) return;

  setSearching(true);

  try {
    const searchResults = await searchSemanticIndex(
      query,
      semanticIndex
    );

    setResults(searchResults);
  } catch (error) {
    console.error(
      'Semantic search error:',
      error
    );
    setResults([]);
  } finally {
    setSearching(false);
  }
};

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-[10vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 animate-fade-in">
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="w-5 h-5 text-primary flex-shrink-0" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by meaning, not exact words..."
              className="flex-1 border-0 bg-transparent h-auto p-0 focus-visible:ring-0 text-base"
              autoFocus
            />
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {isBuildingIndex ? (
              <div className="px-4 py-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Preparing semantic search...
                  </span>

                  <span className="text-sm text-primary font-medium">
                    {indexProgress}%
                  </span>
                </div>

                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${indexProgress}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  The book is being analyzed by AI. You can search when this is finished.
                </p>
              </div>
            ) : searching ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <span className="w-5 h-5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin mr-3" />
                Searching semantically...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onJumpTo(
                        r.chapterIndex,
                        r.startOffset
                      );
                      onClose();
                    }}
                    className="w-full text-left p-4 rounded-xl hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-primary font-medium">
                        {chapters[r.chapterIndex]?.title ||
                          `Chapter ${r.chapterIndex + 1}`}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {Math.round(r.score * 100)}% match
                      </span>
                    </div>

                    <p className="text-sm text-foreground/80 font-reading leading-relaxed">
                      {r.text.length > 300
                        ? `${r.text.slice(0, 300)}...`
                        : r.text}
                    </p>

                    <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Jump to fragment
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No results found. Try a different query.
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Search by meaning — find passages even without exact words.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SemanticSearchModal;
