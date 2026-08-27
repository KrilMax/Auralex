import React, {
  useEffect,
  useState,
  useRef,
} from 'react';

import {
  useParams,
  useNavigate,
} from 'react-router-dom';

import {
  ReaderSettings,
  Book,
  Bookmark as BookBookmark,
} from '@/lib/types';

import {
  updateBook,
  db,
} from '@/lib/firebase';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import BookmarksDrawer from '@/components/BookmarksDrawer';
import ReaderSettingsDrawer from '@/components/ReaderSettingsDrawer';
import SemanticSearchModal from '@/components/SemanticSearchModal';
import TTSControlPanel from '@/components/TTSControlPanel';

import { Button } from '@/components/ui/button';

import {
  ArrowLeft,
  Settings,
  Search,
  Volume2,
  Bookmark,
  ChevronLeft,
  ChevronRight,

} from 'lucide-react';

import { useBookLayout } from '@/hooks/useBookLayout';

const defaultSettings: ReaderSettings = {
  theme: 'dark',
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: 19,
  lineHeight: 1.8,
  contentWidth: 680,
  paragraphSpacing: 1.5,
  readingMode: 'paginate',
};

const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();


  // =========================================================
  // BOOK
  // =========================================================

  const [book, setBook] =
    useState<Book | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (loading) return;

    const element = pageAreaRef.current;

    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();

      setLayoutSize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [loading]);

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;

      try {
        const docRef =
          doc(db, 'books', id);

        const snapshot =
          await getDoc(docRef);

        if (snapshot.exists()) {
          const loadedBook = {
            id: snapshot.id,
            ...snapshot.data(),
          } as Book;

          setBook(loadedBook);
        }
      } catch (error) {
        console.error(
          'Failed to load book:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  // =========================================================
  // SETTINGS
  // =========================================================
  const [settings, setSettings] =
    useState<ReaderSettings>(() => {
      const saved =
        localStorage.getItem(
          'reader-settings'
        );
      return saved
        ? JSON.parse(saved)
        : defaultSettings;
    });

  const [currentChapterIndex, setCurrentChapterIndex] =
    useState(book?.lastChapter ?? 0);

  const [currentPageIndex, setCurrentPageIndex] =
    useState(book?.lastPageIndex ?? 0);

  const [pendingLastPage, setPendingLastPage] =
    useState(false);

  const [pendingBookmark, setPendingBookmark] =
    useState<BookBookmark | null>(null);

  const [activeBookmark, setActiveBookmark] =
    useState<BookBookmark | null>(null);

  const [bookmarkHighlightVisible, setBookmarkHighlightVisible] =
  useState(false);

  const pageAreaRef =
    useRef<HTMLDivElement>(null);

  const [layoutSize, setLayoutSize] =
    useState({
      width: 0,
      height: 0,
    });

    useEffect(() => {
  if (!book) return;

  setCurrentChapterIndex(
    book.lastChapter ?? 0
  );

  setCurrentPageIndex(
    book.lastPageIndex ?? 0
  );
}, [book]);

  const {
    pages,
    isCalculating,
    calculatedChapterIndex,
  } = useBookLayout(
    book,
    currentChapterIndex,
    settings,
    layoutSize.width,
    Math.max(0, layoutSize.height - 20)
  );

  const goToNextPage = () => {
    if (!book) return;

    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(page => page + 1);
      return;
    }

    if (
      currentChapterIndex <
      book.chapters.length - 1
    ) {
      setCurrentChapterIndex(
        chapter => chapter + 1
      );
      setCurrentPageIndex(0);
    }
  };

  const goToPreviousPage = () => {
    if (!book) return;

    if (currentPageIndex > 0) {
      setCurrentPageIndex(page => page - 1);
      return;
    }

    if (currentChapterIndex > 0) {
      setPendingLastPage(true);

      setCurrentChapterIndex(
        chapter => chapter - 1
      );

      setCurrentPageIndex(0);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.deltaY > 0) {
      goToNextPage();
    } else if (e.deltaY < 0) {
      goToPreviousPage();
    }
  };

  useEffect(() => {
    if (isCalculating) {
      return;
    }

    if (
      calculatedChapterIndex !==
      currentChapterIndex
    ) {
      return;
    }

    if (pages.length === 0) {
      return;
    }

    if (pendingLastPage) {
      setCurrentPageIndex(
        pages.length - 1
      );

      setPendingLastPage(false);
      return;
    }

    if (pendingBookmark) {
      const bookmarkPageIndex =
        pages.findIndex(
          page =>
            pendingBookmark.startOffset >=
              page.startOffset &&
            pendingBookmark.startOffset <
              page.endOffset
        );

      if (bookmarkPageIndex >= 0) {
        setCurrentPageIndex(
          bookmarkPageIndex
        );
      }

      setPendingBookmark(null);
      return;
    }

    setCurrentPageIndex(page =>
      Math.min(
        page,
        pages.length - 1
      )
    );
  }, [
    pages,
    isCalculating,
    pendingLastPage,
    pendingBookmark,
    calculatedChapterIndex,
    currentChapterIndex,
  ]);

  useEffect(() => {
  if (!book) return;

  if (isCalculating) return;

  if (
    calculatedChapterIndex !==
    currentChapterIndex
  ) {
    return;
  }

  if (pages.length === 0) return;

  updateBook(book.id, {
    lastChapter:
      currentChapterIndex,

    lastPageIndex:
      currentPageIndex,
  }).catch(console.error);
}, [
  book,
  currentChapterIndex,
  currentPageIndex,
  pages.length,
  isCalculating,
  calculatedChapterIndex,
]);

  useEffect(() => {
    localStorage.setItem(
      'reader-settings',
      JSON.stringify(settings)
    );
  }, [settings]);

  

  // =========================================================
  // PANELS
  // =========================================================
  const [showSettings, setShowSettings] =
    useState(false);

  const [showSearch, setShowSearch] =
    useState(false);

  const [showTTS, setShowTTS] =
    useState(false);

  const [showBookmarks, setShowBookmarks] =
    useState(false);

  // =========================================================
  // BOOKMARKS
  // =========================================================
  const [bookmarks, setBookmarks] =
    useState<BookBookmark[]>(
      book?.bookmarks ?? []
    );

  const [selectedText, setSelectedText] =
    useState('');

  const [selectedRange, setSelectedRange] =
    useState<{
      startOffset: number;
      endOffset: number;
    } | null>(null);

  const [bookmarkButtonPosition, setBookmarkButtonPosition] =
    useState<{
      x: number;
      y: number;
    } | null>(null);

const handleTextSelection = () => {
  const selection = window.getSelection();

  if (
    !selection ||
    selection.rangeCount === 0
  ) {
    setSelectedText('');
    setSelectedRange(null);
    setBookmarkButtonPosition(null);
    return;
  }

  const text = selection.toString();

  if (!text.trim()) {
    setSelectedText('');
    setSelectedRange(null);
    setBookmarkButtonPosition(null);
    return;
  }

  const range = selection.getRangeAt(0);
  const container = pageAreaRef.current;
  const page = pages[currentPageIndex];

  if (!container || !page) {
    return;
  }

  if (
    !container.contains(range.startContainer) ||
    !container.contains(range.endContainer)
  ) {
    return;
  }

  const getLineElement = (
    node: Node
  ): HTMLElement | null => {
    const element =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;

    return element?.closest(
      '[data-start-offset]'
    ) as HTMLElement | null;
  };

  const startLine =
    getLineElement(range.startContainer);

  const endLine =
    getLineElement(range.endContainer);

  if (!startLine || !endLine) {
    return;
  }

  const startLineOffset = Number(
    startLine.dataset.startOffset
  );

  const endLineOffset = Number(
    endLine.dataset.startOffset
  );

  const startOffset =
    startLineOffset +
    range.startOffset;

  const endOffset =
    endLineOffset +
    range.endOffset;

  if (endOffset <= startOffset) {
    return;
  }

  const rect =
    range.getBoundingClientRect();

  setSelectedText(text);

  setSelectedRange({
    startOffset,
    endOffset,
  });

  setBookmarkButtonPosition({
    x:
      rect.left +
      rect.width / 2,

    y:
      Math.max(
        10,
        rect.top - 40
      ),
  });
};

const addBookmark = async () => {
  if (
    !book ||
    !selectedText ||
    !selectedRange
  ) {
    return;
  }

  try {
    const bookmark: BookBookmark = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      selectedText,
      chapterIndex: currentChapterIndex,
      startOffset: selectedRange.startOffset,
      endOffset: selectedRange.endOffset,
      createdAt: Date.now(),
    };

    const updatedBookmarks = [
      ...bookmarks,
      bookmark,
    ];

    setBookmarks(updatedBookmarks);

    await updateBook(book.id, {
      bookmarks: updatedBookmarks,
    });

    setSelectedText('');
    setSelectedRange(null);
    setBookmarkButtonPosition(null);

    window.getSelection()?.removeAllRanges();
  } catch (error) {
    console.error(
      'Failed to add bookmark:',
      error
    );
  }
};

  useEffect(() => {
    setBookmarks(
      book?.bookmarks ?? []
    );
  }, [book]);

  const deleteBookmark = async (
    bookmarkId: string
  ) => {
    if (!book) return;

    const updatedBookmarks =
      bookmarks.filter(
        bookmark =>
          bookmark.id !== bookmarkId
      );

    setBookmarks(
      updatedBookmarks
    );

    await updateBook(
      book.id,
      {
        bookmarks:
          updatedBookmarks,
      }
    );
  };

  const handleBookmarkSelect = (
  bookmark: BookBookmark
) => {
  if (!book) return;

  setShowBookmarks(false);

  setActiveBookmark(bookmark);
  setBookmarkHighlightVisible(true);

  if (
    bookmark.chapterIndex ===
    currentChapterIndex
  ) {
    const pageIndex =
      pages.findIndex(
        page =>
          bookmark.startOffset >=
            page.startOffset &&
          bookmark.startOffset <
            page.endOffset
      );

    if (pageIndex >= 0) {
      setCurrentPageIndex(pageIndex);
    }

    return;
  }

  setCurrentChapterIndex(
    bookmark.chapterIndex
  );

  setCurrentPageIndex(0);

  setPendingBookmark(bookmark);
};

useEffect(() => {
  if (!bookmarkHighlightVisible) {
    return;
  }

  const fadeTimer = window.setTimeout(() => {
    setBookmarkHighlightVisible(false);
  }, 5000);

  const clearTimer = window.setTimeout(() => {
    setActiveBookmark(null);
  }, 6000);

  return () => {
    window.clearTimeout(fadeTimer);
    window.clearTimeout(clearTimer);
  };
}, [bookmarkHighlightVisible]);

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading book...
      </div>
    );
  }

  // =========================================================
  // BOOK NOT FOUND
  // =========================================================
  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">

          <p className="text-muted-foreground mb-4">
            Book not found
          </p>

          <Button
            onClick={() =>
              navigate('/library')
            }
          >
            Back to Library
          </Button>

        </div>
      </div>
    );
  }


  // =========================================================
  // THEME
  // =========================================================
  const themeClass =
    settings.theme === 'light'
      ? 'reader-light'
      : settings.theme === 'sepia'
        ? 'reader-sepia'
        : '';


  // =========================================================
  // READER
  // =========================================================
  return (
    <div
      className={`
        min-h-screen
        bg-background
        text-foreground
        transition-colors
        duration-300
        ${themeClass}
      `}
    >

      {/* =====================================================
          TOOLBAR
      ===================================================== */}
      <div className="fixed top-0 inset-x-0 z-30">
        <div className="bg-card/90 backdrop-blur-xl border-b border-border">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">

            {/* LEFT */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  navigate('/library')
                }
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {book.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {book?.chapters?.[currentChapterIndex]?.title ?? 'Reader'}
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-1">

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowBookmarks(true)
                }
                className="text-muted-foreground"
              >
                <Bookmark className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowSearch(true)
                }
                className="text-muted-foreground"
              >
                <Search className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowTTS(true)
                }
                className="text-muted-foreground"
              >
                <Volume2 className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowSettings(true)
                }
                className="text-muted-foreground"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          READER AREA
      ===================================================== */}

      <main
        className="h-screen pt-20 pb-24 px-4"
        onWheel={handleWheel}
        onMouseUp={handleTextSelection}
      >
        {bookmarkButtonPosition && (
          <button
            type="button"
            onMouseDown={event => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onMouseUp={event => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              addBookmark();
            }}
            className="fixed z-50 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-violet-400/40 shadow-lg"
            style={{
              left: bookmarkButtonPosition.x,
              top: bookmarkButtonPosition.y,
              transform: 'translateX(-50%)',
            }}
          >
            <Bookmark className="w-4 h-4 text-violet-400" />
          </button>
        )}

        <div
          ref={pageAreaRef}
          className="mx-auto"
          style={{
            maxWidth:
              `${settings.contentWidth}px`,
            height:
              'calc(100vh - 150px)',
            fontFamily:
              settings.fontFamily,
            fontSize:
              `${settings.fontSize}px`,
            lineHeight:
              settings.lineHeight,
          }}
        >

          <div className="h-full overflow-hidden">

            {isCalculating ||
              calculatedChapterIndex !==
                currentChapterIndex ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Calculating...
                  </p>
                </div>
              ) : pages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">
                  No content
                </p>
              </div>
            ) : (
              <div
                className="h-full overflow-hidden"
                style={{
                  fontFamily: settings.fontFamily,
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight,
                }}
              >
                {pages[currentPageIndex]?.lines.map(
                  (line, index) => (
                    <div
                      key={`${line.startOffset}-${index}`}
                      data-start-offset={line.startOffset}
                      data-end-offset={line.endOffset}
                      style={{
                        height: `${line.height}px`,
                        lineHeight: `${line.height}px`,
                        marginBottom:
                          `${line.spacingAfter}px`,
                        overflow: 'hidden',
                      }}
                    >
                      {(() => {
                        if (
                          !activeBookmark ||
                          activeBookmark.chapterIndex !==
                            currentChapterIndex
                        ) {
                          return line.text;
                        }

                        const selectionStart =
                          Math.max(
                            activeBookmark.startOffset,
                            line.startOffset
                          );

                        const selectionEnd =
                          Math.min(
                            activeBookmark.endOffset,
                            line.endOffset
                          );

                        if (
                          selectionStart >= selectionEnd
                        ) {
                          return line.text;
                        }

                        const start =
                          selectionStart -
                          line.startOffset;

                        const end =
                          selectionEnd -
                          line.startOffset;

                        return (
                          <>
                            {line.text.slice(0, start)}

                            <mark
                              className={`text-inherit rounded-sm transition-colors duration-1000 ${
                                bookmarkHighlightVisible
                                  ? 'bg-violet-400/30'
                                  : 'bg-transparent'
                              }`}
                            >
                              {line.text.slice(start, end)}
                            </mark>

                            {line.text.slice(end)}
                          </>
                        );
                      })()}
                    </div>
                  )
                )}
              </div>
            )}

          </div>

        </div>

      </main>


      {/* =====================================================
          SETTINGS
      ===================================================== */}

      <ReaderSettingsDrawer
        open={showSettings}
        onClose={() =>
          setShowSettings(false)
        }
        settings={settings}
        onChange={setSettings}
      />


      {/* =====================================================
          BOOKMARKS
      ===================================================== */}

      <BookmarksDrawer
        open={showBookmarks}
        bookmarks={bookmarks}
        chapters={book.chapters ?? []}
        onDelete={deleteBookmark}
        onSelect={handleBookmarkSelect}
        onClose={() =>
          setShowBookmarks(false)
        }
      />


      {/* =====================================================
          SEARCH
      ===================================================== */}

      <SemanticSearchModal
        open={showSearch}
        onClose={() =>
          setShowSearch(false)
        }
        onJumpTo={(chapterId) => {
          console.log(
            'Jump to chapter:',
            chapterId
          );

          setShowSearch(false);
        }}
      />


      {/* =====================================================
          TTS
      ===================================================== */}

      <TTSControlPanel
        visible={showTTS}
        onClose={() =>
          setShowTTS(false)
        }
      />

      {settings.readingMode === 'paginate' && (
        <div className="fixed bottom-0 inset-x-0 z-30">
          <div className="bg-card/95 backdrop-blur-xl border-t border-border">

            <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">

              <Button
                variant="ghost"
                onClick={goToPreviousPage}
                disabled={
                  currentChapterIndex === 0 &&
                  currentPageIndex === 0
                }
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                {pages.length > 0
                  ? `${currentPageIndex + 1} / ${pages.length}`
                  : '0 / 0'}
              </span>

              <Button
                variant="ghost"
                onClick={goToNextPage}
                disabled={
                  currentChapterIndex >=
                    book.chapters.length - 1 &&
                  currentPageIndex >=
                    pages.length - 1
                }
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};


export default ReaderPage;