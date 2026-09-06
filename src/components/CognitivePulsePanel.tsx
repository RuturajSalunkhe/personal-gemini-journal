import React, { useState } from 'react';
import { CognitivePulse, ActionItem } from '../types';
import { MindMapVisualizer } from './MindMapVisualizer';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Tag,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Flame,
  BatteryCharging,
  Activity,
  Lightbulb
} from 'lucide-react';

interface CognitivePulsePanelProps {
  pulse?: CognitivePulse;
  isAnalyzing: boolean;
  errorMessage?: string | null;
  onReanalyze: () => void;
  onToggleActionItem: (itemId: string, completed: boolean) => void;
  onAddActionItem?: (text: string) => void;
  onTagClick?: (tag: string) => void;
  isDark?: boolean;
}

export const CognitivePulsePanel: React.FC<CognitivePulsePanelProps> = ({
  pulse,
  isAnalyzing,
  errorMessage,
  onReanalyze,
  onToggleActionItem,
  onAddActionItem,
  onTagClick,
  isDark = true,
}) => {
  const [newActionText, setNewActionText] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim() || !onAddActionItem) return;
    onAddActionItem(newActionText.trim());
    setNewActionText('');
  };

  const handleCopySummary = () => {
    if (!pulse?.summary) return;
    navigator.clipboard.writeText(pulse.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (!pulse && !isAnalyzing) {
    return (
      <div id="empty-cognitive-pulse" className="h-full flex flex-col items-center justify-center p-8 text-center bg-stone-50/50 dark:bg-stone-900/30">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
          <Activity className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-1">
          Cognitive Pulse & MindMap
        </h3>
        <p className="text-xs text-stone-500 max-w-sm mb-6 leading-relaxed">
          Gemini extracts your emotional tone, actionable tasks, semantic tags, and a concept mindmap from your journal entries.
        </p>
        {errorMessage && (
          <div className="max-w-sm mb-4 p-3 text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
            {errorMessage}
          </div>
        )}
        <button
          id="btn-generate-initial-pulse"
          onClick={onReanalyze}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
          Generate Cognitive Pulse
        </button>
      </div>
    );
  }

  return (
    <div id="cognitive-pulse-panel" className="h-full overflow-y-auto p-5 space-y-6">
      {/* Error notice if reanalysis failed */}
      {errorMessage && (
        <div className="p-3 text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
          <span>{errorMessage}</span>
          <button
            onClick={onReanalyze}
            className="px-2.5 py-1 bg-amber-500 text-white rounded font-medium hover:bg-amber-600 transition text-[11px] shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Header & Re-analyze trigger */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Cognitive Pulse
            </h3>
            <span className="text-[11px] text-stone-500">
              {pulse?.analyzedAt ? `Updated ${new Date(pulse.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Analyzing thought pattern...'}
            </span>
          </div>
        </div>

        <button
          id="btn-reanalyze-pulse"
          onClick={onReanalyze}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors disabled:opacity-50"
          title="Re-run Gemini cognitive extraction"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-amber-500' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing...' : 'Refresh'}</span>
        </button>
      </div>

      {isAnalyzing && !pulse && (
        <div className="p-8 text-center space-y-3 border border-amber-500/20 bg-amber-500/5 rounded-xl animate-pulse">
          <Sparkles className="w-6 h-6 text-amber-500 mx-auto animate-spin" />
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Synthesizing emotional sentiment, action items, and concept nodes...
          </p>
        </div>
      )}

      {pulse && (
        <>
          {/* Emotional Tone & Mood Badge */}
          <div id="pulse-mood-badge" className="p-4 rounded-xl border border-stone-200 dark:border-stone-800/90 bg-white/70 dark:bg-stone-900/60 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-1 block">
                  Emotional Tone
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl" role="img" aria-label="mood emoji">
                    {pulse.mood?.emoji || '✨'}
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-tight">
                      {pulse.mood?.label || 'Reflective'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${
                        pulse.mood?.sentiment === 'positive'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : pulse.mood?.sentiment === 'challenging'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {pulse.mood?.sentiment || 'reflective'}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 capitalize">
                        <BatteryCharging className="w-3 h-3 text-stone-400" />
                        {pulse.mood?.energy || 'medium'} energy
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Insight / Synthesis */}
          {pulse.summary && (
            <div id="pulse-summary-card" className="p-4 rounded-xl border border-stone-200 dark:border-stone-800/90 bg-white/70 dark:bg-stone-900/60 shadow-xs relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-stone-500">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400">
                    Core Insight
                  </span>
                </div>
                <button
                  onClick={handleCopySummary}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-md transition-colors"
                  title="Copy synthesis"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed italic">
                "{pulse.summary}"
              </p>
            </div>
          )}

          {/* Action Items Checklist */}
          <div id="pulse-action-items" className="p-4 rounded-xl border border-stone-200 dark:border-stone-800/90 bg-white/70 dark:bg-stone-900/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs uppercase font-bold tracking-wider text-stone-600 dark:text-stone-400">
                  Action Items Checklist
                </h4>
              </div>
              <span className="text-[11px] font-mono text-stone-400">
                {pulse.actionItems?.filter(i => i.completed).length || 0}/{pulse.actionItems?.length || 0} Done
              </span>
            </div>

            <div className="space-y-2">
              {pulse.actionItems && pulse.actionItems.length > 0 ? (
                pulse.actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-stone-100/70 dark:hover:bg-stone-800/50 transition-colors group cursor-pointer"
                    onClick={() => onToggleActionItem(item.id, !item.completed)}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200 transition-colors"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    <span
                      className={`text-xs leading-relaxed flex-1 ${
                        item.completed
                          ? 'line-through text-stone-400 dark:text-stone-500'
                          : 'text-stone-800 dark:text-stone-200 font-medium'
                      }`}
                    >
                      {item.text}
                    </span>
                    {item.priority && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        item.priority === 'high'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : item.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                      }`}>
                        {item.priority}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-500 italic py-2">No action items detected in this entry.</p>
              )}
            </div>

            {/* Quick add custom action item */}
            {onAddActionItem && (
              <form onSubmit={handleAddAction} className="flex gap-2 pt-2 border-t border-stone-200 dark:border-stone-800/60">
                <input
                  type="text"
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  placeholder="Add custom action commitment..."
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600"
                />
                <button
                  type="submit"
                  disabled={!newActionText.trim()}
                  className="p-1.5 rounded-lg bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 disabled:opacity-40"
                  title="Add action item"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          {/* Semantic Topic Tags */}
          <div id="pulse-topic-tags" className="p-4 rounded-xl border border-stone-200 dark:border-stone-800/90 bg-white/70 dark:bg-stone-900/60 shadow-xs space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-stone-400" />
              <h4 className="text-xs uppercase font-bold tracking-wider text-stone-600 dark:text-stone-400">
                Semantic Topic Tags
              </h4>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {pulse.topicTags && pulse.topicTags.length > 0 ? (
                pulse.topicTags.map((tag, idx) => (
                  <button
                    key={`tag-${idx}`}
                    onClick={() => onTagClick && onTagClick(tag)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    <span>#</span>
                    <span>{tag.replace(/^#/, '')}</span>
                  </button>
                ))
              ) : (
                <span className="text-xs text-stone-500 italic">No topic tags assigned</span>
              )}
            </div>
          </div>

          {/* Concept MindMap */}
          {pulse.mindMap && (
            <div id="pulse-mindmap-section" className="p-4 rounded-xl border border-stone-200 dark:border-stone-800/90 bg-white/70 dark:bg-stone-900/60 shadow-xs">
              <MindMapVisualizer data={pulse.mindMap} isDark={isDark} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
