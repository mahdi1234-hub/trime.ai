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

// No fallback data - all data comes from the live backend API

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
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const fetchData = () => {
      fetch(`${apiBase}/api/v1/trends`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && Array.isArray(d)) setTrends(d); })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
