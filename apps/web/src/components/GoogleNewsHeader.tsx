'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Search,
  Bookmark,
  Sun,
  Moon,
  Menu,
  X,
  Star,
  Sparkles,
  BookmarkCheck,
  PenTool,
  Radio,
} from 'lucide-react';
import { useBookmarks } from '../lib/news-store';
import { SearchModal } from './SearchModal';
import { BookmarksDrawer } from './BookmarksDrawer';
import { AuthModal, type UserSession } from './AuthModal';

const CATEGORIES = [
  { id: 'top', name: 'Top Stories', href: '/', icon: Star },
  { id: 'for-you', name: 'For You', href: '/?tab=for-you', icon: Sparkles },
  { id: 'following', name: 'Following', href: '/?tab=following', icon: BookmarkCheck },
  { id: 'india', name: 'India', href: '/category/india' },
  { id: 'world', name: 'World', href: '/category/world' },
  { id: 'business', name: 'Business', href: '/category/business' },
  { id: 'technology', name: 'Technology', href: '/category/technology' },
  { id: 'science', name: 'Science', href: '/category/science' },
  { id: 'health', name: 'Health', href: '/category/health' },
  { id: 'sports', name: 'Sports', href: '/category/sports' },
];

function CategoryNavStrip({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'top';

  return (
    <nav className="border-t border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 h-11 text-xs sm:text-sm font-medium whitespace-nowrap">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isHome = pathname === '/';
          let isActive = false;
          if (isHome) {
            if (cat.id === 'top') isActive = currentTab === 'top';
            else if (cat.id === 'for-you') isActive = currentTab === 'for-you';
            else if (cat.id === 'following') isActive = currentTab === 'following';
            else isActive = false;
          } else {
            isActive = pathname === cat.href;
          }

          return (
            <Link
              key={cat.name}
              href={cat.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const GoogleNewsHeader: React.FC = () => {
  const pathname = usePathname();
  const bookmarks = useBookmarks();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('globalpulse_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    } catch {
      // Ignore
    }
  }, []);

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('globalpulse_user', JSON.stringify(user));
    } catch {
      // Ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('globalpulse_user');
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('globalpulse_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('globalpulse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('globalpulse_theme', 'light');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        {/* Main Brand Top Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu & GlobalPulse Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 md:hidden"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Dynamic Pulse Brand Emblem */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/25">
                <Radio className="w-5 h-5 text-white" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    Global<span className="text-blue-600 dark:text-blue-400">Pulse</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                  Independent News & Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Modern Rounded Pill Search Bar */}
          <div className="flex-1 max-w-2xl hidden sm:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full h-11 px-4 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-800/80 rounded-full flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm transition shadow-inner group"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
              <span className="flex-1 text-left truncate">
                Search topics, locations & verified sources
              </span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-500 dark:text-slate-300">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Icons: Search (mobile), Bookmarks, Dark Mode, CMS */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 sm:hidden"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Saved Bookmarks */}
            <button
              onClick={() => setIsBookmarksOpen(true)}
              className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Saved stories"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarks.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {bookmarks.length}
                </span>
              )}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Journalist Newsroom CMS Button - RBAC protected */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'editor' || !currentUser) && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-xs font-bold transition"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Editorial Studio</span>
              </Link>
            )}

            {/* User Profile Avatar / Sign In Trigger */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
              title={currentUser ? `${currentUser.name} (${currentUser.role})` : 'Sign in to GlobalPulse'}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'GP'}
              </div>
              {currentUser && (
                <span
                  className={`hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                    currentUser.role === 'admin'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : currentUser.role === 'editor'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {currentUser.role}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-1">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {Icon && <Icon className="w-4 h-4 text-blue-600" />}
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Nav Strip wrapped in Suspense */}
        <Suspense fallback={<div className="h-11 border-t border-slate-200 dark:border-slate-800" />}>
          <CategoryNavStrip pathname={pathname} />
        </Suspense>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Saved Bookmarks Drawer */}
      <BookmarksDrawer isOpen={isBookmarksOpen} onClose={() => setIsBookmarksOpen(false)} />

      {/* Auth & RBAC Modal (F1, F2) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </>
  );
};
