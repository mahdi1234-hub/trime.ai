"""API routes for the Trime.ai backend."""

import time
import logging

from fastapi import APIRouter, Query
from app.pipelines.realtime_pipeline import state, run_pipeline
from app.models.schemas import NewsArticle, TrendItem, SignalItem, FeedSource, DashboardStats

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["api"])

_last_pipeline_time: float = 0
STALE_SECONDS = 120  # Re-run pipeline if older than 2 min


def _ensure_fresh_data():
    """Run pipeline synchronously if data is stale. Fast enough for Vercel (10 feeds, 5s timeout each)."""
    global _last_pipeline_time
    now = time.time()
    if now - _last_pipeline_time > STALE_SECONDS or not state.articles:
        logger.info("Running pipeline (data stale or empty)...")
        try:
            run_pipeline()
        except Exception as exc:
            logger.error("Pipeline failed: %s", exc)
        _last_pipeline_time = now


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard():
    _ensure_fresh_data()
    return state.get_dashboard_stats()


@router.get("/news", response_model=list[NewsArticle])
async def get_news(limit: int = Query(50, ge=1, le=500)):
    _ensure_fresh_data()
    return state.articles[:limit]


@router.get("/trends", response_model=list[TrendItem])
async def get_trends():
    _ensure_fresh_data()
    return state.trends


@router.get("/signals", response_model=list[SignalItem])
async def get_signals():
    _ensure_fresh_data()
    return state.signals


@router.get("/feeds", response_model=list[FeedSource])
async def get_feeds():
    _ensure_fresh_data()
    return state.feed_sources


@router.post("/pipeline/run")
async def trigger_pipeline():
    global _last_pipeline_time
    run_pipeline()
    _last_pipeline_time = time.time()
    return {
        "status": "completed",
        "articles": len(state.articles),
        "trends": len(state.trends),
        "signals": len(state.signals),
    }


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "pipeline_runs": state.run_count,
        "total_articles": len(state.articles),
        "last_run": state.last_run,
    }
