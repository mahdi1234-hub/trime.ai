# Trime.ai

Real-time news, feeds & trends detection SaaS platform.

## Architecture

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python with real-time ML pipelines

## Backend Stack

| Library | Purpose |
|---------|---------|
| **feedparser** | RSS/Atom feed ingestion |
| **trafilatura** | Web article text extraction |
| **VADER Sentiment** | Real-time sentiment analysis |
| **scikit-learn** (TF-IDF + KMeans) | Topic/trend detection (BERTopic-inspired) |
| **River** (ADWIN + HalfSpaceTrees) | Streaming anomaly & drift detection |
| **APScheduler** | Periodic pipeline execution |

## Features

- Live RSS feed monitoring from multiple sources
- Real-time sentiment analysis on incoming articles
- Automatic topic/trend detection via clustering
- Signal detection: volume spikes, sentiment drift, source anomalies
- Streaming anomaly detection via River's Half-Space Trees
- Dashboard with hourly volume charts and category breakdowns

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deployment

Both frontend and backend are configured for Vercel deployment.

## License

MIT
