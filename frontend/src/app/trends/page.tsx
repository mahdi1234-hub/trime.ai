"use client";

import { Topbar } from "@/components/layout/Topbar";
import { ArrowUpRight, ArrowDownRight, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Trend {
  id: string;
  topic: string;
  keywords: string[];
  article_count: number;
  trend_score: number;
  trend_direction: "rising" | "stable" | "falling";
  first_seen: string;
  last_updated: string;
  sample_titles: string[];
}

const fallbackTrends: Trend[] = [
  {
    id: "1", topic: "AI Regulation", keywords: ["artificial intelligence", "regulation", "EU", "governance"],
    article_count: 187, trend_score: 94, trend_direction: "rising",
    first_seen: "2025-06-10T08:00:00Z", last_updated: "2025-06-15T10:30:00Z",
    sample_titles: ["EU Parliament Advances AI Act", "US Considers AI Oversight Framework", "China Updates AI Governance Rules"],
  },
  {
    id: "2", topic: "Quantum Computing", keywords: ["quantum", "qubits", "computing", "MIT"],
    article_count: 124, trend_score: 87, trend_direction: "rising",
    first_seen: "2025-06-12T14:00:00Z", last_updated: "2025-06-15T09:15:00Z",
    sample_titles: ["1000-Qubit Breakthrough at MIT", "Google Announces Quantum Advantage", "IBM Quantum Roadmap Update"],
  },
  {
    id: "3", topic: "Climate Policy", keywords: ["climate", "carbon", "emissions", "policy"],
    article_count: 95, trend_score: 72, trend_direction: "stable",
    first_seen: "2025-06-08T06:00:00Z", last_updated: "2025-06-15T07:30:00Z",
    sample_titles: ["G7 Climate Commitments Review", "Carbon Market Reforms Proposed", "New Arctic Ice Data Released"],
  },
  {
    id: "4", topic: "Interest Rates", keywords: ["federal reserve", "rates", "inflation", "monetary"],
    article_count: 78, trend_score: 68, trend_direction: "falling",
    first_seen: "2025-06-05T12:00:00Z", last_updated: "2025-06-15T06:00:00Z",
    sample_titles: ["Fed Signals Rate Cut", "Inflation Cools to 2.3%", "Bond Markets React to Fed Guidance"],
  },
  {
    id: "5", topic: "Space Exploration", keywords: ["spacex", "mars", "starship", "nasa"],
    article_count: 65, trend_score: 81, trend_direction: "rising",
    first_seen: "2025-06-14T20:00:00Z", last_updated: "2025-06-14T22:00:00Z",
    sample_titles: ["Starship Test Flight Success", "NASA Artemis III Update", "Mars Colony Timeline Revised"],
  },
  {
    id: "6", topic: "Cybersecurity Threats", keywords: ["cyber", "vulnerability", "zero-day", "ransomware"],
    article_count: 52, trend_score: 76, trend_direction: "rising",
    first_seen: "2025-06-14T18:00:00Z", last_updated: "2025-06-14T20:15:00Z",
    sample_titles: ["Critical Cloud Vulnerability Disclosed", "Ransomware Attacks Surge 40%", "New State-Sponsored Campaign Detected"],
  },
];

function directionIcon(dir: string) {
  if (dir === "rising") return <ArrowUpRight className="w-4 h-4 text-green-600" />;
  if (dir === "falling") return <ArrowDownRight className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-yellow-600" />;
}

function scoreColor(score: number) {
  if (score >= 80) return "text-green-700 bg-green-100 border-green-200";
  if (score >= 60) return "text-yellow-700 bg-yellow-100 border-yellow-200";
  return "text-stone-600 bg-stone-100 border-stone-200";
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>(fallbackTrends);

  useEffect(() => {
    fetch("/api/v1/trends")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d)) setTrends(d); })
      .catch(() => {});
  }, []);

  return (
    <>
      <Topbar title="Trends" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-light text-stone-900 font-display" style={{ letterSpacing: "-0.05em" }}>
              Detected Trends
            </h2>
            <p className="text-sm text-stone-500 mt-1">Topics emerging from real-time news analysis via BERTopic</p>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium flex items-center gap-1.5" style={{ letterSpacing: "-0.025em" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft" />
            Real-time
          </span>
        </div>

        <div className="space-y-4">
          {trends.map((trend) => (
            <div key={trend.id} className="border border-stone-300/60 rounded-sm bg-[#EAE8E2] hover:bg-stone-300/20 transition-colors cursor-pointer">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {directionIcon(trend.trend_direction)}
                    <div>
                      <h3 className="text-base font-medium text-stone-900 tracking-tight">{trend.topic}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{trend.article_count} articles tracked</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${scoreColor(trend.trend_score)}`}>
                    Score: {trend.trend_score}
                  </div>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {trend.keywords.map((kw) => (
                    <span key={kw} className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded border border-stone-300/50">
                      {kw}
                    </span>
                  ))}
                </div>

                {/* Sample titles */}
                <div className="space-y-1">
                  {trend.sample_titles.map((title, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-stone-600">
                      <TrendingUp className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{title}</span>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-4 mt-3 text-[10px] text-stone-400">
                  <span>First seen: {new Date(trend.first_seen).toLocaleDateString()}</span>
                  <span>Last updated: {new Date(trend.last_updated).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
