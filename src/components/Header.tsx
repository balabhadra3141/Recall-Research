"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, AlertCircle, Cpu, Command } from "lucide-react";

interface HeaderProps {
  onOpenDiagnostics: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDiagnostics }) => {
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
    <header className="border-b border-slate-800/80 bg-surface-950/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 flex items-center justify-center shadow-glow shrink-0">
            <div className="w-full h-full bg-surface-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Recall Research
              </h1>
              <span className="hidden sm:inline-flex text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                NVIDIA Nemotron
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-xs sm:max-w-none">
              Research that remembers. Evidence that evolves.
            </p>
          </div>
        </div>

        {/* Integration Status Indicators & Diagnostics */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Keyboard shortcut hint */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 px-2.5 py-1 rounded-lg bg-surface-900 border border-slate-800">
            <Command className="w-3 h-3 text-slate-400" />
            <span>K</span>
            <span className="text-slate-600">to search</span>
          </div>

          {/* Model indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-900 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-accent-emerald" />
            <span className="text-slate-400">Model:</span>
            <span
              className="font-mono text-slate-200 text-[11px] truncate max-w-[170px]"
              title={providerStatus.superModel}
            >
              {providerStatus.superModel.replace("nvidia/", "")}
            </span>
          </div>

          {/* Diagnostics Button */}
          <button
            onClick={onOpenDiagnostics}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              providerStatus.ready
                ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/30 hover:bg-accent-emerald/20 shadow-sm"
                : providerStatus.nebiusConfigured || providerStatus.tavilyConfigured
                ? "bg-accent-amber/10 text-accent-amber border-accent-amber/30 hover:bg-accent-amber/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
            }`}
            title="Inspect Nebius Token Factory & Tavily Integration Status"
          >
            {providerStatus.ready ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
            )}
            <span className="hidden xs:inline">
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
