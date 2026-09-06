import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  JournalEntry,
  JournalMessage,
  UserProfile,
  ViewMode,
  CognitivePulse
} from './types';
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  loginAsGuest,
  logoutUser
} from './lib/firebase';
import {
  subscribeToEntries,
  saveEntry,
  updateEntryFields,
  deleteEntry,
  toggleActionItem as toggleActionItemService
} from './lib/firestoreService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { CognitivePulsePanel } from './components/CognitivePulsePanel';
import { AuthModal } from './components/AuthModal';
import { MindMapVisualizer } from './components/MindMapVisualizer';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isAnalyzingPulse, setIsAnalyzingPulse] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isPulsePanelOpen, setIsPulsePanelOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pulseAnalysisError, setPulseAnalysisError] = useState<string | null>(null);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('journal_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync dark class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('journal_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('journal_theme', 'light');
    }
  }, [isDark]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous
        });
      } else {
        // Auto-provision guest session if user is not logged in yet,
        // ensuring seamless instant access without a blocking wall.
        try {
          const guest = await loginAsGuest();
          setUser({
            uid: guest.uid,
            email: null,
            displayName: 'Guest Journaler',
            photoURL: null,
            isAnonymous: true
          });
        } catch (err) {
          console.warn('Could not auto-login as guest:', err);
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Firestore real-time listener for current user's entries
  useEffect(() => {
    if (!user?.uid) {
      setEntries([]);
      return;
    }

    setSyncStatus('saving');
    const unsubscribe = subscribeToEntries(
      user.uid,
      (loadedEntries) => {
        setEntries(loadedEntries);
        setSyncStatus('synced');

        // If no entry is currently selected, select the latest or create one
        if (loadedEntries.length > 0) {
          setSelectedEntryId((prev) => {
            if (prev && loadedEntries.some((e) => e.id === prev)) {
              return prev;
            }
            return loadedEntries[0].id;
          });
        } else {
          // Initialize with a welcome reflection entry
          createInitialEntry(user.uid);
        }
      },
      (error) => {
        console.warn('Firestore subscription status:', error.message);
        setSyncStatus('offline');
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Creates an initial sample or welcome entry
  const createInitialEntry = async (uid: string) => {
    const entryId = `entry_${Date.now()}`;
    const initialEntry: JournalEntry = {
      id: entryId,
      userId: uid,
      title: 'Welcome & Intentions',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `msg_init_1`,
          role: 'model',
          content: `Welcome to your **Personal Gemini Journal**.

This is your zero-trust cognitive sanctuary. Every thought, brainstorm, and reflection here is strictly isolated in Cloud Firestore under your authenticated partition.

**How this thought partner works:**
- **Brainstorm & Dialogue:** Share what is on your mind—challenges, ideas, or daily reviews.
- **Cognitive Pulse (Phase 3):** Gemini automatically extracts your emotional tone, actionable checklist, topic tags, and a concept MindMap.
- **Offline Resilient:** Changes sync continuously to Firestore.

What would you like to reflect on or deconstruct today?`,
          timestamp: Date.now()
        }
      ],
      cognitivePulse: {
        mood: {
          label: 'Focused & Curious',
          emoji: '✨',
          sentiment: 'positive',
          energy: 'medium'
        },
        summary: 'Initiating a thoughtful, secure journaling space to reflect, deconstruct ideas, and organize priorities.',
        topicTags: ['mindfulness', 'clarity', 'intentions', 'journaling'],
        actionItems: [
          {
            id: 'act_1',
            text: 'Explore a guided prompt starter or write a freeform thought',
            completed: false,
            priority: 'high'
          },
          {
            id: 'act_2',
            text: 'Inspect the auto-generated Concept MindMap in the panel',
            completed: false,
            priority: 'medium'
          }
        ],
        mindMap: {
          centralConcept: 'Personal Clarity & Focus',
          branches: [
            {
              title: 'Brainstorming',
              subIdeas: ['Deconstruct complex challenges', 'Brainstorm without premature judgment', 'Unpack second-order consequences'],
              color: '#6366f1'
            },
            {
              title: 'Cognitive Pulse',
              subIdeas: ['Emotional mood tracking', 'Real-time action checklists', 'Semantic tag clusters'],
              color: '#10b981'
            },
            {
              title: 'Zero-Trust Storage',
              subIdeas: ['Isolated users/{uid}/entries collection', 'Firestore security rules verification', 'Server-side key security'],
              color: '#f59e0b'
            }
          ]
        },
        analyzedAt: Date.now()
      }
    };

    try {
      await saveEntry(uid, initialEntry);
      setSelectedEntryId(entryId);
    } catch (err) {
      console.warn('Initial entry creation notice:', err);
    }
  };

  // Active selected entry
  const activeEntry = useMemo(() => {
    return entries.find((e) => e.id === selectedEntryId) || null;
  }, [entries, selectedEntryId]);

  // Create a new entry
  const handleNewEntry = async () => {
    if (!user?.uid) {
      setIsAuthModalOpen(true);
      return;
    }
    const newId = `entry_${Date.now()}`;
    const newEntry: JournalEntry = {
      id: newId,
      userId: user.uid,
      title: 'New Reflection',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };

    setSyncStatus('saving');
    try {
      await saveEntry(user.uid, newEntry);
      setSelectedEntryId(newId);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error('Failed to create new entry:', err);
      setSyncStatus('offline');
      if (err?.message?.includes('permission') || err?.message?.includes('PERMISSION_DENIED')) {
        setIsAuthModalOpen(true);
      }
    }
  };

  // Delete current or specific entry
  const handleDeleteEntry = async (entryId?: string) => {
    const idToDelete = entryId || selectedEntryId;
    if (!user?.uid || !idToDelete) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this journal entry?');
    if (!confirmDelete) return;

    setSyncStatus('saving');
    try {
      await deleteEntry(user.uid, idToDelete);
      setSyncStatus('synced');
      if (selectedEntryId === idToDelete) {
        const remaining = entries.filter((e) => e.id !== idToDelete);
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete entry:', err);
      setSyncStatus('offline');
    }
  };

  // Update entry title
  const handleUpdateTitle = async (newTitle: string) => {
    if (!user?.uid || !selectedEntryId) return;
    try {
      await updateEntryFields(user.uid, selectedEntryId, { title: newTitle });
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!user?.uid || !activeEntry) return;
    try {
      await updateEntryFields(user.uid, activeEntry.id, {
        isFavorite: !activeEntry.isFavorite
      });
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Stop streaming response
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Trigger Cognitive Pulse & MindMap extraction via Gemini
  const handleAnalyzeCognitivePulse = async (entryToAnalyze?: JournalEntry) => {
    const current = entryToAnalyze || activeEntry;
    if (!current || !user?.uid) return;

    setIsAnalyzingPulse(true);
    setPulseAnalysisError(null);
    try {
      let idToken = '';
      if (auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken();
        } catch (tErr) {
          console.warn('Could not fetch ID token for pulse:', tErr);
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: current.messages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `Analysis server returned ${res.status}`);
      }

      const pulseData: CognitivePulse = await res.json();

      // Persist pulse to Firestore
      await updateEntryFields(user.uid, current.id, {
        cognitivePulse: pulseData
      });

      // Also update title if it's default
      if (current.title === 'New Reflection' && pulseData.mindMap?.centralConcept) {
        await updateEntryFields(user.uid, current.id, {
          title: pulseData.mindMap.centralConcept
        });
      }
    } catch (error: any) {
      console.error('Cognitive pulse analysis failed:', error);
      setPulseAnalysisError(error?.message || 'Cognitive analysis is temporarily unavailable. Please try again.');
    } finally {
      setIsAnalyzingPulse(false);
    }
  };

  // Send message and stream Gemini response
  const handleSendMessage = async (text: string) => {
    if (!user?.uid || !selectedEntryId) return;

    const userMessage: JournalMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const currentMessages = activeEntry ? [...activeEntry.messages, userMessage] : [userMessage];

    // Optimistically update entry with user message
    const updatedEntry: JournalEntry = {
      ...(activeEntry || {
        id: selectedEntryId,
        userId: user.uid,
        title: 'New Reflection',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      }),
      messages: currentMessages,
      updatedAt: Date.now()
    };

    // Auto-derive title if first message
    if (updatedEntry.title === 'New Reflection' && currentMessages.length === 1) {
      const firstLine = text.split('\n')[0].slice(0, 32).trim();
      updatedEntry.title = firstLine.length > 0 ? `${firstLine}...` : 'Reflection';
    }

    setSyncStatus('saving');
    await saveEntry(user.uid, updatedEntry);

    // Prepare streaming request
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let idToken = '';
      if (auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken();
        } catch (tErr) {
          console.warn('ID token fetch note:', tErr);
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          messages: currentMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to stream chat: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setStreamingContent(accumulatedText);
              }
            } catch (pErr) {
              // Non-json chunk or partial line
            }
          }
        }
      }

      // Finish streaming and append model message
      if (accumulatedText.trim()) {
        const modelMessage: JournalMessage = {
          id: `msg_${Date.now()}_model`,
          role: 'model',
          content: accumulatedText,
          timestamp: Date.now()
        };

        const finalEntry: JournalEntry = {
          ...updatedEntry,
          messages: [...currentMessages, modelMessage],
          updatedAt: Date.now()
        };

        await saveEntry(user.uid, finalEntry);
        setSyncStatus('synced');

        // Automatically trigger cognitive pulse analysis after meaningful exchange
        handleAnalyzeCognitivePulse(finalEntry);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat stream error:', err);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  // Toggle action item
  const handleToggleActionItem = async (actionItemId: string, completed: boolean) => {
    if (!user?.uid || !activeEntry) return;
    try {
      await toggleActionItemService(user.uid, activeEntry.id, actionItemId, completed);
    } catch (err) {
      console.error('Failed to toggle action item:', err);
    }
  };

  // Add custom action item
  const handleAddActionItem = async (text: string) => {
    if (!user?.uid || !activeEntry) return;
    const currentPulse = activeEntry.cognitivePulse;
    const newItem = {
      id: `act_custom_${Date.now()}`,
      text,
      completed: false,
      priority: 'medium' as const
    };

    const updatedPulse: CognitivePulse = currentPulse
      ? {
          ...currentPulse,
          actionItems: [...(currentPulse.actionItems || []), newItem]
        }
      : {
          mood: { label: 'Thoughtful', emoji: '💡', sentiment: 'positive', energy: 'medium' },
          actionItems: [newItem],
          topicTags: ['actions'],
          summary: 'Custom commitment added to journal.',
          mindMap: { centralConcept: activeEntry.title, branches: [] },
          analyzedAt: Date.now()
        };

    try {
      await updateEntryFields(user.uid, activeEntry.id, {
        cognitivePulse: updatedPulse
      });
    } catch (err) {
      console.error('Failed to add action item:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        entries={entries}
        selectedEntryId={selectedEntryId}
        onSelectEntry={(entry) => setSelectedEntryId(entry.id)}
        onNewEntry={handleNewEntry}
        onDeleteEntry={handleDeleteEntry}
        user={user}
        onSignOut={logoutUser}
        onSignIn={() => setIsAuthModalOpen(true)}
        selectedTagFilter={selectedTagFilter}
        onClearTagFilter={() => setSelectedTagFilter(null)}
        onSelectTagFilter={(tag) => setSelectedTagFilter(tag)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          user={user}
          onSignIn={() => setIsAuthModalOpen(true)}
          syncStatus={syncStatus}
        />

        {/* Content Layout based on ViewMode */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* Chat Workspace view */}
          {(viewMode === 'chat' || viewMode === 'split') && (
            <div
              className={`h-full flex-1 flex flex-col transition-all duration-200 ${
                viewMode === 'split' && isPulsePanelOpen ? 'lg:border-r lg:border-stone-200 dark:lg:border-stone-800/80' : ''
              }`}
            >
              <ChatWorkspace
                entry={activeEntry}
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                onStopStreaming={handleStopStreaming}
                onUpdateTitle={handleUpdateTitle}
                onToggleFavorite={handleToggleFavorite}
                onDeleteEntry={() => handleDeleteEntry()}
                onTriggerPulse={() => handleAnalyzeCognitivePulse()}
                isPulsePanelOpen={isPulsePanelOpen}
                onTogglePulsePanel={() => setIsPulsePanelOpen(!isPulsePanelOpen)}
                isDark={isDark}
              />
            </div>
          )}

          {/* Cognitive Pulse & MindMap Side Panel (Split View) */}
          {viewMode === 'split' && isPulsePanelOpen && (
            <div className="hidden lg:block w-[380px] xl:w-[440px] h-full shrink-0 bg-stone-50/70 dark:bg-stone-900/40">
              <CognitivePulsePanel
                pulse={activeEntry?.cognitivePulse}
                isAnalyzing={isAnalyzingPulse}
                errorMessage={pulseAnalysisError}
                onReanalyze={() => handleAnalyzeCognitivePulse()}
                onToggleActionItem={handleToggleActionItem}
                onAddActionItem={handleAddActionItem}
                onTagClick={(tag) => setSelectedTagFilter(tag)}
                isDark={isDark}
              />
            </div>
          )}

          {/* Dedicated MindMap & Insights View (Full Width) */}
          {viewMode === 'cognitive' && (
            <div className="h-full flex-1 overflow-y-auto bg-stone-50/70 dark:bg-stone-900/40">
              <div className="max-w-4xl mx-auto p-6 sm:p-8">
                <CognitivePulsePanel
                  pulse={activeEntry?.cognitivePulse}
                  isAnalyzing={isAnalyzingPulse}
                  errorMessage={pulseAnalysisError}
                  onReanalyze={() => handleAnalyzeCognitivePulse()}
                  onToggleActionItem={handleToggleActionItem}
                  onAddActionItem={handleAddActionItem}
                  onTagClick={(tag) => setSelectedTagFilter(tag)}
                  isDark={isDark}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
