const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://backend-five-mocha-89.vercel.app";

export interface NewsItem {
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

export interface TrendItem {
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

export interface SignalItem {
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

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  type: "rss" | "web" | "api";
  status: "active" | "paused" | "error";
  last_fetched: string;
  article_count: number;
}

export interface DashboardStats {
  total_articles: number;
  active_trends: number;
  active_signals: number;
  feed_sources: number;
  articles_today: number;
  avg_sentiment: number;
  top_categories: { name: string; count: number }[];
  hourly_volume: { hour: string; count: number }[];
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getDashboard: () => fetchApi<DashboardStats>("/dashboard"),
  getNews: (limit = 50) => fetchApi<NewsItem[]>(`/news?limit=${limit}`),
  getTrends: () => fetchApi<TrendItem[]>("/trends"),
  getSignals: () => fetchApi<SignalItem[]>("/signals"),
  getFeeds: () => fetchApi<FeedSource[]>("/feeds"),
};
