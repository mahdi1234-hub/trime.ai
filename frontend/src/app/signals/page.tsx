"use client";

import { Topbar } from "@/components/layout/Topbar";
import { AlertTriangle, Activity, Zap, Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface Signal {
  id: string;
  signal_type: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  detected_at: string;
  source_count: number;
  related_topics: string[];
  is_anomaly: boolean;
  drift_score: number;
}

// No fallback data - all data comes from the live backend API

function severityStyle(sev: string) {
  switch (sev) {
    case "critical": return "bg-red-100 text-red-800 border-red-200";
    case "high": return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default: return "bg-stone-100 text-stone-600 border-stone-200";
  }
}

function severityIcon(sev: string) {
  switch (sev) {
    case "critical": return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case "high": return <Zap className="w-5 h-5 text-orange-500" />;
    case "medium": return <Activity className="w-5 h-5 text-yellow-600" />;
    default: return <Shield className="w-5 h-5 text-stone-400" />;
  }
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://backend-five-mocha-89.vercel.app";
    const fetchData = () => {
      fetch(`${apiBase}/api/v1/signals`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && Array.isArray(d)) setSignals(d); })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Topbar title="Signals" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-light text-stone-900 font-display" style={{ letterSpacing: "-0.05em" }}>
              Active Signals
            </h2>
            <p className="text-sm text-stone-500 mt-1">Anomalies, drift detection & burst alerts via River + PySAD</p>
          </div>
          <div className="flex items-center gap-2">
            {["critical", "high", "medium", "low"].map((sev) => {
              const count = signals.filter((s) => s.severity === sev).length;
              return (
                <span key={sev} className={`text-[10px] px-2 py-0.5 rounded border font-medium ${severityStyle(sev)}`}>
                  {count} {sev}
                </span>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {signals.map((signal) => (
            <div key={signal.id} className="border border-stone-300/60 rounded-sm bg-[#EAE8E2] hover:bg-stone-300/20 transition-colors">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">{severityIcon(signal.severity)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-medium text-stone-900 tracking-tight">{signal.signal_type}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${severityStyle(signal.severity)}`}>
                        {signal.severity}
                      </span>
                      {signal.is_anomaly && (
                        <span className="text-[10px] bg-stone-900 text-[#EAE8E2] px-1.5 py-0.5 rounded">
                          Anomaly
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 mb-2">{signal.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-1">
                        {signal.related_topics.map((t) => (
                          <span key={t} className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded border border-stone-300/50">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-stone-400">
                      <span>{signal.source_count} sources</span>
                      <span>Drift: {(signal.drift_score * 100).toFixed(0)}%</span>
                      <span>{new Date(signal.detected_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Drift score bar */}
                  <div className="w-24 shrink-0">
                    <div className="text-[10px] text-stone-400 mb-1 text-right">Drift Score</div>
                    <div className="w-full h-1.5 bg-stone-300/40 rounded-full">
                      <div
                        className="h-full rounded-full bg-stone-700 transition-all"
                        style={{ width: `${signal.drift_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
