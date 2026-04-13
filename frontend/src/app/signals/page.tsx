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

const fallbackSignals: Signal[] = [
  {
    id: "1", signal_type: "Volume Spike", description: "Unusual surge in articles about AI regulation - 3.2x above baseline volume in the last 2 hours",
    severity: "high", detected_at: "2025-06-15T10:15:00Z", source_count: 47,
    related_topics: ["AI Regulation", "EU Parliament", "Tech Policy"], is_anomaly: true, drift_score: 0.87,
  },
  {
    id: "2", signal_type: "Sentiment Shift", description: "Significant negative sentiment drift detected in cryptocurrency coverage - shifted from 0.6 to -0.3 in 4 hours",
    severity: "medium", detected_at: "2025-06-15T09:45:00Z", source_count: 23,
    related_topics: ["Cryptocurrency", "Bitcoin", "Market Crash"], is_anomaly: false, drift_score: 0.65,
  },
  {
    id: "3", signal_type: "New Topic Burst", description: "Previously untracked topic cluster emerged: 'quantum computing breakthrough' with rapid article accumulation",
    severity: "medium", detected_at: "2025-06-15T09:20:00Z", source_count: 31,
    related_topics: ["Quantum Computing", "MIT", "Research"], is_anomaly: true, drift_score: 0.72,
  },
  {
    id: "4", signal_type: "Source Anomaly", description: "Reuters publishing frequency 5x normal rate on climate topics - possible breaking event",
    severity: "critical", detected_at: "2025-06-15T08:00:00Z", source_count: 12,
    related_topics: ["Climate", "Reuters", "Breaking News"], is_anomaly: true, drift_score: 0.94,
  },
  {
    id: "5", signal_type: "Concept Drift", description: "Topic model detected semantic drift in 'interest rates' cluster - new subtopics emerging around housing market",
    severity: "low", detected_at: "2025-06-15T07:30:00Z", source_count: 18,
    related_topics: ["Interest Rates", "Housing", "Mortgage"], is_anomaly: false, drift_score: 0.41,
  },
  {
    id: "6", signal_type: "Cross-Topic Correlation", description: "Unusual correlation detected between 'cybersecurity' and 'healthcare' topic clusters - possible coordinated attack coverage",
    severity: "high", detected_at: "2025-06-15T06:45:00Z", source_count: 29,
    related_topics: ["Cybersecurity", "Healthcare", "Data Breach"], is_anomaly: true, drift_score: 0.78,
  },
];

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
  const [signals, setSignals] = useState<Signal[]>(fallbackSignals);

  useEffect(() => {
    fetch("/api/v1/signals")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d)) setSignals(d); })
      .catch(() => {});
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
