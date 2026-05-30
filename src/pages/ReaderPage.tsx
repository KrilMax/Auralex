import { updateBook } from '@/lib/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReaderSettings, Book } from '@/lib/types';
import ReaderSettingsDrawer from '@/components/ReaderSettingsDrawer';
import SemanticSearchModal from '@/components/SemanticSearchModal';
import TTSControlPanel from '@/components/TTSControlPanel';
import { Button } from '@/components/ui/button';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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

        if (
          loadedBook.readingProgress &&
          loadedBook.chapters
        ) {
          const page =
            Math.floor(
              (loadedBook.readingProgress / 100) *
              loadedBook.chapters.length
            );

          setCurrentPage(
            Math.min(
              page,
              loadedBook.chapters.length - 1
            )
          );
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  loadBook();
}, [id]);

  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTTS, setShowTTS] = useState(false);
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

  const progress = Math.round(
    ((currentPage + 1) /
      book.chapters.length) *
      100
  );

  updateBook(book.id, {
    readingProgress: progress,
    lastChapter: currentPage,
  }).catch(console.error);

}, [currentPage]);

  useEffect(() => {
  if (settings.readingMode !== 'scroll')
    return;

  const handleScrollProgress = () => {
    const scrollTop =
      window.scrollY;

    const documentHeight =
      document.documentElement
        .scrollHeight -
      window.innerHeight;

    if (documentHeight <= 0)
      return;

    const progress =
      scrollTop /
      documentHeight;

    const chapterIndex =
      Math.min(
        book.chapters.length - 1,
        Math.floor(
          progress *
            book.chapters.length
        )
      );

    setCurrentPage(
      chapterIndex
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
                <p className="text-xs text-muted-foreground">{book.chapters[currentPage]?.title || 'Chapter 1'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
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
              style={{ width: `${((currentPage + 1) / book.chapters.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="min-h-screen pt-20 pb-32 px-4"
        onClick={e => e.stopPropagation()}
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
                      className="text-foreground/90 font-reading"
                      style={{ marginBottom: `${settings.paragraphSpacing}em` }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            // Pagination mode
            <div>
              <h2 className="text-2xl font-bold font-display text-foreground mb-8 text-center opacity-70">
                {book.chapters[currentPage]?.title}
              </h2>
              {book.chapters[currentPage]?.content.split('\n\n').map((para, j) => (
                <p
                  key={j}
                  className="text-foreground/90 font-reading"
                  style={{ marginBottom: `${settings.paragraphSpacing}em` }}
                >
                  {para}
                </p>
              ))}
              {/* Pagination controls */}
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="gap-2 text-muted-foreground"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} / {book.chapters.length}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage(p => Math.min(book.chapters.length - 1, p + 1))}
                  disabled={currentPage === book.chapters.length - 1}
                  className="gap-2 text-muted-foreground"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panels */}
      <ReaderSettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={setSettings}
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
    </div>
  );
};

export default ReaderPage;
