"use client";

import React, { useState } from "react";
import { MemoryRecord, ResearchSession } from "@/lib/types";
import {
  Bookmark,
  Pin,
  Trash2,
  Edit3,
  Search,
  ExternalLink,
  Download,
  ShieldCheck,
  Check,
  X,
  Info,
} from "lucide-react";

interface MemoryLibraryViewProps {
  memories: MemoryRecord[];
  onUpdateMemory: (id: string, updates: Partial<MemoryRecord>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onOpenSession: (sessionId: string) => void;
  onExportBackup: () => Promise<void>;
}

export const MemoryLibraryView: React.FC<MemoryLibraryViewProps> = ({
  memories,
  onUpdateMemory,
  onDeleteMemory,
  onOpenSession,
  onExportBackup,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [filterPinned, setFilterPinned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const topics = Array.from(new Set(memories.map((m) => m.topicKey))).filter(Boolean);

  const filteredMemories = memories.filter((m) => {
    if (selectedTopic !== "all" && m.topicKey !== selectedTopic) return false;
    if (filterPinned && !m.pinned) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = m.title.toLowerCase().includes(q);
      const inContent = m.content.toLowerCase().includes(q);
      const inTags = m.tags.some((t) => t.toLowerCase().includes(q));
      if (!inTitle && !inContent && !inTags) return false;
    }
    return true;
  });

  const handleStartEdit = (m: MemoryRecord) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditContent(m.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    await onUpdateMemory(id, {
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    setEditingId(null);
  };

  const handleTogglePin = async (m: MemoryRecord) => {
    await onUpdateMemory(m.id, { pinned: !m.pinned });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="w-5 h-5 text-brand-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Persistent Memory Library</h2>
            </div>
            <p className="text-xs text-slate-400">
              Stored locally in browser IndexedDB. Preserved across sessions on this device profile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-all"
              title="Export complete IndexedDB backup as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved facts, claims, or topics..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Topic filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="all">All Topics ({memories.length})</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  Topic: {t}
                </option>
              ))}
            </select>

            <button
              onClick={() => setFilterPinned(!filterPinned)}
              className={`p-2 rounded-xl border text-xs transition-colors shrink-0 ${
                filterPinned
                  ? "bg-accent-amber/20 text-accent-amber border-accent-amber/40"
                  : "bg-surface-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
              title="Filter Pinned Only"
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Local-first Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-400 shrink-0" />
          <span>
            Memories are saved in this browser&apos;s IndexedDB. When conducting follow-ups, relevant memories are fed into Nemotron Super for longitudinal comparison.
          </span>
        </span>
        <span className="font-mono text-slate-300 font-semibold shrink-0 ml-4">
          {filteredMemories.length} item{filteredMemories.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Memory Items List */}
      <div className="space-y-4">
        {filteredMemories.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400">
            <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-300 mb-1">No memory records found.</p>
            <p className="text-slate-500">
              Run research briefings and click &ldquo;Save to Memory&rdquo; to build your longitudinal knowledge base.
            </p>
          </div>
        ) : (
          filteredMemories.map((m) => {
            const isEditing = editingId === m.id;

            return (
              <div
                key={m.id}
                className={`glass-panel rounded-xl p-5 transition-all border ${
                  m.pinned ? "border-accent-amber/30 bg-surface-900/80" : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface-950 border border-brand-500 text-sm text-white focus:outline-none"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-surface-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(m.id)}
                        className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-500"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                          {m.topicKey}
                        </span>
                        <h3 className="text-sm font-bold text-white">{m.title}</h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleTogglePin(m)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            m.pinned
                              ? "text-accent-amber bg-accent-amber/10"
                              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                          }`}
                          title={m.pinned ? "Unpin item" : "Pin item to top"}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleStartEdit(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                          title="Edit memory title and content"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteMemory(m.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete memory permanently from IndexedDB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{m.content}</p>

                    {/* Metadata & Origin session */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-800/60 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span>Created: {new Date(m.createdAt).toLocaleDateString()}</span>
                        {m.sourceIds.length > 0 && (
                          <span className="font-mono text-brand-400">
                            Sources: [{m.sourceIds.join(", ")}]
                          </span>
                        )}
                      </div>

                      {m.originSessionId && (
                        <button
                          onClick={() => onOpenSession(m.originSessionId!)}
                          className="flex items-center gap-1 text-brand-400 hover:underline"
                        >
                          <span>Origin Session</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
