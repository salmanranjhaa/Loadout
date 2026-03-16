# LifePlan: Full Stack Weekly Routine & Nutrition App

## Architecture Overview

```
[React Frontend (PWA)]  -->  [FastAPI Backend]  -->  [Cloud SQL (PostgreSQL)]
        |                         |
        |                    [Vertex AI]
        |                         |
        v                    [RAG System]
   [Mobile Browser]          (Embeddings + Vector Search)
```

## Stack

| Layer       | Tech                                      |
|-------------|-------------------------------------------|
| Frontend    | React 18, Tailwind CSS, Chart.js, PWA     |
| Backend     | Python 3.11, FastAPI, SQLAlchemy, Alembic  |
| Database    | PostgreSQL 15 (Cloud SQL)                  |
| AI/ML       | Vertex AI (Gemini), text embeddings        |
| Infra       | Docker, Compute Engine, Cloud SQL          |
| Auth        | JWT tokens (simple, single user)           |

## Features

1. **Weekly Schedule** with all events (CrossFit, classes, IRI, chess, etc.)
2. **Meal Plan** with macro tracking and Vertex AI chatbot for modifications
3. **Fitness Analytics** (weight, workouts, calories over time)
4. **Calendar View** synced with your actual schedule
5. **RAG System** for personalized nutrition advice based on your history
6. **User Profile** that updates as you modify routines
7. **Grocery List** generator based on selected meals

## Quick Start (Local Dev)

```bash
# 1. Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your credentials
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 2. Frontend
cd frontend
npm install
cp .env.example .env  # Point to backend URL
npm run dev
```

## GCP Deployment

See `infra/DEPLOY.md` for step by step instructions.

## Project Structure

```
lifeplan/
  backend/
    app/
      main.py              # FastAPI app entry
      core/
        config.py          # Environment config
        database.py        # SQLAlchemy setup
        auth.py            # JWT auth
      models/
        user.py            # User profile model
        schedule.py        # Schedule/events model
        meal.py            # Meals and nutrition model
        analytics.py       # Fitness/weight tracking model
      api/
        routes_schedule.py # Schedule CRUD endpoints
        routes_meals.py    # Meal plan endpoints
        routes_analytics.py# Analytics endpoints
        routes_ai.py       # Vertex AI chatbot endpoint
      services/
        vertex_ai.py       # Vertex AI integration
        rag.py             # RAG system for nutrition advice
        meal_planner.py    # Meal planning logic
    requirements.txt
    Dockerfile
    alembic.ini
  frontend/
    src/
      App.jsx
      components/          # Reusable UI components
      pages/               # Main page views
      hooks/               # Custom React hooks
      utils/               # Helper functions
    package.json
    Dockerfile
    vite.config.js
  infra/
    docker-compose.yml
    DEPLOY.md
    nginx.conf
```
