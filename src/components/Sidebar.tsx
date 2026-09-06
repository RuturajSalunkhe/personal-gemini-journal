import React, { useState, useMemo } from 'react';
import { JournalEntry, UserProfile } from '../types';
import {
  Plus,
  Search,
  BookOpen,
  Star,
  Trash2,
  Tag,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Filter,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';

interface SidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
  user: UserProfile | null;
  onSignOut: () => void;
  onSignIn: () => void;
  selectedTagFilter: string | null;
  onClearTagFilter: () => void;
  onSelectTagFilter: (tag: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  user,
  onSignOut,
  onSignIn,
  selectedTagFilter,
  onClearTagFilter,
  onSelectTagFilter,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Extract all unique topic tags across entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      if (entry.cognitivePulse?.topicTags) {
        entry.cognitivePulse.topicTags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [entries]);

  // Filter entries based on search, favorites, and selected tag
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (onlyFavorites && !entry.isFavorite) return false;
      if (selectedTagFilter && !entry.cognitivePulse?.topicTags?.includes(selectedTagFilter)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesMessages = entry.messages.some((m) => m.content.toLowerCase().includes(q));
        const matchesTags = entry.cognitivePulse?.topicTags?.some((t) => t.toLowerCase().includes(q));
        const matchesSummary = entry.cognitivePulse?.summary?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessages && !matchesTags && !matchesSummary) return false;
      }
      return true;
    });
  }, [entries, onlyFavorites, selectedTagFilter, searchQuery]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 7 * 86400000;

    const groups: { [key: string]: JournalEntry[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    filteredEntries.forEach((entry) => {
      const time = entry.updatedAt || entry.createdAt;
      if (time >= today) {
        groups['Today'].push(entry);
      } else if (time >= yesterday) {
        groups['Yesterday'].push(entry);
      } else if (time >= sevenDaysAgo) {
        groups['Previous 7 Days'].push(entry);
      } else {
        groups['Older'].push(entry);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredEntries]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        id="sidebar-container"
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 flex flex-col bg-stone-100/90 dark:bg-stone-900/90 border-r border-stone-200 dark:border-stone-800/80 backdrop-blur-md transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & New Entry */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center font-bold text-sm shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  Gemini Journal
                </h1>
                <span className="text-[10px] font-mono text-stone-500">
                  Zero-Trust Isolated
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-new-journal-entry"
            onClick={() => {
              onNewEntry();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white text-stone-100 text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800/60 space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts, tags, insights..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950/70 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                onlyFavorites
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Star className={`w-3 h-3 ${onlyFavorites ? 'fill-amber-400' : ''}`} />
              <span>Favorites</span>
            </button>

            {selectedTagFilter && (
              <button
                onClick={onClearTagFilter}
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-rose-500 transition-colors"
              >
                <span>#{selectedTagFilter}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {groupedEntries.length === 0 ? (
            <div className="p-6 text-center text-stone-400 space-y-2">
              <Sparkles className="w-5 h-5 mx-auto opacity-40" />
              <p className="text-xs">No entries match your search.</p>
            </div>
          ) : (
            groupedEntries.map(([groupName, groupList]) => (
              <div key={groupName} className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 px-2">
                  {groupName}
                </span>

                <div className="space-y-1">
                  {groupList.map((entry) => {
                    const isSelected = entry.id === selectedEntryId;
                    const mood = entry.cognitivePulse?.mood;

                    return (
                      <div
                        key={entry.id}
                        id={`sidebar-entry-${entry.id}`}
                        onClick={() => {
                          onSelectEntry(entry);
                          onCloseMobile();
                        }}
                        className={`group relative p-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-stone-800/90 shadow-xs border border-stone-200/80 dark:border-stone-700/80 text-stone-900 dark:text-stone-100'
                            : 'hover:bg-stone-200/60 dark:hover:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {mood?.emoji ? (
                              <span className="text-sm shrink-0" title={mood.label}>
                                {mood.emoji}
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-700 shrink-0" />
                            )}
                            <h4 className="text-xs font-semibold truncate">
                              {entry.title}
                            </h4>
                          </div>

                          {entry.isFavorite && (
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                        </div>

                        {/* Snippet / tags */}
                        <div className="mt-1 flex items-center justify-between text-[10px] text-stone-400">
                          <span className="truncate max-w-[140px]">
                            {entry.cognitivePulse?.summary
                              ? entry.cognitivePulse.summary
                              : entry.messages.length > 0
                              ? `${entry.messages.length} messages`
                              : 'Empty draft'}
                          </span>

                          <span className="font-mono">
                            {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* User Profile & Security Tenant Card */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800/80 bg-white/50 dark:bg-stone-950/40 space-y-2">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border border-stone-300 dark:border-stone-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-stone-800 text-stone-100 flex items-center justify-center text-xs font-bold">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {user.displayName || (user.isAnonymous ? 'Guest Journaler' : 'Authenticated User')}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">
                      {user.email || 'Isolated Session'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Strict Multi-Tenancy Indicator */}
              <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-[10px]">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span className="truncate font-mono">
                  Tenant: users/{user.uid.slice(0, 8)}...
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={onSignIn}
                className="w-full py-2 px-3 rounded-xl bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <span>Sign in with Google</span>
              </button>
              <p className="text-[10px] text-stone-400 text-center leading-tight">
                Authenticates with Firebase to isolate your journal partition.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
