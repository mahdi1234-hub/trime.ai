"""Pydantic models for all API data structures."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NewsArticle(BaseModel):
    id: str
    title: str
    source: str
    url: str
    published_at: str
    summary: str
    sentiment: float = Field(default=0.0, ge=-1.0, le=1.0)
    sentiment_label: str = "neutral"
    topics: list[str] = []
    category: str = "General"


class TrendItem(BaseModel):
    id: str
    topic: str
    keywords: list[str] = []
    article_count: int = 0
    trend_score: float = 0.0
    trend_direction: str = "stable"  # rising, stable, falling
    first_seen: str = ""
    last_updated: str = ""
    sample_titles: list[str] = []


class SignalItem(BaseModel):
    id: str
    signal_type: str
    description: str
    severity: str = "low"  # low, medium, high, critical
    detected_at: str = ""
    source_count: int = 0
    related_topics: list[str] = []
    is_anomaly: bool = False
    drift_score: float = 0.0


class FeedSource(BaseModel):
    id: str
    name: str
    url: str
    type: str = "rss"  # rss, web, api
    status: str = "active"  # active, paused, error
    last_fetched: str = ""
    article_count: int = 0


class CategoryCount(BaseModel):
    name: str
    count: int


class HourlyVolume(BaseModel):
    hour: str
    count: int


class RecentArticle(BaseModel):
    id: str
    title: str
    source: str
    published_at: str
    sentiment_label: str
    category: str


class RecentTrend(BaseModel):
    id: str
    topic: str
    trend_score: float
    trend_direction: str
    article_count: int


class DashboardStats(BaseModel):
    total_articles: int = 0
    active_trends: int = 0
    active_signals: int = 0
    feed_sources: int = 0
    articles_today: int = 0
    avg_sentiment: float = 0.0
    top_categories: list[CategoryCount] = []
    hourly_volume: list[HourlyVolume] = []
    recent_articles: list[RecentArticle] = []
    recent_trends: list[RecentTrend] = []
