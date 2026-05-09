import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { mockBooks } from '@/lib/mock-data';
import { Book } from '@/lib/types';
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

const BookCard: React.FC<{ book: Book; onClick: () => void; index: number }> = ({ book, onClick, index }) => {
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
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative overflow-hidden rounded-xl aspect-[2/3] mb-3">
        <div className={`absolute inset-0 bg-gradient-to-br ${colors[index % colors.length]}`} />
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <p className="text-xs uppercase tracking-widest text-foreground/50 mb-1">{book.genre}</p>
          <h3 className="text-lg font-bold font-display text-foreground leading-tight">{book.title}</h3>
          <p className="text-sm text-foreground/70 mt-1 font-reading italic">{book.author}</p>
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        {/* Progress bar */}
        {book.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/10">
            <div
              className="h-full gradient-primary transition-all"
              style={{ width: `${book.progress}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground truncate">{book.title}</span>
        {book.progress > 0 && (
          <span className="text-xs text-primary font-medium">{book.progress}%</span>
        )}
      </div>
    </button>
  );
};

const LibraryDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const filteredBooks = useMemo(
    () =>
      mockBooks.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const continueReading = useMemo(
    () => mockBooks.filter(b => b.progress > 0 && b.progress < 100).sort((a, b) => {
      if (!a.lastRead || !b.lastRead) return 0;
      return b.lastRead.getTime() - a.lastRead.getTime();
    }),
    []
  );

  const recentlyAdded = useMemo(
    () => mockBooks.filter(b => b.progress === 0),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">Auralex</span>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search your library..."
                className="pl-10 h-10 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-xl bg-card border border-border shadow-xl p-2 animate-fade-in">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-sm font-medium text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <button
                      onClick={logout}
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

      {/* Mobile search */}
      <div className="sm:hidden px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search your library..."
            className="pl-10 h-10 bg-secondary border-border"
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Continue Reading */}
        {continueReading.length > 0 && !searchQuery && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">Continue Reading</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {continueReading.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} onClick={() => navigate(`/read/${book.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Added */}
        {recentlyAdded.length > 0 && !searchQuery && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold font-display text-foreground">Recently Added</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {recentlyAdded.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} onClick={() => navigate(`/read/${book.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* All Books / Search Results */}
        {searchQuery && (
          <section>
            <h2 className="text-xl font-bold font-display text-foreground mb-6">
              {filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''} for "{searchQuery}"
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredBooks.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} onClick={() => navigate(`/read/${book.id}`)} />
              ))}
            </div>
            {filteredBooks.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No books found matching your search.</p>
              </div>
            )}
          </section>
        )}

        {/* All books when no search */}
        {!searchQuery && (
          <section>
            <h2 className="text-xl font-bold font-display text-foreground mb-6">All Books</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {mockBooks.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} onClick={() => navigate(`/read/${book.id}`)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default LibraryDashboard;
