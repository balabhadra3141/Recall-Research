"use client";

import React, { useState } from "react";
import { BriefingReport, MemoryRecord, ResearchSession } from "@/lib/types";
import { generateMarkdownReport } from "@/lib/utils/export-markdown";
import {
  Download,
  BookmarkPlus,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface BriefingViewProps {
  session: ResearchSession;
  briefing: BriefingReport;
  onSelectSource: (sourceId: string) => void;
  onSaveMemories: (memories: MemoryRecord[]) => Promise<void>;
  onTriggerRevisit: (topicKey: string, previousSession: ResearchSession) => void;
}

export const BriefingView: React.FC<BriefingViewProps> = ({
  session,
  briefing,
  onSelectSource,
  onSaveMemories,
  onTriggerRevisit,
}) => {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleExportMarkdown = () => {
    const md = generateMarkdownReport(session);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RecallResearch_${session.topicKey || "briefing"}_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveAllToMemory = async () => {
    try {
      setSaving(true);
      const candidates: MemoryRecord[] = briefing.keyFindings.map((kf, idx) => ({
        id: `mem-${session.id}-${idx + 1}-${Date.now().toString(36)}`,
        type: "finding",
        title: kf.claim,
        content: kf.synthesis,
        topicKey: session.topicKey,
        tags: [session.topicKey, "briefing-finding"],
        sourceIds: kf.sourceIds,
        sourceUrls: kf.sourceIds
          .map((id) => session.sources.find((s) => s.id === id)?.url)
          .filter(Boolean) as string[],
        originSessionId: session.id,
        confidence: kf.confidence,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
      }));

      await onSaveMemories(candidates);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="space-y-8 animate-fadeIn">
      {/* Briefing Header & Actions */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                Evidence-Backed Briefing
              </span>
              <span className="text-xs text-slate-500">
                {new Date(session.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {briefing.title}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-all hover:scale-[1.02]"
              title="Download full briefing and evidence as formatted Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .md</span>
            </button>

            <button
              onClick={handleSaveAllToMemory}
              disabled={saving || savedSuccess}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                savedSuccess
                  ? "bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30"
                  : "bg-brand-600 hover:bg-brand-500 text-white shadow-glow"
              }`}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Saved to IndexedDB</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save to Memory"}</span>
                </>
              )}
            </button>

            <button
              onClick={() => onTriggerRevisit(session.topicKey, session)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-700 to-accent-cyan hover:opacity-95 text-white text-xs font-medium shadow-glow"
              title="Conduct follow-up web research on this topic and calculate Research Delta"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>What changed?</span>
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-brand-400" />
            Executive Summary
          </h2>
          <div className="text-sm sm:text-base leading-relaxed text-slate-200 whitespace-pre-line space-y-3 font-normal">
            {briefing.executiveSummary}
          </div>
        </div>
      </div>

      {/* Key Findings */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8">
        <h2 className="text-base font-bold text-white mb-6 flex items-center justify-between">
          <span>Key Findings & Grounded Synthesis</span>
          <span className="text-xs text-slate-400 font-normal">
            {briefing.keyFindings.length} findings validated
          </span>
        </h2>

        <div className="space-y-5">
          {briefing.keyFindings.map((finding) => (
            <div
              key={finding.id}
              className="p-5 rounded-xl bg-surface-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-400 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                    {finding.id}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{finding.claim}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      finding.confidence === "high"
                        ? "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30"
                        : finding.confidence === "moderate"
                        ? "bg-brand-500/10 text-brand-400 border border-brand-500/30"
                        : "bg-accent-amber/10 text-accent-amber border border-accent-amber/30"
                    }`}
                  >
                    Confidence: {finding.confidence}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                {finding.synthesis}
              </p>

              {/* Citations */}
              <div className="flex items-center gap-2 flex-wrap pt-2.5 border-t border-slate-800/60 text-xs">
                <span className="text-slate-500 text-[11px]">Cited Evidence:</span>
                {finding.sourceIds.length === 0 ? (
                  <span className="text-[11px] text-accent-amber italic">No verified sources (analytical hypothesis)</span>
                ) : (
                  finding.sourceIds.map((sid) => (
                    <button
                      key={sid}
                      onClick={() => onSelectSource(sid)}
                      className="px-2 py-0.5 rounded-md bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 font-mono text-[11px] border border-brand-500/30 transition-all"
                    >
                      [{sid}]
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid: Competing Viewpoints & Contradictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competing Viewpoints */}
        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Compass className="w-4 h-4 text-accent-cyan" />
            Competing Viewpoints
          </h2>
          <div className="space-y-4">
            {briefing.competingViewpoints.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No significant division among current sources.</p>
            ) : (
              briefing.competingViewpoints.map((cv, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-surface-900/40 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-200 mb-2">
                    Focus: {cv.topic}
                  </div>
                  <div className="space-y-2">
                    {cv.perspectives.map((p, pIdx) => (
                      <div key={pIdx} className="text-xs text-slate-400 pl-3 border-l-2 border-accent-cyan/40">
                        <span>{p.stance}</span>
                        {p.sourceIds.length > 0 && (
                          <span className="ml-2 font-mono text-[10px] text-accent-cyan">
                            [{p.sourceIds.join(", ")}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Contradictions & Uncertainties */}
        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-amber" />
            Contradictions & Unknowns
          </h2>
          <div className="space-y-4">
            {briefing.contradictionsAndUncertainties.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No major contradictions discovered in retrieved set.</p>
            ) : (
              briefing.contradictionsAndUncertainties.map((cu, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-surface-900/40 border border-slate-800">
                  <div className="text-xs font-semibold text-amber-300 mb-1">
                    {cu.issue}
                  </div>
                  <p className="text-xs text-slate-300 leading-normal mb-2">{cu.explanation}</p>
                  {cu.sourceIds.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Related:</span>
                      {cu.sourceIds.map((sid) => (
                        <button
                          key={sid}
                          onClick={() => onSelectSource(sid)}
                          className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[10px]"
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
        </section>
      </div>

      {/* Chronology & Developments */}
      {briefing.timelineAndDevelopments.length > 0 && (
        <section className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-emerald" />
            Chronology of Developments
          </h2>
          <div className="space-y-3">
            {briefing.timelineAndDevelopments.map((tl, idx) => (
              <div key={idx} className="flex items-start gap-4 text-xs">
                <span className="font-mono text-brand-400 font-semibold shrink-0 w-28 text-right">
                  {tl.dateOrPeriod}
                </span>
                <div className="flex-1 pb-3 border-b border-slate-800/80">
                  <span className="text-slate-200">{tl.event}</span>
                  {tl.sourceIds.length > 0 && (
                    <span className="ml-2 font-mono text-[10px] text-slate-500">
                      [{tl.sourceIds.join(", ")}]
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open Questions & Next Steps */}
      <section className="glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand-400" />
          Open Questions & Recommended Next Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-900/40 border border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Unanswered Questions
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {briefing.openQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-brand-400 font-bold">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-surface-900/40 border border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Suggested Follow-ups
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {briefing.suggestedNextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-accent-emerald shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </article>
  );
};
