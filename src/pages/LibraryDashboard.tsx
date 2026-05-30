import React, {
  useState,
  useMemo,
  useEffect,
} from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/lib/auth-context';

import { Book } from '@/lib/types';

import { uploadBook } from '@/services/upload-book';

import { getBooks } from '@/services/get-books';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import {
  BookOpen,
  Search,
  Upload,
  Settings,
  LogOut,
  Clock,
  TrendingUp,
} from 'lucide-react';

const BookCard: React.FC<{
  book: Book;

  onClick: () => void;

  index: number;
}> = ({
  book,
  onClick,
  index,
}) => {
  const colors = [
    'from-purple-900/80 to-indigo-900/80',

    'from-rose-900/80 to-purple-900/80',

    'from-blue-900/80 to-cyan-900/80',

    'from-amber-900/80 to-orange-900/80',

    'from-emerald-900/80 to-teal-900/80',

    'from-slate-800/80 to-zinc-900/80',
  ];

  return (
    <button
      onClick={onClick}
      className="group text-left animate-fade-in-up"
      style={{
        animationDelay:
          `${index * 0.05}s`,
      }}
    >
      <div className="relative overflow-hidden rounded-xl aspect-[2/3] mb-3">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            colors[
              index %
                colors.length
            ]
          }`}
        />

        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <p className="text-xs uppercase tracking-widest text-foreground/50 mb-1">
            {
              book.format
            }
          </p>

          <h3 className="text-lg font-bold font-display text-foreground leading-tight">
            {book.title}
          </h3>
        </div>

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        {book.readingProgress >
          0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/10">
            <div
              className="h-full gradient-primary transition-all"
              style={{
                width: `${book.readingProgress}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground truncate">
          {book.title}
        </span>

        {book.processingStatus ===
        'processing' ? (
          <span className="text-xs text-yellow-500">
            Processing...
          </span>
        ) : (
          <span className="text-xs text-green-500">
            Ready
          </span>
        )}
      </div>
    </button>
  );
};

const LibraryDashboard: React.FC =
  () => {
    const {
      user,
      logout,
    } = useAuth();

    const navigate =
      useNavigate();

    const [
      searchQuery,
      setSearchQuery,
    ] = useState('');

    const [
      showUserMenu,
      setShowUserMenu,
    ] = useState(false);

    const [books, setBooks] =
      useState<Book[]>([]);

    const [
      loadingBooks,
      setLoadingBooks,
    ] = useState(true);

    useEffect(() => {
      const loadBooks =
        async () => {
          if (!user)
            return;

          try {
            const data =
              await getBooks(
                user.id
              );

            setBooks(
              data as Book[]
            );
          } catch (error) {
            console.error(
              error
            );
          } finally {
            setLoadingBooks(
              false
            );
          }
        };

      loadBooks();
    }, [user]);

    const filteredBooks =
      useMemo(
        () =>
          books.filter(
            (b) =>
              b.title
                .toLowerCase()
                .includes(
                  searchQuery.toLowerCase()
                )
          ),
        [books, searchQuery]
      );

    const continueReading =
      useMemo(
        () =>
          books.filter(
            (b) =>
              b.readingProgress >
                0 &&
              b.readingProgress <
                100
          ),
        [books]
      );

    const recentlyAdded =
      useMemo(
        () =>
          books.filter(
            (b) =>
              b.readingProgress ===
              0
          ),
        [books]
      );

    if (loadingBooks) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          Loading library...
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>

              <span className="text-xl font-bold font-display text-foreground">
                Auralex
              </span>
            </div>

            <div className="flex-1 max-w-md mx-8 hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <Input
                  value={
                    searchQuery
                  }
                  onChange={(
                    e
                  ) =>
                    setSearchQuery(
                      e.target
                        .value
                    )
                  }
                  placeholder="Search your library..."
                  className="pl-10 h-10 bg-secondary border-border"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label>
                <input
                  type="file"
                  accept=".epub,.fb2,.txt"
                  hidden
                  onChange={async (
                    e
                  ) => {
                    const file =
                      e
                        .target
                        .files?.[0];

                    if (
                      !file ||
                      !user
                    )
                      return;

                    try {
                      await uploadBook(
                        file,
                        user.id
                      );

                      const updatedBooks =
                        await getBooks(
                          user.id
                        );

                      setBooks(
                        updatedBooks as Book[]
                      );

                      alert(
                        'Book uploaded successfully!'
                      );
                    } catch (
                      error
                    ) {
                      console.error(
                        error
                      );

                      alert(
                        'Upload failed'
                      );
                    }
                  }}
                />

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />

                    <span className="hidden sm:inline">
                      Upload
                    </span>
                  </span>
                </Button>
              </label>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <Settings className="w-5 h-5" />
              </Button>

              <div className="relative">
                <button
                  onClick={() =>
                    setShowUserMenu(
                      !showUserMenu
                    )
                  }
                  className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                >
                  {user?.name?.[0]?.toUpperCase() ||
                    'U'}
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() =>
                        setShowUserMenu(
                          false
                        )
                      }
                    />

                    <div className="absolute right-0 top-12 z-50 w-56 rounded-xl bg-card border border-border shadow-xl p-2 animate-fade-in">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {
                            user?.name
                          }
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {
                            user?.email
                          }
                        </p>
                      </div>

                      <button
                        onClick={
                          logout
                        }
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-secondary rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4" />

                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {continueReading.length >
            0 &&
            !searchQuery && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-primary" />

                  <h2 className="text-xl font-bold font-display text-foreground">
                    Continue Reading
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {continueReading.map(
                    (
                      book,
                      i
                    ) => (
                      <BookCard
                        key={
                          book.id
                        }
                        book={
                          book
                        }
                        index={
                          i
                        }
                        onClick={() =>
                          navigate(
                            `/read/${book.id}`
                          )
                        }
                      />
                    )
                  )}
                </div>
              </section>
            )}

          <section>
            <h2 className="text-xl font-bold font-display text-foreground mb-6">
              Your Library
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {(searchQuery
                ? filteredBooks
                : books
              ).map(
                (
                  book,
                  i
                ) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    index={i}
                    onClick={() =>
                      navigate(
                        `/read/${book.id}`
                      )
                    }
                  />
                )
              )}
            </div>

            {books.length ===
              0 && (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />

                <p>
                  No books yet.
                  Upload your first
                  book.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  };

export default LibraryDashboard;