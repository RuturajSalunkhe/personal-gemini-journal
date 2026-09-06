import React, { useMemo } from 'react';
import { MindMapData } from '../types';
import { Sparkles, Network, Layers } from 'lucide-react';

interface MindMapVisualizerProps {
  data: MindMapData;
  isDark?: boolean;
}

export const MindMapVisualizer: React.FC<MindMapVisualizerProps> = ({ data, isDark = true }) => {
  const { centralConcept, branches } = data;

  const branchColors = useMemo(() => [
    { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', stroke: '#6366f1', text: 'text-indigo-300' },
    { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', stroke: '#10b981', text: 'text-emerald-300' },
    { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', stroke: '#f59e0b', text: 'text-amber-300' },
    { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', stroke: '#f43f5e', text: 'text-rose-300' },
    { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', stroke: '#06b6d4', text: 'text-cyan-300' },
  ], []);

  if (!branches || branches.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl border-stone-300 dark:border-stone-800 text-stone-500">
        <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No concept nodes generated yet. Share your thoughts in the journal to generate a MindMap.</p>
      </div>
    );
  }

  return (
    <div id="mindmap-container" className="w-full space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
            <Network className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Cognitive Concept Map
          </h4>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
          {branches.length} Branches
        </span>
      </div>

      {/* Central Concept Node */}
      <div className="relative flex justify-center my-4">
        <div className="relative z-10 px-5 py-3 text-center rounded-2xl shadow-sm border bg-stone-900 text-stone-50 border-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-300">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Central Theme</span>
          </div>
          <h3 className="text-base font-bold tracking-tight max-w-xs sm:max-w-md">
            {centralConcept || 'Core Journal Insight'}
          </h3>
        </div>
      </div>

      {/* Radiating Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {branches.map((branch, index) => {
          const colorTheme = branchColors[index % branchColors.length];
          return (
            <div
              key={`branch-${index}`}
              id={`mindmap-branch-${index}`}
              className="relative p-4 rounded-xl border bg-stone-50/50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: branch.color || colorTheme.stroke }}
                    />
                    <h5 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {branch.title}
                    </h5>
                  </div>
                  <span className="text-[11px] font-mono opacity-60 text-stone-500">
                    Node {index + 1}
                  </span>
                </div>

                <div className="space-y-2 pl-3 border-l-2 border-stone-200 dark:border-stone-800">
                  {branch.subIdeas && branch.subIdeas.map((subIdea, sIdx) => (
                    <div
                      key={`sub-${index}-${sIdx}`}
                      className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed flex items-start gap-1.5"
                    >
                      <span className="text-stone-400 mt-1 select-none">•</span>
                      <span>{subIdea}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
