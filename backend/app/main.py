"""Trime.ai - Real-time News & Trends Detection API.

FastAPI backend with:
- Feed ingestion via feedparser + trafilatura
- Sentiment analysis via VADER
- Trend detection via TF-IDF clustering (BERTopic-inspired)
- Signal detection via River (ADWIN drift + Half-Space Trees anomaly)
- Scheduled pipeline execution via APScheduler
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.routers.api import router as api_router
from app.pipelines.realtime_pipeline import run_pipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Background scheduler for periodic pipeline runs
scheduler = BackgroundScheduler()

PIPELINE_INTERVAL_MINUTES = int(os.getenv("PIPELINE_INTERVAL_MINUTES", "5"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager."""
    logger.info("Starting Trime.ai backend...")

    # Run pipeline once at startup
    logger.info("Running initial pipeline...")
    try:
        run_pipeline()
    except Exception as exc:
        logger.error("Initial pipeline run failed: %s", exc)

    # Schedule periodic runs
    scheduler.add_job(
        run_pipeline,
        "interval",
        minutes=PIPELINE_INTERVAL_MINUTES,
        id="realtime_pipeline",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Pipeline scheduled every %d minutes", PIPELINE_INTERVAL_MINUTES)

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    logger.info("Trime.ai backend shutdown complete")


app = FastAPI(
    title="Trime.ai API",
    description="Real-time news, feeds & trends detection platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "name": "Trime.ai",
        "description": "Real-time News & Trends Detection API",
        "version": "0.1.0",
        "docs": "/docs",
    }
