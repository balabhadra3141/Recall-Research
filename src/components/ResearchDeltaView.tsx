"use client";

import React from "react";
import { ResearchDelta } from "@/lib/types";
import { Sparkles, CheckCircle2, AlertTriangle, HelpCircle, History, Info } from "lucide-react";

interface ResearchDeltaViewProps {
  delta: ResearchDelta;
  onSelectSource?: (sourceId: string) => void;
}

export const ResearchDeltaView: React.FC<ResearchDeltaViewProps> = ({ delta, onSelectSource }) => {
  return (
    <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-b from-brand-950/40 via-surface-900/60 to-surface-950 p-6 shadow-glow mb-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-emerald p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-surface-950 rounded-[10px] flex items-center justify-center">
              <History className="w-5 h-5 text-accent-emerald" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Research Delta</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30">
                Longitudinal Evidence Comparison
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Examining shifts since previous research session ({delta.previousSessionId})
            </p>
          </div>
        </div>
      </div>

      {/* Delta Overview Summary */}
      <div className="mt-4 p-4 rounded-xl bg-surface-950/70 border border-slate-800/80">
        <p className="text-sm leading-relaxed text-slate-200">{delta.overallDeltaSummary}</p>
      </div>

      {/* Grid of Delta Categories */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. New Findings */}
        <div className="rounded-xl border border-accent-emerald/20 bg-surface-900/40 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-emerald flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              New Developments ({delta.newFindings.length})
            </span>
            <span className="text-[11px] text-slate-500">Not found in prior records</span>
          </div>

          <div className="mt-3 space-y-3">
            {delta.newFindings.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No strictly new developments detected in current scope.</p>
            ) : (
              delta.newFindings.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-950/60 border border-accent-emerald/10 text-xs">
                  <div className="font-semibold text-slate-200 mb-1">{item.claim}</div>
                  <p className="text-slate-400 leading-normal mb-2">{item.explanation}</p>
                  {item.currentSourceIds.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500">Evidence:</span>
                      {item.currentSourceIds.map((sid) => (
                        <button
                          key={sid}
                          onClick={() => onSelectSource?.(sid)}
                          className="px-1.5 py-0.5 rounded bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20 text-[10px] font-mono hover:bg-accent-emerald/20 transition-colors"
                        >
                          [{sid}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Corroborated Findings */}
        <div className="rounded-xl border border-brand-500/20 bg-surface-900/40 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Corroborated ({delta.corroboratedFindings.length})
            </span>
            <span className="text-[11px] text-slate-500">Independently reaffirmed</span>
          </div>

          <div className="mt-3 space-y-3">
            {delta.corroboratedFindings.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No prior claims directly corroborated in this search.</p>
            ) : (
              delta.corroboratedFindings.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-950/60 border border-brand-500/10 text-xs">
                  <div className="font-semibold text-slate-200 mb-1">{item.claim}</div>
                  <div className="text-slate-400 mb-1">
                    <span className="text-slate-500">Prior: </span>
                    {item.pastFindingSummary}
                  </div>
                  <div className="text-slate-300 mb-2">
                    <span className="text-brand-400">Current Evidence: </span>
                    {item.currentEvidence}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {item.priorSourceIds?.length > 0 && (
                      <span>Prior sources: {item.priorSourceIds.join(", ")}</span>
                    )}
                    {item.currentSourceIds?.length > 0 && (
                      <span className="flex items-center gap-1">
                        Current:
                        {item.currentSourceIds.map((sid) => (
                          <button
                            key={sid}
                            onClick={() => onSelectSource?.(sid)}
                            className="px-1 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono hover:bg-brand-500/20"
                          >
                            [{sid}]
                          </button>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Contradicted Findings */}
        <div className="rounded-xl border border-rose-500/20 bg-surface-900/40 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Contradicted / Refuted ({delta.contradictedFindings.length})
            </span>
            <span className="text-[11px] text-slate-500">New evidence conflicts</span>
          </div>

          <div className="mt-3 space-y-3">
            {delta.contradictedFindings.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No direct contradictions observed against prior findings.</p>
            ) : (
              delta.contradictedFindings.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-950/60 border border-rose-500/10 text-xs">
                  <div className="font-semibold text-rose-300 mb-1">{item.claim}</div>
                  <div className="text-slate-400 line-through mb-1">
                    <span className="text-slate-500">Old Conclusion: </span>
                    {item.pastFindingSummary}
                  </div>
                  <div className="text-rose-200 mb-2">
                    <span className="text-rose-400 font-medium">Conflict: </span>
                    {item.conflictExplanation}
                  </div>
                  {item.currentSourceIds?.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500">Refuting Sources:</span>
                      {item.currentSourceIds.map((sid) => (
                        <button
                          key={sid}
                          onClick={() => onSelectSource?.(sid)}
                          className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono border border-rose-500/20"
                        >
                          [{sid}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Unresolved Findings */}
        <div className="rounded-xl border border-amber-500/20 bg-surface-900/40 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Unresolved / Open ({delta.unresolvedFindings.length})
            </span>
            <span className="text-[11px] text-slate-500">Inconclusive evidence</span>
          </div>

          <div className="mt-3 space-y-3">
            {delta.unresolvedFindings.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No explicit open controversies recorded.</p>
            ) : (
              delta.unresolvedFindings.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-950/60 border border-amber-500/10 text-xs">
                  <div className="font-semibold text-amber-200 mb-1">{item.claim}</div>
                  <p className="text-slate-400 leading-normal mb-2">{item.unresolvedReason}</p>
                  {item.sourceIds?.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500">Referenced:</span>
                      {item.sourceIds.map((sid) => (
                        <button
                          key={sid}
                          onClick={() => onSelectSource?.(sid)}
                          className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20"
                        >
                          [{sid}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comparison Limitations disclosure */}
      {delta.comparisonLimitations.length > 0 && (
        <div className="mt-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300">Comparison Scope & Limitations: </span>
            <span>{delta.comparisonLimitations.join(" • ")}</span>
          </div>
        </div>
      )}
    </div>
  );
};
