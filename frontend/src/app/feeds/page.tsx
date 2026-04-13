"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Search, Filter, ExternalLink, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  summary: string;
  sentiment: number;
  sentiment_label: string;
  topics: string[];
  category: string;
}

// No fallback data - all data comes from the live backend API

function sentimentDot(label: string) {
  switch (label) {
    case "positive": return "bg-green-500";
    case "negative": return "bg-red-400";
    default: return "bg-yellow-500";
  }
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString();
}

export default function FeedsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const fetchData = () => {
      fetch(`${apiBase}/api/v1/news?limit=100`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && Array.isArray(d)) setArticles(d); })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Topbar title="Live Feeds" />

      {/* Toolbar */}
      <div className="p-6 border-b border-stone-300/40 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles by title, source, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#EAE8E2] border border-stone-400/40 rounded-sm py-2 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500 transition-all shadow-inner shadow-stone-300/20"
            />
          </div>
          <button className="flex items-center gap-2 border border-stone-400/40 bg-[#EAE8E2] px-3 py-2 rounded-sm text-sm font-medium text-stone-700 hover:bg-stone-300/30 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="border border-stone-400/40 bg-[#EAE8E2] px-4 py-2 rounded-sm text-sm font-medium text-stone-700 hover:bg-stone-300/30 transition-colors shadow-sm">
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-[#EAE8E2] z-10 border-b border-stone-300/60">
            <tr>
              <th className="py-3 px-6 font-medium text-[10px] uppercase tracking-widest text-stone-500" style={{ letterSpacing: "-0.025em" }}>Article</th>
              <th className="py-3 px-6 font-medium text-[10px] uppercase tracking-widest text-stone-500" style={{ letterSpacing: "-0.025em" }}>Source</th>
              <th className="py-3 px-6 font-medium text-[10px] uppercase tracking-widest text-stone-500" style={{ letterSpacing: "-0.025em" }}>Sentiment</th>
              <th className="py-3 px-6 font-medium text-[10px] uppercase tracking-widest text-stone-500" style={{ letterSpacing: "-0.025em" }}>Topics</th>
              <th className="py-3 px-6 font-medium text-[10px] uppercase tracking-widest text-stone-500" style={{ letterSpacing: "-0.025em" }}>Time</th>
              <th className="py-3 px-6 w-12"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-stone-300/40">
            {filtered.map((article) => (
              <tr key={article.id} className="hover:bg-stone-300/20 transition-colors group">
                <td className="py-4 px-6 max-w-xs">
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-medium text-stone-900 tracking-tight truncate block hover:text-stone-600 transition-colors">
                    {article.title}
                  </a>
                  <p className="text-xs text-stone-500 mt-0.5 truncate">{article.summary}</p>
                </td>
                <td className="py-4 px-6">
                  <span className="text-stone-700">{article.source}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${sentimentDot(article.sentiment_label)}`} />
                    <span className="font-medium text-stone-800">{(article.sentiment * 100).toFixed(0)}</span>
                    <span className="text-xs text-stone-500 capitalize">{article.sentiment_label}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-1 flex-wrap">
                    {article.topics.slice(0, 2).map((t) => (
                      <span key={t} className="inline-flex items-center bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded text-[10px] border border-stone-300/50">
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1 text-stone-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatTime(article.published_at)}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity inline-block">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="h-14 border-t border-stone-300/60 px-6 flex items-center justify-between shrink-0 bg-[#EAE8E2]">
        <span className="text-xs text-stone-500 font-medium tracking-wide">
          Showing {filtered.length} of {articles.length} articles
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            className="w-8 h-8 flex items-center justify-center rounded border border-stone-300/60 text-stone-400 hover:bg-stone-200 hover:text-stone-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 flex items-center justify-center rounded border border-stone-300/60 text-xs transition-colors ${
                page === p ? "text-stone-800 bg-stone-200 font-medium" : "text-stone-600 hover:bg-stone-200"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            className="w-8 h-8 flex items-center justify-center rounded border border-stone-300/60 text-stone-600 hover:bg-stone-200 hover:text-stone-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
