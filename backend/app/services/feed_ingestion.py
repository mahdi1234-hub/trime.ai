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

# Default RSS feed sources - optimized for speed on Vercel serverless (10s timeout)
DEFAULT_FEEDS = [
    # General / World News
    {"name": "BBC News", "url": "https://feeds.bbci.co.uk/news/rss.xml", "type": "rss"},
    {"name": "NPR News", "url": "https://feeds.npr.org/1001/rss.xml", "type": "rss"},
    # Technology
    {"name": "Hacker News", "url": "https://news.ycombinator.com/rss", "type": "rss"},
    {"name": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/index", "type": "rss"},
    {"name": "The Verge", "url": "https://www.theverge.com/rss/index.xml", "type": "rss"},
    # Science
    {"name": "Science Daily", "url": "https://www.sciencedaily.com/rss/all.xml", "type": "rss"},
    # Finance / Business
    {"name": "CNBC Top News", "url": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", "type": "rss"},
    # Politics
    {"name": "BBC Politics", "url": "https://feeds.bbci.co.uk/news/politics/rss.xml", "type": "rss"},
    # Sports
    {"name": "BBC Sport", "url": "https://feeds.bbci.co.uk/sport/rss.xml", "type": "rss"},
    {"name": "ESPN", "url": "https://www.espn.com/espn/rss/news", "type": "rss"},
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

    # Skip trafilatura on Vercel serverless for speed (would exceed 10s timeout)
    # trafilatura is available for local/dedicated server deployments

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
        "Sports": ["game", "team", "player", "championship", "league", "coach", "season", "match", "tournament", "olympic", "football", "soccer", "basketball", "tennis", "golf", "nfl", "nba", "premier league", "cricket", "rugby", "f1", "formula", "racing"],
    }
    for category, keywords in categories.items():
        if any(kw in text for kw in keywords):
            return category
    return "General"


def fetch_rss_feed(feed_url: str, feed_name: str) -> list[NewsArticle]:
    """Fetch and parse a single RSS feed using feedparser with timeout."""
    articles = []
    try:
        # Use requests with timeout to fetch the feed, then parse
        try:
            resp = requests.get(feed_url, timeout=5, headers={"User-Agent": "Trime.ai/1.0"})
            parsed = feedparser.parse(resp.content)
        except requests.Timeout:
            logger.warning("Timeout fetching feed %s", feed_name)
            return articles
        except Exception:
            parsed = feedparser.parse(feed_url)

        if parsed.bozo and not parsed.entries:
            logger.warning("Feed parse error for %s: %s", feed_name, parsed.bozo_exception)
            return articles

        for entry in parsed.entries[:10]:  # Limit to 10 per feed for speed
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


def _parse_date_for_sorting(date_str: str) -> datetime:
    """Parse various RSS date formats into a datetime for sorting."""
    from email.utils import parsedate_to_datetime
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        pass
    try:
        from dateutil.parser import parse as dateutil_parse
        return dateutil_parse(date_str)
    except Exception:
        pass
    return datetime.now(timezone.utc)


def fetch_all_feeds(feed_sources: Optional[list[dict]] = None) -> list[NewsArticle]:
    """Fetch articles from all configured feed sources in parallel for speed."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    sources = feed_sources or DEFAULT_FEEDS
    all_articles = []

    def _fetch_one(source):
        return fetch_rss_feed(source["url"], source["name"])

    # Fetch all feeds in parallel (max 5 workers)
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(_fetch_one, s): s for s in sources}
        for future in as_completed(futures, timeout=15):
            source = futures[future]
            try:
                articles = future.result(timeout=8)
                all_articles.extend(articles)
                logger.info("Got %d articles from %s", len(articles), source["name"])
            except Exception as exc:
                logger.warning("Failed to fetch %s: %s", source["name"], exc)

    # Sort by published date (newest first) using proper date parsing
    all_articles.sort(key=lambda a: _parse_date_for_sorting(a.published_at), reverse=True)
    return all_articles
