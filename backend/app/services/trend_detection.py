"""Trend detection service using TF-IDF + clustering for real-time topic discovery.

Uses scikit-learn for lightweight topic modeling inspired by BERTopic's approach:
TF-IDF vectorization -> clustering -> topic extraction.
For production, swap in BERTopic with `partial_fit` for true online topic modeling.
"""

import hashlib
import logging
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import MiniBatchKMeans

from app.models.schemas import NewsArticle, TrendItem

logger = logging.getLogger(__name__)

# Online-capable vectorizer and clusterer
_vectorizer = TfidfVectorizer(
    max_features=5000,
    stop_words="english",
    max_df=0.95,
    min_df=2,
    ngram_range=(1, 2),
)
_clusterer = MiniBatchKMeans(n_clusters=10, random_state=42, batch_size=50)
_fitted = False

# Track topic history for trend direction
_topic_history: dict[str, list[int]] = defaultdict(list)


def _extract_top_keywords(tfidf_matrix, feature_names: list[str], labels: np.ndarray, n_keywords: int = 6) -> dict[int, list[str]]:
    """Extract top keywords per cluster from TF-IDF matrix."""
    cluster_keywords = {}
    for cluster_id in set(labels):
        if cluster_id == -1:
            continue
        cluster_mask = labels == cluster_id
        cluster_tfidf = tfidf_matrix[cluster_mask].mean(axis=0)
        cluster_array = np.asarray(cluster_tfidf).flatten()
        top_indices = cluster_array.argsort()[-n_keywords:][::-1]
        keywords = [feature_names[i] for i in top_indices if cluster_array[i] > 0]
        cluster_keywords[cluster_id] = keywords
    return cluster_keywords


def _compute_trend_direction(topic_key: str, current_count: int) -> str:
    """Determine trend direction based on article count history."""
    history = _topic_history[topic_key]
    history.append(current_count)
    if len(history) > 10:
        history.pop(0)

    if len(history) < 2:
        return "stable"

    recent_avg = sum(history[-3:]) / min(3, len(history[-3:]))
    older_avg = sum(history[:-3]) / max(1, len(history[:-3])) if len(history) > 3 else recent_avg

    if recent_avg > older_avg * 1.2:
        return "rising"
    elif recent_avg < older_avg * 0.8:
        return "falling"
    return "stable"


def detect_trends(articles: list[NewsArticle]) -> list[TrendItem]:
    """Detect trending topics from a collection of articles.
    
    Uses TF-IDF vectorization + MiniBatchKMeans clustering to find topic clusters,
    then extracts keywords and computes trend scores.
    """
    global _fitted

    if len(articles) < 5:
        logger.info("Too few articles (%d) for trend detection", len(articles))
        return []

    # Prepare documents
    documents = [f"{a.title}. {a.summary}" for a in articles]

    try:
        # Fit or partial-fit the vectorizer
        tfidf_matrix = _vectorizer.fit_transform(documents)
        feature_names = _vectorizer.get_feature_names_out().tolist()

        # Adjust n_clusters based on document count
        n_clusters = min(10, max(3, len(documents) // 5))
        _clusterer.n_clusters = n_clusters
        labels = _clusterer.fit_predict(tfidf_matrix)

        # Extract keywords per cluster
        cluster_keywords = _extract_top_keywords(tfidf_matrix, feature_names, labels)

        # Build trend items
        trends = []
        cluster_articles: dict[int, list[NewsArticle]] = defaultdict(list)
        for idx, label in enumerate(labels):
            cluster_articles[label].append(articles[idx])

        for cluster_id, cluster_arts in cluster_articles.items():
            keywords = cluster_keywords.get(cluster_id, [])
            if not keywords:
                continue

            # Topic name from top keywords
            topic_name = " ".join(keywords[:2]).title()
            article_count = len(cluster_arts)

            # Trend score: combination of article count and recency
            recency_boost = sum(1 for a in cluster_arts if "ago" in a.published_at or "min" in a.published_at) / max(1, article_count)
            base_score = min(100, int((article_count / max(1, len(articles))) * 200 + recency_boost * 30))

            # Track direction
            direction = _compute_trend_direction(topic_name, article_count)

            # Get sample titles
            sample_titles = [a.title for a in cluster_arts[:3]]

            # Find date range
            dates = [a.published_at for a in cluster_arts if a.published_at]
            first_seen = min(dates) if dates else datetime.now(timezone.utc).isoformat()
            last_updated = max(dates) if dates else datetime.now(timezone.utc).isoformat()

            trend_id = hashlib.md5(topic_name.encode()).hexdigest()[:12]

            trends.append(TrendItem(
                id=trend_id,
                topic=topic_name,
                keywords=keywords,
                article_count=article_count,
                trend_score=base_score,
                trend_direction=direction,
                first_seen=first_seen,
                last_updated=last_updated,
                sample_titles=sample_titles,
            ))

        # Sort by trend score
        trends.sort(key=lambda t: t.trend_score, reverse=True)
        _fitted = True
        logger.info("Detected %d trends from %d articles", len(trends), len(articles))
        return trends

    except Exception as exc:
        logger.error("Trend detection failed: %s", exc)
        return []


def extract_topics_for_article(article: NewsArticle, all_trends: list[TrendItem]) -> list[str]:
    """Assign topic tags to an article based on detected trends."""
    text = f"{article.title} {article.summary}".lower()
    topics = []
    for trend in all_trends:
        matching = sum(1 for kw in trend.keywords if kw.lower() in text)
        if matching >= 2:
            topics.append(trend.topic)
    return topics[:5]
