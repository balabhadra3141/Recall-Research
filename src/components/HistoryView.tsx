"use client";

import React from "react";
import { ResearchSession } from "@/lib/types";
import { History, Sparkles, BookOpen, Trash2, Calendar, Globe, Cpu } from "lucide-react";

interface HistoryViewProps {
  sessions: ResearchSession[];
  onSelectSession: (session: ResearchSession) => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onTriggerRevisit: (topicKey: string, session: ResearchSession) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  onSelectSession,
  onDeleteSession,
  onTriggerRevisit,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-brand-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Research Session History</h2>
        </div>
        <p className="text-xs text-slate-400">
          Chronological record of completed briefings, source archives, and longitudinal comparisons.
        </p>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-300 mb-1">No past research sessions found.</p>
            <p className="text-slate-500">
              When you submit questions on the Research canvas, completed briefings will appear here.
            </p>
          </div>
        ) : (
          sessions.map((sess) => (
            <div
              key={sess.id}
              className="glass-panel rounded-xl p-5 hover:border-slate-700 transition-all border border-slate-800"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                      {sess.topicKey}
                    </span>
                    {sess.comparison && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30">
                        ⚡ Delta Attached
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(sess.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {sess.briefing?.title || sess.question}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Query: &ldquo;{sess.question}&rdquo;</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectSession(sess)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Briefing</span>
                  </button>

                  <button
                    onClick={() => onTriggerRevisit(sess.topicKey, sess)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-700 to-accent-cyan hover:opacity-90 text-xs font-medium text-white shadow-glow"
                    title="Run fresh search and calculate Research Delta"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>What changed?</span>
                  </button>

                  <button
                    onClick={() => onDeleteSession(sess.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete session from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats footer */}
              <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-3 border-t border-slate-800/60 flex-wrap">
                <span className="flex items-center gap-1 text-slate-400">
                  <Globe className="w-3 h-3 text-brand-400" />
                  {sess.sources.length} sources preserved
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Cpu className="w-3 h-3 text-accent-emerald" />
                  {sess.modelUsed || "NVIDIA Nemotron"}
                </span>
                <span className="font-mono text-[10px] text-slate-600">ID: {sess.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
