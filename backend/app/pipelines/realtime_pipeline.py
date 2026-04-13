"""Real-time pipeline orchestrator.

Coordinates the full data flow:
1. Feed ingestion (feedparser + trafilatura)
2. Sentiment analysis (VADER)
3. Trend detection (TF-IDF clustering)
4. Signal detection (River ADWIN + anomaly)
5. Topic assignment

Runs on a configurable schedule via APScheduler.
"""

import logging
from collections import Counter, defaultdict
from datetime import datetime, timezone

from app.models.schemas import (
    NewsArticle, TrendItem, SignalItem, FeedSource,
    DashboardStats, CategoryCount, HourlyVolume, RecentArticle, RecentTrend,
)
from app.services.feed_ingestion import fetch_all_feeds, DEFAULT_FEEDS
from app.services.sentiment import enrich_articles_with_sentiment
from app.services.trend_detection import detect_trends, extract_topics_for_article
from app.services.signal_detection import run_all_detectors

logger = logging.getLogger(__name__)


class PipelineState:
    """In-memory state for the real-time pipeline."""

    def __init__(self):
        self.articles: list[NewsArticle] = []
        self.trends: list[TrendItem] = []
        self.signals: list[SignalItem] = []
        self.feed_sources: list[FeedSource] = []
        self.last_run: str = ""
        self.run_count: int = 0
        self._article_ids: set[str] = set()
        self._hourly_counts: dict[str, int] = defaultdict(int)

        # Initialize feed sources
        for i, feed in enumerate(DEFAULT_FEEDS):
            self.feed_sources.append(FeedSource(
                id=str(i + 1),
                name=feed["name"],
                url=feed["url"],
                type=feed.get("type", "rss"),
                status="active",
                last_fetched="Never",
                article_count=0,
            ))

    def add_articles(self, new_articles: list[NewsArticle]) -> int:
        """Add new articles, deduplicating by ID. Returns count of truly new articles."""
        added = 0
        for article in new_articles:
            if article.id not in self._article_ids:
                self._article_ids.add(article.id)
                self.articles.append(article)
                added += 1

                # Track hourly volume
                hour_key = datetime.now(timezone.utc).strftime("%H:00")
                self._hourly_counts[hour_key] += 1

        # Keep only last 1000 articles
        if len(self.articles) > 1000:
            removed = self.articles[:-1000]
            for a in removed:
                self._article_ids.discard(a.id)
            self.articles = self.articles[-1000:]

        return added

    def get_dashboard_stats(self) -> DashboardStats:
        """Compute dashboard statistics from current state."""
        now = datetime.now(timezone.utc)

        # Category counts
        category_counter = Counter(a.category for a in self.articles)
        top_categories = [
            CategoryCount(name=name, count=count)
            for name, count in category_counter.most_common(6)
        ]

        # Hourly volume (last 24h)
        hourly_volume = []
        for h in range(24):
            key = f"{h:02d}:00"
            hourly_volume.append(HourlyVolume(hour=key, count=self._hourly_counts.get(key, 0)))

        # Recent articles
        recent_articles = [
            RecentArticle(
                id=a.id,
                title=a.title,
                source=a.source,
                published_at=a.published_at,
                sentiment_label=a.sentiment_label,
                category=a.category,
            )
            for a in self.articles[:10]
        ]

        # Recent trends
        recent_trends = [
            RecentTrend(
                id=t.id,
                topic=t.topic,
                trend_score=t.trend_score,
                trend_direction=t.trend_direction,
                article_count=t.article_count,
            )
            for t in self.trends[:6]
        ]

        # Average sentiment
        sentiments = [a.sentiment for a in self.articles if a.sentiment != 0]
        avg_sentiment = sum(sentiments) / max(1, len(sentiments))

        return DashboardStats(
            total_articles=len(self.articles),
            active_trends=len(self.trends),
            active_signals=len(self.signals),
            feed_sources=len(self.feed_sources),
            articles_today=len(self.articles),
            avg_sentiment=round((avg_sentiment + 1) / 2, 2),  # Normalize to 0-1
            top_categories=top_categories,
            hourly_volume=hourly_volume,
            recent_articles=recent_articles,
            recent_trends=recent_trends,
        )


# Global pipeline state
state = PipelineState()


def run_pipeline():
    """Execute one full pipeline cycle."""
    logger.info("=== Pipeline run #%d starting ===", state.run_count + 1)

    # Step 1: Ingest feeds
    raw_articles = fetch_all_feeds()
    logger.info("Ingested %d raw articles", len(raw_articles))

    # Step 2: Sentiment analysis
    enriched = enrich_articles_with_sentiment(raw_articles)

    # Step 3: Detect trends
    all_articles = state.articles + enriched
    trends = detect_trends(all_articles[-200:])  # Use recent articles for trend detection
    state.trends = trends

    # Step 4: Assign topics to articles
    for article in enriched:
        article.topics = extract_topics_for_article(article, trends)

    # Step 5: Add new articles to state
    new_count = state.add_articles(enriched)

    # Step 6: Detect signals
    signals = run_all_detectors(enriched, trends)
    state.signals = signals

    # Update feed source stats
    source_counts = Counter(a.source for a in enriched)
    for feed in state.feed_sources:
        if feed.name in source_counts:
            feed.article_count += source_counts[feed.name]
            feed.last_fetched = datetime.now(timezone.utc).strftime("%H:%M:%S")

    state.last_run = datetime.now(timezone.utc).isoformat()
    state.run_count += 1

    logger.info(
        "=== Pipeline run complete: %d new articles, %d trends, %d signals ===",
        new_count, len(trends), len(signals),
    )
