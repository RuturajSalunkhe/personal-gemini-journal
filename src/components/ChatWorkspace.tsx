import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry, JournalMessage } from '../types';
import Markdown from 'react-markdown';
import {
  Send,
  Sparkles,
  StopCircle,
  Clock,
  Star,
  Trash2,
  Share2,
  FileText,
  Lightbulb,
  Edit2,
  Check,
  PanelRightClose,
  PanelRightOpen,
  Compass,
  Zap
} from 'lucide-react';

interface ChatWorkspaceProps {
  entry: JournalEntry | null;
  onSendMessage: (text: string) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  onStopStreaming?: () => void;
  onUpdateTitle?: (newTitle: string) => void;
  onToggleFavorite?: () => void;
  onDeleteEntry?: () => void;
  onTriggerPulse?: () => void;
  isPulsePanelOpen: boolean;
  onTogglePulsePanel: () => void;
  isDark?: boolean;
}

const REFLECTION_PROMPTS = [
  {
    title: 'Morning Clarity',
    desc: 'Set intentional priorities for today',
    prompt: 'I want to ground my focus for today. Here are my main goals, but I feel uncertain about where to start: '
  },
  {
    title: 'Mental Friction',
    desc: 'Deconstruct a sticking point or anxiety',
    prompt: 'I have been experiencing some mental friction around an issue. Help me break it down objectively into what is in my control vs what is not: '
  },
  {
    title: 'Strategic Decision',
    desc: 'Weigh trade-offs and secondary effects',
    prompt: 'I need to make an important decision and want to explore the first and second-order consequences: '
  },
  {
    title: 'Evening Synthesis',
    desc: 'Audit energy, wins, and lessons',
    prompt: 'Let us review today. What gave me the most energy, what drained me, and what is one key insight I want to retain?'
  }
];

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  entry,
  onSendMessage,
  isStreaming,
  streamingContent,
  onStopStreaming,
  onUpdateTitle,
  onToggleFavorite,
  onDeleteEntry,
  onTriggerPulse,
  isPulsePanelOpen,
  onTogglePulsePanel,
  isDark = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(entry?.title || 'Untitled Thought');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (entry) {
      setTitleValue(entry.title);
    }
  }, [entry?.title]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [entry?.messages, streamingContent]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const text = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && onUpdateTitle && titleValue !== entry?.title) {
      onUpdateTitle(titleValue.trim());
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleUsePrompt = (promptText: string) => {
    setInputText(promptText);
    textareaRef.current?.focus();
  };

  const handleExportMarkdown = () => {
    if (!entry) return;
    let md = `# ${entry.title}\n\n*Created: ${new Date(entry.createdAt).toLocaleString()}*\n\n`;
    if (entry.cognitivePulse) {
      md += `## Cognitive Pulse\n- **Mood:** ${entry.cognitivePulse.mood.emoji} ${entry.cognitivePulse.mood.label} (${entry.cognitivePulse.mood.sentiment})\n`;
      md += `- **Core Insight:** ${entry.cognitivePulse.summary}\n`;
      if (entry.cognitivePulse.actionItems?.length) {
        md += `\n### Action Items\n`;
        entry.cognitivePulse.actionItems.forEach((item) => {
          md += `- [${item.completed ? 'x' : ' '}] ${item.text} (${item.priority})\n`;
        });
      }
      md += `\n---\n\n`;
    }
    md += `## Dialogue\n\n`;
    entry.messages.forEach((msg) => {
      md += `### ${msg.role === 'user' ? 'Me' : 'Gemini Thought Partner'}\n${msg.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!entry) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-stone-500">
        <p className="text-sm">Select an existing journal entry or create a new one to begin.</p>
      </div>
    );
  }

  const messages = entry.messages || [];

  return (
    <div id="chat-workspace-container" className="h-full flex flex-col bg-white dark:bg-stone-950">
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-200 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/30">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="text-sm font-semibold px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 w-full"
              />
              <button
                onClick={handleTitleSubmit}
                className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 group">
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate cursor-pointer hover:underline"
                title="Click to rename entry"
              >
                {entry.title}
              </h2>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-opacity"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 pl-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                entry.isFavorite
                  ? 'text-amber-500 hover:bg-amber-500/10'
                  : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={entry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            >
              <Star className={`w-4 h-4 ${entry.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          <button
            onClick={handleExportMarkdown}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Export journal as Markdown"
          >
            <FileText className="w-4 h-4" />
          </button>

          {onDeleteEntry && (
            <button
              onClick={onDeleteEntry}
              className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Delete journal entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="w-[1px] h-5 bg-stone-200 dark:bg-stone-800 mx-1" />

          {/* Toggle Cognitive Pulse side drawer */}
          <button
            id="btn-toggle-pulse-drawer"
            onClick={onTogglePulsePanel}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isPulsePanelOpen
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent'
            }`}
            title="Toggle Cognitive Pulse & MindMap panel"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Cognitive Pulse</span>
            {isPulsePanelOpen ? (
              <PanelRightClose className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto my-6 space-y-6">
            <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/30 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Begin Your Journaling Dialogue
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                Write freely or pick a guided reflection prompt. Gemini will partner with you in conversational brainstorming, then distill your cognitive pulse and concept map.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REFLECTION_PROMPTS.map((starter, sIdx) => (
                <button
                  key={`starter-${sIdx}`}
                  onClick={() => handleUsePrompt(starter.prompt)}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-stone-900/50 hover:border-stone-300 dark:hover:border-stone-700 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {starter.title}
                    </span>
                    <Sparkles className="w-3 h-3 text-stone-400 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                    {starter.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-5 py-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-br-xs'
                      : 'bg-stone-100 dark:bg-stone-900/80 text-stone-800 dark:text-stone-200 border border-stone-200/60 dark:border-stone-800/80 rounded-bl-xs'
                  }`}
                >
                  <div className="markdown-body prose dark:prose-invert max-w-none text-inherit font-normal space-y-2">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                  <div
                    className={`mt-2 text-[10px] font-mono flex items-center gap-1 ${
                      msg.role === 'user'
                        ? 'text-stone-400 dark:text-stone-500 justify-end'
                        : 'text-stone-400 dark:text-stone-500 justify-start'
                    }`}
                  >
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    You
                  </div>
                )}
              </div>
            ))}

            {/* Live streaming message bubble */}
            {isStreaming && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600 animate-spin" />
                </div>

                <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-bl-xs px-5 py-3.5 bg-stone-100 dark:bg-stone-900/80 text-stone-800 dark:text-stone-200 border border-stone-200/60 dark:border-stone-800/80">
                  {streamingContent ? (
                    <div className="markdown-body prose dark:prose-invert max-w-none text-inherit text-xs sm:text-sm leading-relaxed space-y-2">
                      <Markdown>{streamingContent}</Markdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>Gemini is reflecting...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-stone-200 dark:border-stone-800/80 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick reflection action trigger if messages exist */}
          {messages.length > 0 && onTriggerPulse && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-stone-500">
                {messages.length} conversational turns
              </span>
              <button
                type="button"
                onClick={onTriggerPulse}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                <span>Extract Cognitive Pulse & MindMap</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="relative flex items-end gap-2">
            <div className="relative flex-1 rounded-xl border border-stone-300 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-900/90 focus-within:border-stone-500 dark:focus-within:border-stone-500 focus-within:ring-1 focus-within:ring-stone-400 transition-all">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts, challenges, questions, or reflections..."
                rows={1}
                disabled={isStreaming}
                className="w-full text-xs sm:text-sm px-4 py-3 bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 resize-none focus:outline-none min-h-[44px] max-h-[180px]"
              />
            </div>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="h-[44px] px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-colors shadow-xs"
                title="Stop streaming"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-[44px] px-4 rounded-xl bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white disabled:opacity-40 disabled:hover:bg-stone-900 dark:disabled:hover:bg-stone-100 flex items-center justify-center transition-all shadow-xs"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>Press <kbd className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded border border-stone-200 dark:border-stone-700">Enter</kbd> to send, <kbd className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded border border-stone-200 dark:border-stone-700">Shift+Enter</kbd> for newline</span>
            <span className="hidden sm:inline">Protected by strict per-user Firestore isolation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
