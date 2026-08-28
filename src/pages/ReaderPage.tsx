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
  MoreVertical,
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

          updateBook(loadedBook.id, {
            lastReadAt: Date.now(),
          }).catch(console.error);
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

  const readingOffsetRef =
    useRef<number | null>(
      book?.lastOffset ?? null
    );
  const [pendingLastPage, setPendingLastPage] =
    useState(false);

  const hasUserInteractedRef =
    useRef(false);

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

    readingOffsetRef.current =
      book.lastOffset ?? null;

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

  const calculateReadingProgress = () => {
    if (!book || !book.chapters?.length) {
      return 0;
    }

    const currentChapter =
      book.chapters[currentChapterIndex];

    if (!currentChapter) {
      return 0;
    }

    const totalCharacters =
      book.chapters.reduce(
        (total, chapter) =>
          total + chapter.content.length,
        0
      );

    if (totalCharacters === 0) {
      return 0;
    }

    const previousCharacters =
      book.chapters
        .slice(0, currentChapterIndex)
        .reduce(
          (total, chapter) =>
            total + chapter.content.length,
          0
        );

    const currentPage =
      pages[currentPageIndex];

    const isLastPageOfLastChapter =
      currentChapterIndex ===
        book.chapters.length - 1 &&
      currentPageIndex ===
        pages.length - 1;

    const currentOffset =
      isLastPageOfLastChapter
        ? currentChapter.content.length
        : currentPage?.startOffset ?? 0;

    const readCharacters =
      previousCharacters +
      currentOffset;

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (readCharacters /
            totalCharacters) *
            100
        )
      )
    );
  };

  const goToNextPage = () => {
    if (isCalculating) return;
    if (!book) return;

    hasUserInteractedRef.current = true;

    if (currentPageIndex < pages.length - 1) {
      const nextPage =
        pages[currentPageIndex + 1];

      if (nextPage) {
        readingOffsetRef.current =
          nextPage.startOffset;
      }

      setCurrentPageIndex(
        page => page + 1
      );

      return;
    }

    if (
      currentChapterIndex <
      book.chapters.length - 1
    ) {
      readingOffsetRef.current = 0;

      setCurrentChapterIndex(
        chapter => chapter + 1
      );

      setCurrentPageIndex(0);
    }
  };

  const goToPreviousPage = () => {
    if (isCalculating) return;
    if (!book) return;

    hasUserInteractedRef.current = true;

    if (currentPageIndex > 0) {
      const previousPage =
        pages[currentPageIndex - 1];

      if (previousPage) {
        readingOffsetRef.current =
          previousPage.startOffset;
      }

      setCurrentPageIndex(
        page => page - 1
      );

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

    if (isCalculating) {
      return;
    }

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

    if (
      readingOffsetRef.current !== null
    ) {
      const targetPageIndex =
        pages.findIndex(
          page =>
            readingOffsetRef.current! >=
              page.startOffset &&
            readingOffsetRef.current! <
              page.endOffset
        );

      if (targetPageIndex >= 0) {
        setCurrentPageIndex(
          targetPageIndex
        );

        readingOffsetRef.current = null;

        return;
      }
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

    const currentPage =
      pages[currentPageIndex];

    if (!currentPage) return;

    if (!hasUserInteractedRef.current) {
      return;
    }

    const progress =
      calculateReadingProgress();

    setReadingProgress(progress);

    updateBook(book.id, {
      lastChapter:
        currentChapterIndex,

      lastPageIndex:
        currentPageIndex,

      lastOffset:
        currentPage.startOffset,

      readingProgress:
        progress,
    }).catch(console.error);
  }, [
    book,
    currentChapterIndex,
    currentPageIndex,
    pages,
    isCalculating,
    calculatedChapterIndex,
  ]);

  useEffect(() => {
    localStorage.setItem(
      'reader-settings',
      JSON.stringify(settings)
    );
  }, [settings]);

  const handleSettingsChange = (
    nextSettings: ReaderSettings
  ) => {
    const currentPage =
      pages[currentPageIndex];

    if (currentPage) {
      readingOffsetRef.current =
        currentPage.startOffset;
    }

    setSettings(nextSettings);
  };

  

  // =========================================================
  // PANELS
  // =========================================================
  const [showSettings, setShowSettings] =
    useState(false);

  const [readingProgress, setReadingProgress] =
    useState(
      book?.readingProgress ?? 0
    );

  const [showSearch, setShowSearch] =
    useState(false);

  const [showTTS, setShowTTS] =
    useState(false);

  const [showBookmarks, setShowBookmarks] =
    useState(false);

  const [showMoreMenu, setShowMoreMenu] =
    useState(false);

  const [visibleActions, setVisibleActions] =
    useState<string[]>([
      'bookmarks',
      'search',
      'tts',
      'settings',
    ]);

  const toolbarRef =
    useRef<HTMLDivElement | null>(null);

  const actionRefs =
    useRef<Record<string, HTMLButtonElement | null>>(
      {}
    );

  const moreButtonRef =
    useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const calculateVisibleActions = () => {
      const toolbar = toolbarRef.current;

      if (!toolbar) return;

      const availableWidth =
        toolbar.clientWidth;

      const leftSide =
        toolbar.querySelector(
          '[data-toolbar-left]'
        ) as HTMLElement | null;

      if (!leftSide) return;

      const actionOrder = [
        'bookmarks',
        'search',
        'tts',
        'settings',
      ];

      const actionWidths =
        actionOrder.map(action => {
          const element =
            actionRefs.current[action];

          return {
            action,
            width:
              element?.getBoundingClientRect()
                .width ?? 40,
          };
        });

      const moreWidth = 40;

      const toolbarPadding = 32;
      const leftReservedWidth = 260;
      const gap = 4;

      const availableForActions =
        Math.max(
          0,
          availableWidth -
            toolbarPadding -
            leftReservedWidth
        );

      const visible: string[] = [];

      let usedWidth = 0;

      for (const item of actionWidths) {
        const requiredWidth =
          item.width +
          (visible.length > 0 ? gap : 0);

        if (
          usedWidth +
            requiredWidth <=
          availableForActions
        ) {
          visible.push(item.action);

          usedWidth +=
            requiredWidth;
        }
      }

      const hiddenCount =
        actionOrder.length -
        visible.length;

      if (hiddenCount > 0) {
        while (
          usedWidth +
            moreWidth +
            gap >
            availableForActions &&
          visible.length > 0
        ) {
          const removed =
            visible.pop();

          if (!removed) break;

          const removedWidth =
            actionWidths.find(
              item =>
                item.action === removed
            )?.width ?? 40;

          usedWidth -=
            removedWidth +
            (visible.length > 0
              ? gap
              : 0);
        }
      }

      setVisibleActions(
        visible
      );
    };

    calculateVisibleActions();

    const observer =
      new ResizeObserver(
        calculateVisibleActions
      );

    if (toolbarRef.current) {
      observer.observe(
        toolbarRef.current
      );
    }

    window.addEventListener(
      'resize',
      calculateVisibleActions
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        'resize',
        calculateVisibleActions
      );
    };
  }, [
    book?.title,
    currentChapterIndex,
  ]);

    useEffect(() => {
      if (!showMoreMenu) {
        return;
      }

      const handleOutsideInteraction = (
        event: MouseEvent | TouchEvent
      ) => {
        const target =
          event.target as Node;

        const menu =
          document.querySelector(
            '[data-more-menu]'
          );

        const button =
          document.querySelector(
            '[data-more-button]'
          );

        if (
          menu?.contains(target) ||
          button?.contains(target)
        ) {
          return;
        }

        setShowMoreMenu(false);
      };

      document.addEventListener(
        'mousedown',
        handleOutsideInteraction
      );

      document.addEventListener(
        'touchstart',
        handleOutsideInteraction
      );

      return () => {
        document.removeEventListener(
          'mousedown',
          handleOutsideInteraction
        );

        document.removeEventListener(
          'touchstart',
          handleOutsideInteraction
        );
      };
    }, [showMoreMenu]);

  const [showChapters, setShowChapters] =
    useState(false);

  const handleChapterSelect = (
    chapterIndex: number
  ) => {
    if (!book) return;

    if (
      chapterIndex ===
      currentChapterIndex
    ) {
      setShowChapters(false);
      return;
    }

    readingOffsetRef.current = 0;
    setPendingLastPage(false);
    setPendingBookmark(null);
    setActiveBookmark(null);
    setBookmarkHighlightVisible(false);

    setCurrentChapterIndex(
      chapterIndex
    );

    setCurrentPageIndex(0);

    setShowChapters(false);
  };

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
        <div className="relative bg-card/90 backdrop-blur-xl border-b border-border">
          <div
            ref={toolbarRef}
            className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between"
          >
            <div
              className="absolute invisible pointer-events-none"
              aria-hidden="true"
            >
              <Button
                ref={element =>
                  (actionRefs.current.bookmarks =
                    element)
                }
                variant="ghost"
                size="icon"
              >
                <Bookmark className="w-5 h-5" />
              </Button>

              <Button
                ref={element =>
                  (actionRefs.current.search =
                    element)
                }
                variant="ghost"
                size="icon"
              >
                <Search className="w-5 h-5" />
              </Button>

              <Button
                ref={element =>
                  (actionRefs.current.tts =
                    element)
                }
                variant="ghost"
                size="icon"
              >
                <Volume2 className="w-5 h-5" />
              </Button>

              <Button
                ref={element =>
                  (actionRefs.current.settings =
                    element)
                }
                variant="ghost"
                size="icon"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>

            {/* LEFT */}
            <div
              data-toolbar-left
              className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden"
            >
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

              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate w-full">
                  {book.title}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setShowChapters(true)
                  }
                  className="block w-full text-xs text-muted-foreground hover:text-foreground transition-colors truncate text-left"
                >
                  {book?.chapters?.[currentChapterIndex]?.title ?? 'Reader'}
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div
              className="flex items-center gap-1 shrink-0"
            >
              {/* BOOKMARKS */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowBookmarks(true)
                }
                className={
                  visibleActions.includes(
                    'bookmarks'
                  )
                    ? 'text-muted-foreground'
                    : 'hidden'
                }
              >
                <Bookmark className="w-5 h-5" />
              </Button>

              {/* SEARCH */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowSearch(true)
                }
                className={
                  visibleActions.includes(
                    'search'
                  )
                    ? 'text-muted-foreground'
                    : 'hidden'
                }
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* TTS */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowTTS(true)
                }
                className={
                  visibleActions.includes(
                    'tts'
                  )
                    ? 'text-muted-foreground'
                    : 'hidden'
                }
              >
                <Volume2 className="w-5 h-5" />
              </Button>

              {/* SETTINGS */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowSettings(true)
                }
                className={
                  visibleActions.includes(
                    'settings'
                  )
                    ? 'text-muted-foreground'
                    : 'hidden'
                }
              >
                <Settings className="w-5 h-5" />
              </Button>

              {/* MORE */}
              {visibleActions.length < 4 && (
                <div className="relative">
                  <Button
                    data-more-button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setShowMoreMenu(
                        value => !value
                      )
                    }
                    className="text-muted-foreground"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>

                  {showMoreMenu && (
                    <>
                      <div
                        data-more-menu
                        className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-border bg-card shadow-xl p-1 z-50"
                      >
                        {!visibleActions.includes(
                          'bookmarks'
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              setShowBookmarks(true);
                            }}
                            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                          >
                            <Bookmark className="w-4 h-4" />
                            Bookmarks
                          </button>
                        )}

                        {!visibleActions.includes(
                          'search'
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              setShowSearch(true);
                            }}
                            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                          >
                            <Search className="w-4 h-4" />
                            Search
                          </button>
                        )}

                        {!visibleActions.includes(
                          'tts'
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              setShowTTS(true);
                            }}
                            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                          >
                            <Volume2 className="w-4 h-4" />
                            Read aloud
                          </button>
                        )}

                        {!visibleActions.includes(
                          'settings'
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowMoreMenu(false);
                              setShowSettings(true);
                            }}
                            className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                          >
                            <Settings className="w-4 h-4" />
                            Reader Settings
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent">
              <div
                className="h-full bg-primary transition-[width] duration-300 ease-out"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      readingProgress
                    )
                  )}%`,
                }}
              />
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

      {showChapters && (
        <>
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={() =>
              setShowChapters(false)
            }
          />

          <div className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-card border-r border-border z-50 overflow-y-auto animate-slide-in-left">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold font-display text-foreground">
                  Chapters
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowChapters(false)
                  }
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>

              <div className="space-y-2">
                {book.chapters?.map(
                  (chapter, index) => (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() =>
                        handleChapterSelect(index)
                      }
                      className={`w-full text-left rounded-lg px-4 py-3 transition-colors ${
                        index ===
                        currentChapterIndex
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      {chapter.title}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <ReaderSettingsDrawer
        open={showSettings}
        onClose={() =>
          setShowSettings(false)
        }
        settings={settings}
        onChange={handleSettingsChange}
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