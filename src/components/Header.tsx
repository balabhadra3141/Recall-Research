"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Database, ShieldCheck, AlertCircle, RefreshCw, Cpu } from "lucide-react";

interface HeaderProps {
  onOpenDiagnostics: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDiagnostics, activeView }) => {
  const [providerStatus, setProviderStatus] = useState<{
    nebiusConfigured: boolean;
    tavilyConfigured: boolean;
    ready: boolean;
    superModel: string;
    loading: boolean;
  }>({
    nebiusConfigured: false,
    tavilyConfigured: false,
    ready: false,
    superModel: "nvidia/nemotron-3-super-120b-a12b",
    loading: true,
  });

  const checkStatus = async () => {
    try {
      setProviderStatus((prev) => ({ ...prev, loading: true }));
      const res = await fetch("/api/verify");
      if (res.ok) {
        const data = await res.json();
        setProviderStatus({
          nebiusConfigured: data.nebius.configured,
          tavilyConfigured: data.tavily.configured,
          ready: data.readyForResearch,
          superModel: data.nebius.superModel || "nvidia/nemotron-3-super-120b-a12b",
          loading: false,
        });
      } else {
        setProviderStatus((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setProviderStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <header className="border-b border-slate-800 bg-surface-950/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 flex items-center justify-center shadow-glow">
            <div className="w-full h-full bg-surface-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Recall Research
              </h1>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                NVIDIA Nemotron
              </span>
            </div>
            <p className="text-xs text-slate-400">Research that remembers. Evidence that evolves.</p>
          </div>
        </div>

        {/* Integration Status Indicators & Diagnostics */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-900 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-accent-emerald" />
            <span className="text-slate-400">Nebius Model:</span>
            <span className="font-mono text-slate-200 text-[11px] truncate max-w-[200px]" title={providerStatus.superModel}>
              {providerStatus.superModel.replace("nvidia/", "")}
            </span>
          </div>

          <button
            onClick={onOpenDiagnostics}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              providerStatus.ready
                ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30 hover:bg-accent-emerald/20"
                : providerStatus.nebiusConfigured || providerStatus.tavilyConfigured
                ? "bg-accent-amber/10 text-accent-amber border-accent-amber/30 hover:bg-accent-amber/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
            }`}
            title="Inspect Nebius & Tavily Integration Status"
          >
            {providerStatus.ready ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
            )}
            <span>
              {providerStatus.ready
                ? "Integrations Live"
                : "Credentials / Setup"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
