"""Sentiment analysis service using VADER for real-time text sentiment scoring."""

import logging
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.models.schemas import NewsArticle

logger = logging.getLogger(__name__)

# Initialize VADER analyzer (fast, no GPU needed, good for news headlines)
_analyzer = SentimentIntensityAnalyzer()


def analyze_sentiment(text: str) -> tuple[float, str]:
    """Analyze sentiment of text using VADER.
    
    Returns:
        tuple of (compound_score, label) where score is -1.0 to 1.0
        and label is 'positive', 'negative', or 'neutral'.
    """
    if not text:
        return 0.0, "neutral"

    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    return round(compound, 3), label


def enrich_articles_with_sentiment(articles: list[NewsArticle]) -> list[NewsArticle]:
    """Add sentiment scores and labels to a list of articles."""
    for article in articles:
        text = f"{article.title}. {article.summary}"
        sentiment, label = analyze_sentiment(text)
        article.sentiment = sentiment
        article.sentiment_label = label

    logger.info("Enriched %d articles with sentiment scores", len(articles))
    return articles
