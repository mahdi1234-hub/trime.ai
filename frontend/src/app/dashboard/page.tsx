"use client";

import { Topbar } from "@/components/layout/Topbar";
import {
  Newspaper,
  TrendingUp,
  Radio,
  Rss,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardData {
  total_articles: number;
  active_trends: number;
  active_signals: number;
  feed_sources: number;
  articles_today: number;
  avg_sentiment: number;
  top_categories: { name: string; count: number }[];
  hourly_volume: { hour: string; count: number }[];
  recent_articles: {
    id: string;
    title: string;
    source: string;
    published_at: string;
    sentiment_label: string;
    category: string;
  }[];
  recent_trends: {
    id: string;
    topic: string;
    trend_score: number;
    trend_direction: string;
    article_count: number;
  }[];
}

const emptyData: DashboardData = {
  total_articles: 0,
  active_trends: 0,
  active_signals: 0,
  feed_sources: 0,
  articles_today: 0,
  avg_sentiment: 0.5,
  top_categories: [],
  hourly_volume: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    count: 0,
  })),
  recent_articles: [],
  recent_trends: [],
};

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext: string;
}) {
  return (
    <div className="border border-stone-300/60 rounded-sm bg-[#EAE8E2] p-5 hover:bg-stone-300/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 text-stone-500" />
        <span
          className="text-[10px] uppercase tracking-widest text-stone-400 font-medium"
          style={{ letterSpacing: "-0.025em" }}
        >
          {label}
        </span>
      </div>
      <p className="text-2xl font-light text-stone-900 font-display tracking-display">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-stone-500 mt-1">{subtext}</p>
    </div>
  );
}

function sentimentColor(label: string) {
  switch (label) {
    case "positive":
      return "bg-green-500";
    case "negative":
      return "bg-red-400";
    default:
      return "bg-yellow-500";
  }
}

function trendDirectionIcon(dir: string) {
  if (dir === "rising")
    return <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />;
  if (dir === "falling")
    return <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />;
  return <Clock className="w-3.5 h-3.5 text-yellow-600" />;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiBase}/api/v1/dashboard`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxVolume = Math.max(...data.hourly_volume.map((h) => h.count));

  return (
    <>
      <Topbar title="Dashboard" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Newspaper}
            label="Total Articles"
            value={data.total_articles}
            subtext={`${data.articles_today} today`}
          />
          <StatCard
            icon={TrendingUp}
            label="Active Trends"
            value={data.active_trends}
            subtext="Detected this session"
          />
          <StatCard
            icon={Radio}
            label="Live Signals"
            value={data.active_signals}
            subtext="Anomalies & drifts"
          />
          <StatCard
            icon={Rss}
            label="Feed Sources"
            value={data.feed_sources}
            subtext="RSS, Web, API"
          />
        </div>

        {/* Chart + Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hourly volume chart */}
          <div className="lg:col-span-2 border border-stone-300/60 rounded-sm bg-[#EAE8E2] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-light text-stone-900 font-display"
                style={{ letterSpacing: "-0.05em" }}
              >
                Hourly Volume
              </h3>
              <span
                className="text-[10px] uppercase tracking-widest text-stone-400 font-medium"
                style={{ letterSpacing: "-0.025em" }}
              >
                Last 24h
              </span>
            </div>
            <div className="flex items-end gap-[3px] h-32">
              {data.hourly_volume.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-stone-400/30 hover:bg-stone-900/60 transition-colors rounded-t-sm cursor-pointer relative group"
                  style={{ height: `${(h.count / maxVolume) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-[#EAE8E2] text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {h.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-stone-400">00:00</span>
              <span className="text-[10px] text-stone-400">12:00</span>
              <span className="text-[10px] text-stone-400">23:00</span>
            </div>
          </div>

          {/* Categories */}
          <div className="border border-stone-300/60 rounded-sm bg-[#EAE8E2] p-5">
            <h3
              className="text-lg font-light text-stone-900 font-display mb-4"
              style={{ letterSpacing: "-0.05em" }}
            >
              Top Categories
            </h3>
            <div className="space-y-3">
              {data.top_categories.map((cat) => {
                const maxCat = Math.max(
                  ...data.top_categories.map((c) => c.count)
                );
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-700 font-medium">
                        {cat.name}
                      </span>
                      <span className="text-stone-500">
                        {cat.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-300/40 rounded-full">
                      <div
                        className="h-full bg-stone-700 rounded-full transition-all"
                        style={{
                          width: `${(cat.count / maxCat) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Articles + Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent articles */}
          <div className="border border-stone-300/60 rounded-sm bg-[#EAE8E2]">
            <div className="p-5 border-b border-stone-300/40 flex items-center justify-between">
              <h3
                className="text-lg font-light text-stone-900 font-display"
                style={{ letterSpacing: "-0.05em" }}
              >
                Recent Articles
              </h3>
              <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded border border-stone-300/50">
                Live
              </span>
            </div>
            <div className="divide-y divide-stone-300/40">
              {data.recent_articles.map((article) => (
                <div
                  key={article.id}
                  className="px-5 py-3 hover:bg-stone-300/20 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 tracking-tight truncate group-hover:text-stone-700">
                        {article.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-stone-500">
                          {article.source}
                        </span>
                        <span className="text-stone-300">|</span>
                        <span className="text-xs text-stone-400">
                          {article.published_at}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${sentimentColor(article.sentiment_label)}`}
                      />
                      <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded border border-stone-300/50">
                        {article.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending topics */}
          <div className="border border-stone-300/60 rounded-sm bg-[#EAE8E2]">
            <div className="p-5 border-b border-stone-300/40 flex items-center justify-between">
              <h3
                className="text-lg font-light text-stone-900 font-display"
                style={{ letterSpacing: "-0.05em" }}
              >
                Trending Topics
              </h3>
              <span
                className="text-[10px] uppercase tracking-widest text-stone-400 font-medium"
                style={{ letterSpacing: "-0.025em" }}
              >
                Real-time
              </span>
            </div>
            <div className="divide-y divide-stone-300/40">
              {data.recent_trends.map((trend) => (
                <div
                  key={trend.id}
                  className="px-5 py-4 hover:bg-stone-300/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {trendDirectionIcon(trend.trend_direction)}
                      <div>
                        <p className="text-sm font-medium text-stone-900 tracking-tight">
                          {trend.topic}
                        </p>
                        <p className="text-xs text-stone-500">
                          {trend.article_count} articles
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-800 text-sm">
                        {trend.trend_score}
                      </span>
                      <span className="text-xs text-stone-500 capitalize">
                        {trend.trend_direction}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sentiment gauge */}
        <div className="border border-stone-300/60 rounded-sm bg-[#EAE8E2] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-lg font-light text-stone-900 font-display"
              style={{ letterSpacing: "-0.05em" }}
            >
              Average Sentiment
            </h3>
            <span className="text-sm text-stone-500">
              {(data.avg_sentiment * 100).toFixed(0)}% positive
            </span>
          </div>
          <div className="w-full h-2 bg-stone-300/40 rounded-full">
            <div
              className="h-full rounded-full transition-all bg-gradient-to-r from-red-400 via-yellow-400 to-green-500"
              style={{ width: `${data.avg_sentiment * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-stone-400">Negative</span>
            <span className="text-[10px] text-stone-400">Neutral</span>
            <span className="text-[10px] text-stone-400">Positive</span>
          </div>
        </div>
      </div>
    </>
  );
}
