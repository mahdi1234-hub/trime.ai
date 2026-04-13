"use client";

import { Topbar } from "@/components/layout/Topbar";
import { Rss, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface FeedSource {
  id: string;
  name: string;
  url: string;
  type: "rss" | "web" | "api";
  status: "active" | "paused" | "error";
  last_fetched: string;
  article_count: number;
}

// No fallback data - all data comes from the live backend API

function statusDot(status: string) {
  switch (status) {
    case "active": return "bg-green-500";
    case "paused": return "bg-yellow-500";
    default: return "bg-red-400";
  }
}

export default function SettingsPage() {
  const [feeds, setFeeds] = useState<FeedSource[]>([]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiBase}/api/v1/feeds`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && Array.isArray(d)) setFeeds(d); })
      .catch(() => {});
  }, []);

  return (
    <>
      <Topbar title="Settings" />
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Feed Sources */}
        <div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-2xl font-light text-stone-900 font-display" style={{ letterSpacing: "-0.05em" }}>
                Feed Sources
              </h2>
              <p className="text-sm text-stone-500 mt-1">Manage RSS feeds, web crawlers, and API sources</p>
            </div>
            <button className="bg-stone-900 text-[#EAE8E2] px-4 py-2 rounded-sm text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Source
            </button>
          </div>

          <div className="border border-stone-300/60 rounded-sm bg-[#EAE8E2] divide-y divide-stone-300/40">
            {feeds.map((feed) => (
              <div key={feed.id} className="px-5 py-4 flex items-center justify-between hover:bg-stone-300/20 transition-colors">
                <div className="flex items-center gap-4">
                  <Rss className="w-4 h-4 text-stone-400" />
                  <div>
                    <p className="text-sm font-medium text-stone-900 tracking-tight">{feed.name}</p>
                    <p className="text-xs text-stone-500 truncate max-w-md">{feed.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded border border-stone-300/50 uppercase">{feed.type}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDot(feed.status)}`} />
                    <span className="text-xs text-stone-500 capitalize">{feed.status}</span>
                  </div>
                  <span className="text-xs text-stone-400">{feed.last_fetched}</span>
                  <span className="text-xs text-stone-500 font-medium">{feed.article_count.toLocaleString()} articles</span>
                  <button className="text-stone-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline config */}
        <div>
          <h2 className="text-2xl font-light text-stone-900 font-display mb-4" style={{ letterSpacing: "-0.05em" }}>
            Pipeline Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Polling Interval", value: "5 minutes", desc: "How often feeds are checked for new articles" },
              { label: "Topic Model", value: "BERTopic (Online)", desc: "Real-time topic detection using incremental learning" },
              { label: "Anomaly Detection", value: "River ADWIN + PySAD", desc: "Streaming anomaly and drift detection" },
              { label: "Sentiment Engine", value: "VADER + Transformer", desc: "Hybrid sentiment analysis pipeline" },
            ].map((item) => (
              <div key={item.label} className="border border-stone-300/60 rounded-sm bg-[#EAE8E2] p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-stone-900">{item.label}</span>
                  <span className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded border border-stone-300/50">{item.value}</span>
                </div>
                <p className="text-xs text-stone-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
