"""Signal detection service using River for streaming anomaly and drift detection.

Implements:
- ADWIN (Adaptive Windowing) for concept drift detection
- Half-Space Trees for streaming anomaly detection
- Volume spike detection via statistical thresholds
- Sentiment drift monitoring
"""

import hashlib
import logging
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Optional

from river import drift, anomaly

from app.models.schemas import NewsArticle, SignalItem, TrendItem

logger = logging.getLogger(__name__)

# River streaming detectors
_adwin_volume = drift.ADWIN(delta=0.002)
_adwin_sentiment = drift.ADWIN(delta=0.002)
_anomaly_detector = anomaly.HalfSpaceTrees(
    n_trees=10,
    height=6,
    window_size=100,
    seed=42,
)

# Historical tracking
_volume_history: deque[int] = deque(maxlen=100)
_sentiment_history: deque[float] = deque(maxlen=100)
_source_frequency: dict[str, deque[datetime]] = defaultdict(lambda: deque(maxlen=50))
_topic_correlations: dict[str, set[str]] = defaultdict(set)


def _generate_signal_id(signal_type: str, desc: str) -> str:
    content = f"{signal_type}:{desc}:{datetime.now(timezone.utc).isoformat()}"
    return hashlib.md5(content.encode()).hexdigest()[:12]


def detect_volume_spikes(articles: list[NewsArticle], trends: list[TrendItem]) -> list[SignalItem]:
    """Detect unusual volume spikes in article flow using ADWIN drift detection."""
    signals = []
    current_count = len(articles)
    _volume_history.append(current_count)

    if len(_volume_history) < 3:
        return signals

    # Feed volume to ADWIN
    _adwin_volume.update(current_count)
    if _adwin_volume.drift_detected:
        avg_volume = sum(_volume_history) / len(_volume_history)
        ratio = current_count / max(1, avg_volume)

        if ratio > 1.5:
            severity = "critical" if ratio > 3 else "high" if ratio > 2 else "medium"
            related = [t.topic for t in trends[:3]] if trends else []

            signals.append(SignalItem(
                id=_generate_signal_id("Volume Spike", f"ratio:{ratio:.1f}"),
                signal_type="Volume Spike",
                description=f"Unusual surge in article volume - {ratio:.1f}x above baseline ({current_count} vs avg {avg_volume:.0f})",
                severity=severity,
                detected_at=datetime.now(timezone.utc).isoformat(),
                source_count=current_count,
                related_topics=related,
                is_anomaly=True,
                drift_score=min(1.0, ratio / 4),
            ))

    return signals


def detect_sentiment_drift(articles: list[NewsArticle]) -> list[SignalItem]:
    """Detect significant shifts in overall sentiment using ADWIN."""
    signals = []

    if not articles:
        return signals

    avg_sentiment = sum(a.sentiment for a in articles) / len(articles)
    _sentiment_history.append(avg_sentiment)

    if len(_sentiment_history) < 3:
        return signals

    _adwin_sentiment.update(avg_sentiment)
    if _adwin_sentiment.drift_detected:
        historical_avg = sum(_sentiment_history) / len(_sentiment_history)
        shift = avg_sentiment - historical_avg

        if abs(shift) > 0.1:
            direction = "negative" if shift < 0 else "positive"
            severity = "high" if abs(shift) > 0.3 else "medium"

            # Find topics with biggest sentiment change
            topic_sentiments: dict[str, list[float]] = defaultdict(list)
            for a in articles:
                for t in a.topics:
                    topic_sentiments[t].append(a.sentiment)

            affected_topics = sorted(
                topic_sentiments.keys(),
                key=lambda t: abs(sum(topic_sentiments[t]) / len(topic_sentiments[t]) - historical_avg),
                reverse=True,
            )[:3]

            signals.append(SignalItem(
                id=_generate_signal_id("Sentiment Shift", f"shift:{shift:.2f}"),
                signal_type="Sentiment Shift",
                description=f"Significant {direction} sentiment drift detected - shifted by {shift:.2f} (current: {avg_sentiment:.2f}, baseline: {historical_avg:.2f})",
                severity=severity,
                detected_at=datetime.now(timezone.utc).isoformat(),
                source_count=len(articles),
                related_topics=affected_topics,
                is_anomaly=False,
                drift_score=min(1.0, abs(shift) * 3),
            ))

    return signals


def detect_source_anomalies(articles: list[NewsArticle]) -> list[SignalItem]:
    """Detect unusual publishing frequency from individual sources."""
    signals = []
    now = datetime.now(timezone.utc)

    source_counts: dict[str, int] = defaultdict(int)
    for a in articles:
        source_counts[a.source] += 1
        _source_frequency[a.source].append(now)

    for source, count in source_counts.items():
        history = _source_frequency[source]
        if len(history) < 3:
            continue

        avg_freq = len(history) / max(1, len(_volume_history))
        if count > avg_freq * 3 and count > 5:
            signals.append(SignalItem(
                id=_generate_signal_id("Source Anomaly", source),
                signal_type="Source Anomaly",
                description=f"{source} publishing frequency {count / max(1, avg_freq):.1f}x normal rate - possible breaking event",
                severity="critical" if count > avg_freq * 5 else "high",
                detected_at=now.isoformat(),
                source_count=count,
                related_topics=[source],
                is_anomaly=True,
                drift_score=min(1.0, count / max(1, avg_freq) / 5),
            ))

    return signals


def detect_topic_bursts(trends: list[TrendItem]) -> list[SignalItem]:
    """Detect new topic bursts - rapidly emerging topics."""
    signals = []

    for trend in trends:
        if trend.trend_direction == "rising" and trend.trend_score > 80:
            signals.append(SignalItem(
                id=_generate_signal_id("New Topic Burst", trend.topic),
                signal_type="New Topic Burst",
                description=f"Rapidly emerging topic cluster '{trend.topic}' with {trend.article_count} articles and rising score of {trend.trend_score}",
                severity="medium" if trend.trend_score < 90 else "high",
                detected_at=trend.last_updated,
                source_count=trend.article_count,
                related_topics=trend.keywords[:3],
                is_anomaly=True,
                drift_score=trend.trend_score / 100,
            ))

    return signals


def detect_anomalies_streaming(articles: list[NewsArticle]) -> list[SignalItem]:
    """Use River's Half-Space Trees for multivariate anomaly detection on article features."""
    signals = []

    for article in articles:
        features = {
            "sentiment": article.sentiment,
            "title_length": len(article.title),
            "summary_length": len(article.summary),
            "topic_count": len(article.topics),
        }

        score = _anomaly_detector.score_one(features)
        _anomaly_detector.learn_one(features)

        if score > 0.8:
            signals.append(SignalItem(
                id=_generate_signal_id("Streaming Anomaly", article.id),
                signal_type="Content Anomaly",
                description=f"Anomalous article detected: '{article.title[:80]}...' - unusual feature distribution",
                severity="low" if score < 0.9 else "medium",
                detected_at=article.published_at,
                source_count=1,
                related_topics=article.topics[:3],
                is_anomaly=True,
                drift_score=score,
            ))

    return signals


def run_all_detectors(articles: list[NewsArticle], trends: list[TrendItem]) -> list[SignalItem]:
    """Run all signal detectors and aggregate results."""
    all_signals = []

    all_signals.extend(detect_volume_spikes(articles, trends))
    all_signals.extend(detect_sentiment_drift(articles))
    all_signals.extend(detect_source_anomalies(articles))
    all_signals.extend(detect_topic_bursts(trends))
    all_signals.extend(detect_anomalies_streaming(articles))

    # Sort by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    all_signals.sort(key=lambda s: severity_order.get(s.severity, 4))

    logger.info("Detected %d signals from %d articles", len(all_signals), len(articles))
    return all_signals
