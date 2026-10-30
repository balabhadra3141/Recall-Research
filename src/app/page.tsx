"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { BriefingView } from "@/components/BriefingView";
import { ResearchDeltaView } from "@/components/ResearchDeltaView";
import { EvidenceInspector } from "@/components/EvidenceInspector";
import { MemoryLibraryView } from "@/components/MemoryLibraryView";
import { HistoryView } from "@/components/HistoryView";
import { DiagnosticsModal } from "@/components/DiagnosticsModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { useToast } from "@/components/Toast";
import { StorageRepository } from "@/lib/storage/indexeddb";
import { MemoryRecord, ResearchResponse, ResearchSession, SourceRecord } from "@/lib/types";
import {
  Sparkles,
  History,
  Bookmark,
  Globe,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Database,
  ExternalLink,
  ShieldCheck,
  Search,
  Lock,
  Layers,
  HelpCircle,
} from "lucide-react";

const DEMO_STARTER_TOPICS = [
  "What are the latest developments in solid-state batteries?",
  "How has the open-source AI model ecosystem changed recently?",
  "What has changed in the latest major cloud platform announcements?",
  "Compare recent developments in post-quantum cryptography.",
];

export default function HomePage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"research" | "memory" | "history" | "sources">("research");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Research input state
  const [question, setQuestion] = useState("");
  const [selectedPriorSession, setSelectedPriorSession] = useState<ResearchSession | null>(null);

  // Execution state
  const [isSearching, setIsSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStorageLoading, setIsStorageLoading] = useState(true);

  // Active session data
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // Saved records
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [allSources, setAllSources] = useState<SourceRecord[]>([]);
  const [sourceSearchQuery, setSourceSearchQuery] = useState("");

  // Confirmation modal state
  const [deletePendingSessionId, setDeletePendingSessionId] = useState<string | null>(null);

  // Load IndexedDB state on mount
  const refreshStorage = useCallback(async () => {
    try {
      const storedSessions = await StorageRepository.listSessions();
      const storedMemories = await StorageRepository.listMemories();
      setSessions(storedSessions);
      setMemories(storedMemories);

      // Collect all sources
      const srcMap = new Map<string, SourceRecord>();
      for (const s of storedSessions) {
        for (const src of s.sources || []) {
          srcMap.set(src.id + src.url, src);
        }
      }
      setAllSources(Array.from(srcMap.values()));

      // Set initial active session if not already viewing one
      setActiveSession((prev) => prev ?? (storedSessions.length > 0 ? storedSessions[0] : null));
    } catch (e) {
      console.error("IndexedDB initialization error:", e);
    } finally {
      setIsStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [refreshStorage]);

  // Global keyboard shortcut: Ctrl+K or / to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "TEXTAREA") ||
          (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setActiveTab("research");
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRunResearch = async (overrideQuestion?: string, overridePrior?: ResearchSession) => {
    const queryToRun = (overrideQuestion || question).trim();
    if (!queryToRun) return;

    const priorToUse = overridePrior !== undefined ? overridePrior : selectedPriorSession;

    try {
      setIsSearching(true);
      setErrorMessage(null);
      setCurrentStep("Initiating real-time Tavily search...");
      showToast("info", "Investigation Started", `Querying real-time evidence for "${queryToRun.slice(0, 40)}..."`);

      // Prepare payload
      const payload: any = {
        question: queryToRun,
        topicKey: priorToUse ? priorToUse.topicKey : undefined,
      };

      if (priorToUse) {
        payload.previousSession = priorToUse;
        const relevantMemories = await StorageRepository.listMemories({
          topicKey: priorToUse.topicKey,
        });
        payload.priorMemories = relevantMemories;
      }

      setCurrentStep("Synthesizing evidence with NVIDIA Nemotron on Nebius Token Factory...");

      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || `Research request failed with status ${response.status}`);
      }

      setCurrentStep("Validating citations & persisting to IndexedDB...");
      const result = (await response.json()) as ResearchResponse;

      // Save locally to IndexedDB
      await StorageRepository.saveSession(result.session);
      await StorageRepository.saveSources(result.sources);

      if (result.extractedMemories?.length > 0) {
        await StorageRepository.saveMemories(result.extractedMemories);
      }

      if (result.delta) {
        await StorageRepository.saveDelta(result.delta);
      }

      // Update state
      setActiveSession(result.session);
      setSelectedPriorSession(null);
      setQuestion("");
      setActiveTab("research");

      await refreshStorage();

      if (result.delta) {
        showToast("success", "Research Delta Computed", "Compared new evidence against prior session.");
      } else {
        showToast("success", "Briefing Generated", `${result.sources.length} sources grounded with Nemotron.`);
      }
    } catch (err: any) {
      console.error("Research execution failed:", err);
      const msg = err.message || String(err);
      setErrorMessage(msg);
      showToast("error", "Research Execution Notice", msg.slice(0, 100));
    } finally {
      setIsSearching(false);
      setCurrentStep("");
    }
  };

  const handleTriggerRevisit = (topicKey: string, priorSession: ResearchSession) => {
    setSelectedPriorSession(priorSession);
    setQuestion(priorSession.question);
    setActiveTab("research");
    showToast("info", "Revisit Mode Active", `Comparing against session from ${new Date(priorSession.createdAt).toLocaleDateString()}`);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSaveMemories = async (newMems: MemoryRecord[]) => {
    await StorageRepository.saveMemories(newMems);
    await refreshStorage();
  };

  const handleUpdateMemory = async (id: string, updates: Partial<MemoryRecord>) => {
    await StorageRepository.updateMemory(id, updates);
    await refreshStorage();
  };

  const handleDeleteMemory = async (id: string) => {
    await StorageRepository.deleteMemory(id);
    await refreshStorage();
  };

  const handleConfirmDeleteSession = async () => {
    if (!deletePendingSessionId) return;
    try {
      await StorageRepository.deleteSession(deletePendingSessionId);
      if (activeSession?.id === deletePendingSessionId) {
        setActiveSession(null);
      }
      await refreshStorage();
      showToast("info", "Session Deleted", "Removed from local IndexedDB storage.");
    } finally {
      setDeletePendingSessionId(null);
    }
  };

  const handleExportBackup = async () => {
    const backupJson = await StorageRepository.exportFullBackup();
    const blob = new Blob([backupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RecallResearch_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("success", "Backup Downloaded", "Full IndexedDB exported as JSON.");
  };

  // Filter sources for the Archive tab
  const filteredSources = allSources.filter((s) => {
    if (!sourceSearchQuery.trim()) return true;
    const q = sourceSearchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.url.toLowerCase().includes(q) || s.excerpt.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-slate-100">
      <Header
        onOpenDiagnostics={() => setDiagnosticsOpen(true)}
        activeView={activeTab}
      />

      {/* Navigation Sub-header */}
      <nav className="border-b border-slate-800/80 bg-surface-900/40 px-4 sm:px-6 py-2.5 backdrop-blur-sm sticky top-[61px] z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("research")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "research"
                  ? "bg-brand-600 text-white shadow-glow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Research Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab("memory")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "memory"
                  ? "bg-brand-600 text-white shadow-glow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Memory Library</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-950/80 text-brand-300 font-mono">
                {memories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "history"
                  ? "bg-brand-600 text-white shadow-glow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-950/80 text-brand-300 font-mono">
                {sessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("sources")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "sources"
                  ? "bg-brand-600 text-white shadow-glow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Source Archive</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-950/80 text-brand-300 font-mono">
                {allSources.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-accent-emerald" />
              <span>IndexedDB Local-First</span>
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW: RESEARCH WORKSPACE */}
        {activeTab === "research" && (
          <div className="space-y-8">
            {/* Research Input Bar */}
            <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Research Analyst</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
                  Investigate any topic with real web evidence & persistent recall.
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                  Searches via Tavily, synthesizes with NVIDIA Nemotron on Nebius Token Factory, validates source citations, and automatically computes Research Deltas when revisiting previous work.
                </p>

                {/* Longitudinal comparison banner */}
                {selectedPriorSession && (
                  <div className="mb-4 p-3.5 rounded-xl bg-accent-emerald/10 border border-accent-emerald/30 flex items-center justify-between text-xs text-slate-200 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent-emerald shrink-0" />
                      <div>
                        <span className="font-semibold text-accent-emerald">Revisiting Mode Active: </span>
                        <span>
                          Will compute Research Delta against session from{" "}
                          {new Date(selectedPriorSession.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPriorSession(null)}
                      className="text-slate-400 hover:text-white underline text-[11px] shrink-0 ml-3"
                    >
                      Cancel revisit
                    </button>
                  </div>
                )}

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRunResearch();
                  }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Enter a research topic, claim, or question to investigate... (Press / to focus)"
                      disabled={isSearching}
                      className="w-full pl-4 pr-32 py-3.5 rounded-xl bg-surface-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={isSearching || !question.trim()}
                      className="absolute right-2 top-2 bottom-2 px-5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Researching</span>
                        </>
                      ) : (
                        <>
                          <span>{selectedPriorSession ? "Run Delta" : "Research"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress Indicator */}
                  {isSearching && (
                    <div className="p-3.5 rounded-xl bg-brand-950/60 border border-brand-500/30 flex items-center gap-3 text-xs text-brand-300 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
                      <span className="font-medium">{currentStep}</span>
                    </div>
                  )}

                  {/* Error State */}
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start justify-between gap-3 animate-fadeIn">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-rose-200 mb-0.5">Integration Notice</div>
                          <p className="leading-relaxed">{errorMessage}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDiagnosticsOpen(true)}
                        className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-medium border border-rose-500/30 shrink-0 transition-colors"
                      >
                        Inspect Keys
                      </button>
                    </div>
                  )}

                  {/* Demo Starter Prompts */}
                  {!isSearching && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                        Demo Starters (Real Live Search & Nemotron Synthesis):
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {DEMO_STARTER_TOPICS.map((prompt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setQuestion(prompt);
                              handleRunResearch(prompt);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-surface-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-left hover:scale-[1.01]"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Research Skeleton Loader while actively searching */}
            {isSearching && (
              <div className="space-y-6 animate-fadeIn">
                <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4">
                  <div className="h-6 w-2/3 skeleton" />
                  <div className="h-4 w-full skeleton" />
                  <div className="h-4 w-5/6 skeleton" />
                  <div className="h-4 w-1/2 skeleton" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel rounded-xl p-5 space-y-3">
                    <div className="h-4 w-1/3 skeleton" />
                    <div className="h-12 w-full skeleton" />
                  </div>
                  <div className="glass-panel rounded-xl p-5 space-y-3">
                    <div className="h-4 w-1/3 skeleton" />
                    <div className="h-12 w-full skeleton" />
                  </div>
                </div>
              </div>
            )}

            {/* Active Research Canvas */}
            {!isSearching && activeSession && activeSession.briefing ? (
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 w-full space-y-8">
                  {/* Signature Research Delta if available */}
                  {activeSession.comparison && (
                    <ResearchDeltaView
                      delta={activeSession.comparison}
                      onSelectSource={(sid) => setSelectedSourceId(sid)}
                    />
                  )}

                  {/* Evidence-Backed Briefing */}
                  <BriefingView
                    session={activeSession}
                    briefing={activeSession.briefing}
                    onSelectSource={(sid) => setSelectedSourceId(sid)}
                    onSaveMemories={handleSaveMemories}
                    onTriggerRevisit={handleTriggerRevisit}
                  />
                </div>

                {/* Evidence Inspector Side Panel */}
                <EvidenceInspector
                  sources={activeSession.sources}
                  selectedSourceId={selectedSourceId}
                  onSelectSource={(sid) => setSelectedSourceId(sid)}
                />
              </div>
            ) : !isSearching && !isStorageLoading ? (
              <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
                <Sparkles className="w-10 h-10 text-brand-500/40 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Ready to Conduct Evidence-Backed Research
                </h3>
                <p className="max-w-md mx-auto text-slate-500 mb-4 leading-relaxed">
                  Select a starter topic above or enter your own query. Real web evidence will be gathered via Tavily and synthesized using NVIDIA Nemotron on Nebius Token Factory.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* VIEW: MEMORY LIBRARY */}
        {activeTab === "memory" && (
          <MemoryLibraryView
            memories={memories}
            onUpdateMemory={handleUpdateMemory}
            onDeleteMemory={handleDeleteMemory}
            onOpenSession={(sessId) => {
              const target = sessions.find((s) => s.id === sessId);
              if (target) {
                setActiveSession(target);
                setActiveTab("research");
              }
            }}
            onExportBackup={handleExportBackup}
          />
        )}

        {/* VIEW: HISTORY */}
        {activeTab === "history" && (
          <HistoryView
            sessions={sessions}
            onSelectSession={(sess) => {
              setActiveSession(sess);
              setActiveTab("research");
            }}
            onDeleteSession={async (sessId) => {
              setDeletePendingSessionId(sessId);
            }}
            onTriggerRevisit={handleTriggerRevisit}
          />
        )}

        {/* VIEW: SOURCES REPOSITORY */}
        {activeTab === "sources" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-5 h-5 text-brand-400" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Preserved Source Evidence</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    All real web sources retrieved via Tavily across your research sessions.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {filteredSources.length} source{filteredSources.length === 1 ? "" : "s"} preserved
                </div>
              </div>

              {/* Source search bar */}
              <div className="mt-4 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sourceSearchQuery}
                  onChange={(e) => setSourceSearchQuery(e.target.value)}
                  placeholder="Filter sources by title, excerpt, or domain..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSources.length === 0 ? (
                <div className="md:col-span-2 glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
                  No sources matching &ldquo;{sourceSearchQuery}&rdquo; recorded. Run research queries to archive live sources.
                </div>
              ) : (
                filteredSources.map((source, idx) => (
                  <div key={idx} className="glass-panel rounded-xl p-4 border border-slate-800 space-y-2 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          [{source.id}]
                        </span>
                        <span className="text-[10px] font-medium text-accent-emerald flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Grounded
                        </span>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-xs transition-colors"
                        title="Open source URL in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 line-clamp-2">{source.title}</h3>
                    <p className="text-[11px] text-slate-400 italic line-clamp-3 bg-surface-950 p-2.5 rounded-lg border border-slate-800/60">
                      &ldquo;{source.excerpt}&rdquo;
                    </p>
                    <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                      <span>Published: {source.publishedAt ? new Date(source.publishedAt).toLocaleDateString() : "Undated"}</span>
                      <span>Retrieved: {new Date(source.retrievedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Production Footer with Architecture & Privacy Disclosures */}
      <footer className="border-t border-slate-800/80 bg-surface-950/80 py-8 px-4 sm:px-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800/60">
            {/* Column 1: Local-first Storage */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Database className="w-4 h-4 text-accent-emerald" />
                <span>Local-First Persistent Storage</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Your research briefings, memory cards, and Research Deltas are stored locally in this browser&apos;s IndexedDB (<code className="text-slate-300 font-mono text-[10px]">RecallResearchDB</code>). Data persists across sessions without third-party user databases.
              </p>
            </div>

            {/* Column 2: Provider Lock & Inference */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Layers className="w-4 h-4 text-brand-400" />
                <span>Nebius & NVIDIA Nemotron Lock</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Synthesis is exclusively powered by NVIDIA Nemotron open-weight models hosted on Nebius Token Factory (<code className="text-slate-300 font-mono text-[10px]">nvidia/nemotron-3-super-120b-a12b</code>). Zero fallback to other commercial providers.
              </p>
            </div>

            {/* Column 3: Network & Privacy Boundaries */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Lock className="w-4 h-4 text-accent-amber" />
                <span>Privacy & Network Boundaries</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                To fetch live web evidence, queries are transmitted over HTTPS to Tavily Search API. Evidence excerpts and selected prior memory context are transmitted to Nebius Token Factory for grounded synthesis.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              <span>Recall Research &copy; 2026 &bull; Built for the Nebius &times; NVIDIA Hackathon</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDiagnosticsOpen(true)}
                className="hover:text-slate-300 transition-colors"
              >
                System Diagnostics
              </button>
              <button
                onClick={handleExportBackup}
                className="hover:text-slate-300 transition-colors"
              >
                Export Database
              </button>
              <a
                href="https://github.com/balabalaji245/nebius-nvidia-hackathon"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-300 transition-colors flex items-center gap-1"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
      />

      {/* Session Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletePendingSessionId)}
        title="Delete Research Session?"
        message="This will delete this briefing and source record from your local history. Memory cards you saved to the Memory Library will remain preserved."
        confirmLabel="Delete Session"
        onConfirm={handleConfirmDeleteSession}
        onCancel={() => setDeletePendingSessionId(null)}
      />
    </div>
  );
}
