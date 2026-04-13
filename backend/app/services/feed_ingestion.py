"""Feed ingestion service using feedparser and trafilatura for real-time news collection."""

import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional

import feedparser
import trafilatura
import requests

from app.models.schemas import NewsArticle

logger = logging.getLogger(__name__)

# Default RSS feed sources
DEFAULT_FEEDS = [
    {"name": "Reuters World News", "url": "https://feeds.reuters.com/reuters/worldNews", "type": "rss"},
    {"name": "TechCrunch", "url": "https://techcrunch.com/feed/", "type": "rss"},
    {"name": "Hacker News", "url": "https://news.ycombinator.com/rss", "type": "rss"},
    {"name": "BBC News", "url": "https://feeds.bbci.co.uk/news/rss.xml", "type": "rss"},
    {"name": "ArXiv CS.AI", "url": "https://rss.arxiv.org/rss/cs.AI", "type": "rss"},
    {"name": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/index", "type": "rss"},
]


def generate_article_id(url: str, title: str) -> str:
    """Generate a deterministic ID for an article."""
    content = f"{url}:{title}"
    return hashlib.md5(content.encode()).hexdigest()[:16]


def parse_published_date(entry: dict) -> str:
    """Extract and normalize published date from feed entry."""
    for field in ("published", "updated", "created"):
        if field in entry:
            return entry[field]
    return datetime.now(timezone.utc).isoformat()


def extract_summary(entry: dict, url: str) -> str:
    """Extract article summary from feed entry, with optional trafilatura extraction."""
    # Try feed summary first
    summary = ""
    if "summary" in entry:
        summary = entry.summary
    elif "description" in entry:
        summary = entry.description

    # Clean HTML tags from summary
    if summary:
        from bs4 import BeautifulSoup
        summary = BeautifulSoup(summary, "html.parser").get_text(strip=True)

    # If summary is too short, try trafilatura for full text extraction
    if len(summary) < 50 and url:
        try:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                extracted = trafilatura.extract(downloaded, include_comments=False, include_tables=False)
                if extracted:
                    summary = extracted[:500]
        except Exception as exc:
            logger.debug("Trafilatura extraction failed for %s: %s", url, exc)

    return summary[:500] if summary else "No summary available."


def categorize_article(title: str, summary: str) -> str:
    """Simple keyword-based categorization."""
    text = (title + " " + summary).lower()
    categories = {
        "Technology": ["tech", "software", "ai", "artificial intelligence", "computer", "digital", "startup", "app", "cyber", "quantum", "robot"],
        "Finance": ["market", "stock", "bank", "financial", "economy", "trade", "invest", "crypto", "bitcoin", "inflation", "rate"],
        "Politics": ["government", "election", "president", "congress", "parliament", "policy", "regulation", "law", "political", "vote"],
        "Science": ["research", "study", "scientist", "discovery", "space", "physics", "biology", "climate", "environment", "ocean"],
        "Health": ["health", "medical", "hospital", "disease", "vaccine", "drug", "patient", "doctor", "who", "pandemic"],
        "Sports": ["game", "team", "player", "championship", "league", "coach", "season", "match", "tournament", "olympic"],
    }
    for category, keywords in categories.items():
        if any(kw in text for kw in keywords):
            return category
    return "General"


def fetch_rss_feed(feed_url: str, feed_name: str) -> list[NewsArticle]:
    """Fetch and parse a single RSS feed using feedparser."""
    articles = []
    try:
        parsed = feedparser.parse(feed_url)
        if parsed.bozo and not parsed.entries:
            logger.warning("Feed parse error for %s: %s", feed_name, parsed.bozo_exception)
            return articles

        for entry in parsed.entries[:20]:  # Limit to 20 per feed
            url = getattr(entry, "link", "")
            title = getattr(entry, "title", "No Title")
            article_id = generate_article_id(url, title)
            published_at = parse_published_date(entry)
            summary = extract_summary(entry, url)
            category = categorize_article(title, summary)

            articles.append(NewsArticle(
                id=article_id,
                title=title,
                source=feed_name,
                url=url,
                published_at=published_at,
                summary=summary,
                sentiment=0.0,
                sentiment_label="neutral",
                topics=[],
                category=category,
            ))
    except Exception as exc:
        logger.error("Failed to fetch feed %s: %s", feed_name, exc)

    return articles


def fetch_all_feeds(feed_sources: Optional[list[dict]] = None) -> list[NewsArticle]:
    """Fetch articles from all configured feed sources."""
    sources = feed_sources or DEFAULT_FEEDS
    all_articles = []

    for source in sources:
        logger.info("Fetching feed: %s", source["name"])
        articles = fetch_rss_feed(source["url"], source["name"])
        all_articles.extend(articles)
        logger.info("Got %d articles from %s", len(articles), source["name"])

    # Sort by published date (newest first)
    all_articles.sort(key=lambda a: a.published_at, reverse=True)
    return all_articles
