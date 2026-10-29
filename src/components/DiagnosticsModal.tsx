"use client";

import React, { useEffect, useState } from "react";
import { X, RefreshCw, CheckCircle2, AlertCircle, Cpu, Globe, Key, Shield } from "lucide-react";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/verify");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setData({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">System Diagnostics & Provider Lock</h2>
            <p className="text-xs text-slate-400">
              Live verification against Nebius Token Factory and Tavily APIs.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Re-verify Integrations</span>
          </button>
        </div>

        {loading && !data ? (
          <div className="py-12 text-center text-xs text-slate-400">Verifying live API endpoints...</div>
        ) : (
          <div className="space-y-5">
            {/* 1. Nebius Token Factory */}
            <div className="p-4 rounded-xl bg-surface-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-accent-emerald" />
                  <span className="text-sm font-semibold text-white">Nebius Token Factory</span>
                </div>
                {data?.nebius?.valid ? (
                  <span className="flex items-center gap-1 text-xs text-accent-emerald font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authenticated & Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Action Required
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Endpoint:</span>
                  <span className="font-mono text-slate-300">https://api.tokenfactory.nebius.com/v1/</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Synthesis Model (Super):</span>
                  <span className="font-mono text-brand-300">{data?.nebius?.superModel || "nvidia/nemotron-3-super-120b-a12b"}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reasoning/Classification (Nano):</span>
                  <span className="font-mono text-brand-300">{data?.nebius?.nanoModel || "nvidia/nemotron-3-nano-30b-a3b"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed mt-2">
                  <span className="text-slate-500">Provider Status: </span>
                  {data?.nebius?.message}
                </div>
              </div>
            </div>

            {/* 2. Tavily Search */}
            <div className="p-4 rounded-xl bg-surface-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-400" />
                  <span className="text-sm font-semibold text-white">Tavily Web Research</span>
                </div>
                {data?.tavily?.valid ? (
                  <span className="flex items-center gap-1 text-xs text-accent-emerald font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authenticated & Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Action Required
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Search Provider:</span>
                  <span className="font-mono text-slate-300">Tavily Search API v1</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed mt-2">
                  <span className="text-slate-500">Provider Status: </span>
                  {data?.tavily?.message}
                </div>
              </div>
            </div>

            {/* Setup Guidance */}
            {(!data?.nebius?.valid || !data?.tavily?.valid) && (
              <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-500/20 text-xs">
                <div className="flex items-center gap-2 font-semibold text-brand-300 mb-2">
                  <Key className="w-4 h-4 text-brand-400" />
                  <span>How to configure API keys</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Create or edit your local <code className="text-brand-300 bg-surface-950 px-1.5 py-0.5 rounded">.env.local</code> file in the project root:
                </p>
                <pre className="p-3 rounded-lg bg-surface-950 text-[11px] font-mono text-slate-200 overflow-x-auto border border-slate-800">
{`NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1/
NEBIUS_API_KEY=your_nebius_api_key
NEBIUS_MODEL_SUPER=nvidia/nemotron-3-super-120b-a12b
NEBIUS_MODEL_NANO=nvidia/nemotron-3-nano-30b-a3b
TAVILY_API_KEY=your_tavily_api_key`}
                </pre>
                <p className="text-[11px] text-slate-400 mt-2">
                  *Notice:* Keys are only read server-side and are never exposed in browser bundles or client source code.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
