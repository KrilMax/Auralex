import { updateBook } from '@/lib/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReaderSettings, Book, Bookmark as BookBookmark } from '@/lib/types';
import BookmarksDrawer from '@/components/BookmarksDrawer';
import ReaderSettingsDrawer from '@/components/ReaderSettingsDrawer';
import SemanticSearchModal from '@/components/SemanticSearchModal';
import TTSControlPanel from '@/components/TTSControlPanel';
import { Button } from '@/components/ui/button';
import { BookmarkPlus } from 'lucide-react';
import { useBookLayout } from '@/hooks/useBookLayout';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft,
  Settings,
  Search,
  Volume2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Page {
  content: string;

  chapterIndex: number;

  startsChapter: boolean;

  chapterTitle?: string;

  startOffset: number;

  endOffset: number;

  pageNumber: number;
}

const defaultSettings: ReaderSettings = {
  theme: 'dark',
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: 19,
  lineHeight: 1.8,
  contentWidth: 680,
  paragraphSpacing: 1.5,
  readingMode: 'scroll',
};

const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
const [book, setBook] =
  useState<Book | null>(null);

const [loading, setLoading] =
  useState(true);

const [currentPage, setCurrentPage] = useState(0);

const [currentPageIndex, setCurrentPageIndex] =
  useState(0);

const [
  positionRestored,
  setPositionRestored,
] = useState(false);

const [initialScrollDone, setInitialScrollDone] =
  useState(false);

const [showToolbar, setShowToolbar] = useState(true);

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

        /*if (
          typeof loadedBook.lastChapter ===
          'number'
        ) {
          setCurrentPage(
            loadedBook.lastChapter
          );
        }*/
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  loadBook();
}, [id]);

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


  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [pageHeight, setPageHeight] =
  useState(567);

  const measureRef =
  useRef<HTMLDivElement>(null);

  const contentRef =
  useRef<HTMLDivElement>(null);

  const paginationRef =
  useRef<HTMLDivElement>(null);

  useEffect(() => {
  if (!measureRef.current) {
    return;
  }

  setPageHeight(
    measureRef.current.clientHeight
  );
}, []);

const textMeasurer = React.useMemo(
  () => ({
    measure: (
      text: string
    ) => {

      if (!measureRef.current) {
        return 0;
      }

      measureRef.current.textContent =
        text;

      return (
        measureRef.current
          .scrollHeight
      );
    },
  }),
  []
);

const layout = useBookLayout(book, settings, { pageHeight, }, textMeasurer);

const currentLayoutPage =
  layout.pages[
    currentPageIndex
  ];

  const bookBlocks = React.useMemo(() => {
    if (!book) return [];

    return book.chapters.flatMap(
      (chapter, chapterIndex) => {
        const paragraphs =
          chapter.content
            .split('\n\n')
            .filter(Boolean);

        return [
          {
            type: 'chapter',
            content: chapter.title,
            chapterIndex,
          },

          ...paragraphs.map(
            (paragraph) => ({
              type: 'paragraph',
              content: paragraph,
              chapterIndex,
            })
          ),
        ];
      }
    );
  }, [book]);

  const fullBookText = React.useMemo(() => {
  if (!book) return '';

  return book.chapters
    .map(
      chapter =>
        `${chapter.title}\n\n${chapter.content}`
    )
    .join('\n\n');
}, [book]);

const generatedPages = React.useMemo(() => {
  if (!book) return [];

  const result: Page[] = [];

  let currentContent: string[] = [];
  let currentLength = 0;

  let currentChapterIndex = 0;
  let startsChapter = false;
  let currentTitle = '';

  for (const block of bookBlocks) {
    if (block.type === 'chapter') {
      if (currentContent.length > 0) {
        result.push({
          content: currentContent.join('\n\n'),
          chapterIndex: currentChapterIndex,
          startsChapter,
          chapterTitle: currentTitle,
          startOffset: 0,
          endOffset: 0,
          pageNumber: result.length + 1,
        });

        currentContent = [];
        currentLength = 0;
      }

      currentChapterIndex =
        block.chapterIndex;

      currentTitle =
        block.content;

      startsChapter = true;

      continue;
    }

    currentContent.push(
      block.content
    );

    currentLength +=
      block.content.length;

    if (
      currentLength >= 3500
    ) {
      result.push({
        content: currentContent.join(
          '\n\n'
        ),
        chapterIndex:
          currentChapterIndex,
        startsChapter,
        chapterTitle:
          currentTitle,
        startOffset: 0,
        endOffset: 0,
        pageNumber: result.length + 1,
      });

      currentContent = [];
      currentLength = 0;

      startsChapter = false;
    }
  }

  if (currentContent.length > 0) {
    result.push({
      content: currentContent.join(
        '\n\n'
      ),
      chapterIndex:
        currentChapterIndex,
      startsChapter,
      chapterTitle:
        currentTitle,
      startOffset: 0,
      endOffset: 0,
      pageNumber: result.length + 1,
    });
  }

  return result;
}, [
  book,
  bookBlocks,
  settings.fontSize,
  settings.lineHeight,
  settings.contentWidth,
]);

useEffect(() => {
  if (!book) return;

  if (layout.pages.length === 0)
    return;

  if (
    typeof book.lastPageIndex ===
    'number'
  ) {
    setCurrentPageIndex(
      Math.min(
        book.lastPageIndex,
        layout.pages.length - 1
      )
    );

    setPositionRestored(
      true
    );

    return;
  }

  if (
    typeof book.readingProgress !==
    'number'
  )
    return;

  const page = Math.floor(
    (book.readingProgress / 100) *
    (layout.pages.length - 1)
  );

  setCurrentPageIndex(
    Math.min(
      page,
      layout.pages.length - 1
    )
  );

  setPositionRestored(true);
}, [
  book,
  layout.pages.length,
]);

  const [showTTS, setShowTTS] = useState(false);

  const [
    showBookmarks,
    setShowBookmarks
  ] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      'reader-settings',
      JSON.stringify(settings)
    );
  }, [settings]);

  const lastScrollY = useRef(0);
  
useEffect(() => {
  if (!book) return;

  if (initialScrollDone) return;

  if (settings.readingMode !== 'scroll')
    return;

  const chapter =
    book.chapters?.[currentPage];

  if (!chapter) return;

  const timer = setTimeout(() => {
    const el = document.getElementById(
      `chapter-${chapter.id}`
    );

    if (el) {
      el.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });

      setInitialScrollDone(true);
    }
  }, 500);

  return () => clearTimeout(timer);
}, [
  book,
  currentPage,
  settings.readingMode,
  initialScrollDone,
]);

useEffect(() => {
  if (!book) return;

  if (layout.pages.length === 0)
    return;

  if (!positionRestored)
    return;

  const progress =
    (
      currentPageIndex /
      (layout.pages.length - 1)
    ) * 100;

  updateBook(book.id, {
    readingProgress: progress,
    lastPageIndex:
      currentPageIndex,
  }).catch(console.error);

}, [
  currentPageIndex,
  layout.pages.length,
  positionRestored,
]);

useEffect(() => {
  if (
    layout.pages.length === 0
  ) {
    return;
  }

  const progress =
    currentPageIndex /
    Math.max(
      1,
      layout.pages.length - 1
    );

  const offset = Math.floor(
    progress *
    layout.fullText.length
  );

  layout.setCurrentOffset(
    offset
  );
}, [
  currentPageIndex,
  layout.pages.length,
  layout,
]);

useEffect(() => {
  if (
    settings.readingMode !== 'scroll'
  )
    return;

  const handleScrollProgress =
    () => {
      const chapters =
        document.querySelectorAll(
          '[id^="chapter-"]'
        );

      let visibleChapter = 0;

      chapters.forEach(
        (
          chapter,
          index
        ) => {
          const rect =
            chapter.getBoundingClientRect();

          if (
            rect.top <=
            window.innerHeight * 0.7
          ) {
            visibleChapter =
              index;
          }
        }
      );

      setCurrentPage(
        visibleChapter
      );
    };

  window.addEventListener(
    'scroll',
    handleScrollProgress
  );

  return () =>
    window.removeEventListener(
      'scroll',
      handleScrollProgress
    );
}, [
  settings.readingMode,
  book
]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60) {
        setShowToolbar(false);
      } else {
        setShowToolbar(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
useEffect(() => {
  if (
    settings.readingMode !==
    'paginate'
  )
    return;

  const handleKeyDown = (
    e: KeyboardEvent
  ) => {
    if (
      e.key === 'ArrowRight'
    ) {
      setCurrentPageIndex(
        p =>
          Math.min(
            layout.pages.length - 1,
            p + 1
          )
      );
    }

    if (
      e.key === 'ArrowLeft'
    ) {
      setCurrentPageIndex(
        p =>
          Math.max(
            0,
            p - 1
          )
      );
    }
  };

  window.addEventListener(
    'keydown',
    handleKeyDown
  );

  return () =>
    window.removeEventListener(
      'keydown',
      handleKeyDown
    );
}, [
  settings.readingMode,
  layout.pages.length,
]);

const handleReaderClick = (
  e: React.MouseEvent
) => {
  if (
    settings.readingMode !==
    'paginate'
  )
    return;

  const contentRect =
    contentRef.current?.getBoundingClientRect();

  if (!contentRect) return;

  const x = e.clientX;

  if (x < contentRect.left) {
    setCurrentPageIndex(
      p => Math.max(0, p - 1)
    );

    return;
  }

  if (x > contentRect.right) {
    setCurrentPageIndex(
      p =>
        Math.min(
          layout.pages.length - 1,
          p + 1
        )
    );

    return;
  }

  setShowToolbar(
    prev => !prev
  );
};

const [
  selectedText,
  setSelectedText,
] = useState('');

const [
  showBookmarkButton,
  setShowBookmarkButton,
] = useState(false);

const [
  bookmarkButtonPosition,
  setBookmarkButtonPosition,
] = useState({
  x: 0,
  y: 0,
});

useEffect(() => {
  const handleSelection = () => {
    const selection =
      window.getSelection();

    const text =
      selection
        ?.toString()
        .trim();

    if (!text) {
      setShowBookmarkButton(
        false
      );

      return;
    }

    const range =
      selection?.getRangeAt(0);

    if (!range) return;

    const container =
      contentRef.current;

    if (!container) return;

    if (
      !container.contains(
        range.commonAncestorContainer
      )
    ) {
      setShowBookmarkButton(false);

      return;
    }

    const target =
      range.commonAncestorContainer
        .parentElement;

      if (
      !target?.closest(
        '.font-reading'
      )
    ) {
      setShowBookmarkButton(false);

      return;
    }
    
        if (
      target?.closest('button')
    ) {
      setShowBookmarkButton(false);
      return;
    }

    if (
      !container.contains(
        range.commonAncestorContainer
      )
    ) {
      setShowBookmarkButton(false);

      return;
    }

    const rect =
      range.getBoundingClientRect();

    setSelectedText(text);

    setBookmarkButtonPosition({
      x:
        rect.left +
        rect.width / 2,
      y:
        rect.top - 40,
    });

    setShowBookmarkButton(
      true
    );
  };

  document.addEventListener(
    'mouseup',
    handleSelection
  );

  return () =>
    document.removeEventListener(
      'mouseup',
      handleSelection
    );
}, []);

const [bookmarks, setBookmarks] =
  useState<BookBookmark[]>(
    book?.bookmarks ?? []
  );

  useEffect(() => {
  setBookmarks(
    book?.bookmarks ?? []
  );
}, [book]);

const addBookmark = async () => {
  if (!book) return;

  if (!selectedText.trim())
    return;

  const newBookmark: BookBookmark =
    {
      id: crypto.randomUUID(),

      selectedText:
        selectedText
          .replace(/[—–]/g, '-')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80),

      chapterIndex:
        generatedPages[
          currentPageIndex
        ]?.chapterIndex ?? 0,

      pageIndex:
        currentPageIndex,

      createdAt:
        Date.now(),
    };

  const updatedBookmarks = [
    ...bookmarks,
    newBookmark,
  ];

  setBookmarks(
    updatedBookmarks
  );

  setShowBookmarkButton(
    false
  );

  await updateBook(
    book.id,
    {
      bookmarks:
        updatedBookmarks,
    }
  );
};

const deleteBookmark = async (
  bookmarkId: string
) => {
  if (!book) return;

  const updatedBookmarks =
    bookmarks.filter(
      (bookmark) =>
        bookmark.id !==
        bookmarkId
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
  if (
  typeof bookmark.pageIndex ===
  'number'
) {
  setCurrentPageIndex(
    bookmark.pageIndex
  );
}

  setTimeout(() => {
    setHighlightedText(
      bookmark.selectedText
    );
  }, 300);

  setShowBookmarks(false);
};

const [
  highlightedText,
  setHighlightedText,
] = useState('');

useEffect(() => {
  if (!highlightedText)
    return;

  const timer =
    setTimeout(() => {
      setHighlightedText('');
    }, 2000);

  return () =>
    clearTimeout(timer);
}, [highlightedText]);

  if (loading) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      Loading book...
    </div>
  );
}

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Book not found</p>
          <Button onClick={() => navigate('/library')}>Back to Library</Button>
        </div>
      </div>
    );
  }

  const themeClass = settings.theme === 'light' ? 'reader-light' : settings.theme === 'sepia' ? 'reader-sepia' : '';

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${themeClass}`}
    >
      {/* Toolbar */}
      <div
        className={`fixed top-0 inset-x-0 z-30 transition-all duration-300 ${
          showToolbar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-card/90 backdrop-blur-xl border-b border-border">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/library')} className="text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{book.title}</p>
                <p className="text-xs text-muted-foreground">
                  {
                    book.chapters[
                      generatedPages[currentPageIndex]
                        ?.chapterIndex ?? 0
                    ]?.title
                  }
</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowBookmarks(true)} className="text-muted-foreground">
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} className="text-muted-foreground">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowTTS(!showTTS)} className="text-muted-foreground">
                <Volume2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-muted-foreground">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-0.5 bg-border">
            <div
              className="h-full gradient-primary transition-all duration-500"
              style={{
                width: `${(
                  (currentPageIndex + 1) /
                  layout.pages.length
                ) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="min-h-screen pt-20 pb-32 px-4"
        onClick={handleReaderClick}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: `${settings.contentWidth}px`,
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          {settings.readingMode === 'scroll' ? (
            // Scroll mode: show all chapters
            <div>
              {book.chapters.map((chapter, i) => (
                <div key={chapter.id} className="mb-16" id={`chapter-${chapter.id}`}>
                  <h2 className="text-2xl font-bold font-display text-foreground mb-8 text-center opacity-70">
                    {chapter.title}
                  </h2>
                  {chapter.content.split('\n\n').map((para, j) => (
                    <p
                      key={j}
                      className={`
                        text-foreground/90
                        font-reading
                        transition-colors
                        duration-500
                        rounded-md
                        text-justify
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
                        marginBottom: `${settings.paragraphSpacing}em`,
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            // Pagination mode
            <div className="flex flex-col h-[calc(100vh-140px)]">
              
            <div
              className="flex-1 overflow-hidden"
              ref={contentRef}
            >

              {generatedPages[currentPageIndex]
                ?.startsChapter && (
                <h2 className="text-2xl font-bold font-display text-foreground mb-8 text-center opacity-70">
                   {
                    generatedPages[
                      currentPageIndex
                    ]?.chapterTitle
                  }
                </h2>
              )}

              {currentLayoutPage
                ?.content
                ?.split('\n\n')
                .map((para, j) => {
                  return (
                    <p
                      key={j}
                      className={`
                        text-foreground/90
                        font-reading
                        transition-colors
                        duration-500
                        rounded-md
                        text-justify
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
                        marginBottom: `${settings.paragraphSpacing}em`,
                      }}
                    >
                      {para}
                    </p>
                  );
                })}
                </div>

              {/* Pagination controls */}
              <div 
                ref={paginationRef}
                className="flex items-center justify-between mt-12 pt-8 border-t border-border"
              >
                <Button
                  variant="ghost"
                  onClick={() =>
                    setCurrentPageIndex(
                    p =>
                      Math.max(
                        0,
                        p - 1
                      )
                    )
                   }
                  disabled={currentPageIndex === 0}
                  className="gap-2 text-muted-foreground"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPageIndex + 1} / {layout.pages.length}
                </span>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setCurrentPageIndex(
                      p =>
                        Math.min(
                          layout.pages.length - 1,
                          p + 1
                        )
                    )
                   }
                  disabled={currentPageIndex === layout.pages.length - 1}
                  className="gap-2 text-muted-foreground"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={measureRef}
        className="
          fixed
          invisible
          pointer-events-none
          -z-50
          overflow-hidden
        "
        style={{
          width: `${settings.contentWidth}px`,
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          height: `${pageHeight}px`,
          whiteSpace: 'pre-wrap',
        }}
      >
      </div>
    
      {/* Panels */}
      <ReaderSettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={setSettings}
      />
      <BookmarksDrawer
        open={showBookmarks}
        bookmarks={bookmarks}
        onDelete={
          deleteBookmark
        }
        onSelect={
          handleBookmarkSelect
        }
        onClose={() =>
          setShowBookmarks(false)
        }
      />
      <SemanticSearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onJumpTo={(chapterId) => {
          const el = document.getElementById(`chapter-${chapterId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      <TTSControlPanel visible={showTTS} onClose={() => setShowTTS(false)} />

      {
        showBookmarkButton && (
          <Button
            size="icon"
            className="
              fixed
              z-50
              shadow-lg
              animate-in
              fade-in
            "
            style={{
              left:
                bookmarkButtonPosition.x,
              top:
                bookmarkButtonPosition.y,
              transform:
                'translateX(-50%)',
            }}
            onClick={addBookmark}
          >
            <BookmarkPlus className="h-4 w-4" />
          </Button>
        )
      }
      
    </div>
  );
};

export default ReaderPage;
