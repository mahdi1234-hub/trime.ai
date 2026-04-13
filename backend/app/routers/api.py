"""API routes for the Trime.ai backend."""

from fastapi import APIRouter, Query
from app.pipelines.realtime_pipeline import state, run_pipeline
from app.models.schemas import NewsArticle, TrendItem, SignalItem, FeedSource, DashboardStats

router = APIRouter(prefix="/api/v1", tags=["api"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard():
    """Get dashboard statistics and recent data."""
    return state.get_dashboard_stats()


@router.get("/news", response_model=list[NewsArticle])
async def get_news(limit: int = Query(50, ge=1, le=200)):
    """Get latest news articles from the pipeline."""
    return state.articles[:limit]


@router.get("/trends", response_model=list[TrendItem])
async def get_trends():
    """Get currently detected trends."""
    return state.trends


@router.get("/signals", response_model=list[SignalItem])
async def get_signals():
    """Get active signals (anomalies, drift, bursts)."""
    return state.signals


@router.get("/feeds", response_model=list[FeedSource])
async def get_feeds():
    """Get configured feed sources."""
    return state.feed_sources


@router.post("/pipeline/run")
async def trigger_pipeline():
    """Manually trigger a pipeline run."""
    run_pipeline()
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
