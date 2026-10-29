"use client";

import React from "react";
import { SourceRecord } from "@/lib/types";
import { ExternalLink, Calendar, Clock, Globe, ShieldCheck } from "lucide-react";

interface EvidenceInspectorProps {
  sources: SourceRecord[];
  selectedSourceId?: string | null;
  onSelectSource: (sourceId: string | null) => void;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
}) => {
  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col glass-panel rounded-2xl p-4 lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-white">Evidence Inspector</h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {sources.length} sources
          </span>
        </div>
        {selectedSourceId && (
          <button
            onClick={() => onSelectSource(null)}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Clear focus
          </button>
        )}
      </div>

      <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1">
        {sources.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No sources retrieved for the active session yet. Run a research question to see live Tavily sources.
          </div>
        ) : (
          sources.map((source) => {
            const isSelected = selectedSourceId === source.id;
            return (
              <div
                key={source.id}
                id={`source-${source.id}`}
                onClick={() => onSelectSource(source.id)}
                className={`p-3.5 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-brand-950/60 border-brand-500/60 shadow-glow"
                    : "bg-surface-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-surface-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      [{source.id}]
                    </span>
                    <span className="text-[11px] font-medium text-accent-emerald flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-slate-400 hover:text-brand-300 transition-colors p-1"
                    title="Open live source URL in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 mb-2">
                  {source.title}
                </h4>

                <div className="text-[11px] text-slate-400 leading-relaxed bg-surface-950/60 p-2.5 rounded-lg border border-slate-800/60 italic mb-2.5">
                  &ldquo;{source.excerpt}&rdquo;
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {source.publishedAt ? new Date(source.publishedAt).toLocaleDateString() : "Undated"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(source.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
