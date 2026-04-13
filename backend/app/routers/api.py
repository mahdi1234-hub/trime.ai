"""API routes for the Trime.ai backend."""

import time
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Query
from app.pipelines.realtime_pipeline import state, run_pipeline
from app.models.schemas import NewsArticle, TrendItem, SignalItem, FeedSource, DashboardStats

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["api"])

# Staleness threshold: re-run pipeline if data is older than 2 minutes
STALE_SECONDS = 120
_last_pipeline_time: float = 0


def _ensure_fresh_data():
    """Re-run the pipeline if data is stale (Vercel serverless loses state between cold starts)."""
    global _last_pipeline_time
    now = time.time()
    if now - _last_pipeline_time > STALE_SECONDS or not state.articles:
        logger.info("Data is stale or empty, re-running pipeline...")
        try:
            run_pipeline()
        except Exception as exc:
            logger.error("Pipeline run failed: %s", exc)
        _last_pipeline_time = now


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard():
    """Get dashboard statistics and recent data."""
    _ensure_fresh_data()
    return state.get_dashboard_stats()


@router.get("/news", response_model=list[NewsArticle])
async def get_news(limit: int = Query(50, ge=1, le=500)):
    """Get latest news articles from the pipeline, sorted newest first."""
    _ensure_fresh_data()
    return state.articles[:limit]


@router.get("/trends", response_model=list[TrendItem])
async def get_trends():
    """Get currently detected trends."""
    _ensure_fresh_data()
    return state.trends


@router.get("/signals", response_model=list[SignalItem])
async def get_signals():
    """Get active signals (anomalies, drift, bursts)."""
    _ensure_fresh_data()
    return state.signals


@router.get("/feeds", response_model=list[FeedSource])
async def get_feeds():
    """Get configured feed sources."""
    _ensure_fresh_data()
    return state.feed_sources


@router.post("/pipeline/run")
async def trigger_pipeline():
    """Manually trigger a pipeline run."""
    global _last_pipeline_time
    run_pipeline()
    _last_pipeline_time = time.time()
    return {
        "status": "completed",
        "articles": len(state.articles),
        "trends": len(state.trends),
        "signals": len(state.signals),
        "run_count": state.run_count,
    }


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "pipeline_runs": state.run_count,
        "total_articles": len(state.articles),
        "last_run": state.last_run,
    }
