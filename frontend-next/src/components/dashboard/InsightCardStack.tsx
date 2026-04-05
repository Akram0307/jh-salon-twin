'use client';

import { Lightbulb, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Insight {
  type: 'opportunity' | 'trend' | 'alert';
  title: string;
  description: string;
  action?: string;
  metadata?: string;
}

interface InsightCardStackProps {
  insights: Insight[];
}

export function InsightCardStack({ insights }: InsightCardStackProps) {
  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => (
        <InsightCard key={idx} insight={insight} />
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
            {insight.type === 'alert' && <AlertCircle className="h-4 w-4 text-amber-400" />}
            {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-blue-400" />}
            <p className="text-sm font-medium text-white">{insight.title}</p>
          </div>
          <p className="text-xs text-slate-400">{insight.description}</p>
          {insight.action && (
            <button className="mt-2 text-xs text-gold-400 hover:text-gold-300">
              {insight.action}
            </button>
          )}
        </div>
        {insight.metadata && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-slate-400 hover:text-white"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {expanded && insight.metadata && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-400">{insight.metadata}</p>
        </div>
      )}
    </div>
  );
}
