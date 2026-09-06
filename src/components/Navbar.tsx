import React from 'react';
import { ViewMode, UserProfile } from '../types';
import {
  Menu,
  Sun,
  Moon,
  Shield,
  Sparkles,
  Columns,
  MessageSquare,
  Network,
  CloudCheck
} from 'lucide-react';

interface NavbarProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenMobileSidebar: () => void;
  user: UserProfile | null;
  onSignIn: () => void;
  syncStatus: 'synced' | 'saving' | 'offline';
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onSetViewMode,
  isDark,
  onToggleTheme,
  onOpenMobileSidebar,
  user,
  onSignIn,
  syncStatus
}) => {
  return (
    <header className="h-14 border-b border-stone-200 dark:border-stone-800/80 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 md:hidden"
          title="Open journal history"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm sm:text-base tracking-tight text-stone-900 dark:text-stone-100">
            Personal Gemini Journal
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>Zero-Trust</span>
          </span>
        </div>
      </div>

      {/* Center View Controls */}
      <div className="hidden lg:flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800/80 text-xs">
        <button
          onClick={() => onSetViewMode('chat')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
            viewMode === 'chat'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Dialogue</span>
        </button>

        <button
          onClick={() => onSetViewMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
            viewMode === 'split'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split Workspace</span>
        </button>

        <button
          onClick={() => onSetViewMode('cognitive')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
            viewMode === 'cognitive'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>MindMap & Insights</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Firestore sync status pill */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-stone-400 font-medium px-2 py-1">
          <span
            className={`w-2 h-2 rounded-full ${
              syncStatus === 'synced'
                ? 'bg-emerald-500'
                : syncStatus === 'saving'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-stone-400'
            }`}
          />
          <span className="capitalize">{syncStatus}</span>
        </div>

        {/* Dark/Light mode toggle */}
        <button
          id="btn-toggle-theme"
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
        </button>

        {/* User profile / Login button */}
        {!user && (
          <button
            onClick={onSignIn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
