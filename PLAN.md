# LifePlan — Implementation Plan & Task Tracker

> Work through phases in order. Check off tasks as they are completed.

---

## APIs & Keys You Need to Generate First

Before any production deployment, you need the following. Generate them and put them in your `.env` file.

### 1. GCP / Vertex AI (already partially done)

- Go to [console.cloud.google.com](https://console.cloud.google.com)
- Enable these APIs (APIs & Services → Library):
  - `Vertex AI API    enabled `
  - `Google Calendar API` ← **new, needed for Phase 5 **   enabled
  - `Artifact Registry API` (for Docker builds) enabled
  - `Cloud SQL Admin API` (for production DB)  enabled
  - `Compute Engine API` (for VM)  enabled 
- Create a Service Account (IAM & Admin → Service Accounts):
  - Role: `Vertex AI User` + `Cloud SQL Client` + `Calendar readonly/editor`
  - Download JSON key → save as `backend/gcp-key.json` (already gitignored)
- Your `.env` needs:
  ```
  GCP_PROJECT_ID=your-actual-project-id
  GCP_REGION=europe-west6
  GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json
  ```

### 2. Google Calendar OAuth2 ← **new**

- In GCP Console → APIs & Services → Credentials
- Create → OAuth 2.0 Client ID → Type: **Web application**
- Authorized redirect URIs:
  - `http://localhost:5173/calendar/callback`
  - `https://your-production-domain/calendar/callback`
- Download → you get:
  ```
  GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
  GOOGLE_REDIRECT_URI=http://localhost:5173/calendar/callback
  ```

### 3. MongoDB Atlas ← **new**

- Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Create free M0 cluster
- Create database user (Database Access → Add New User)
- Allow network access (Network Access → Add IP Address → 0.0.0.0/0 for dev)
- Get connection string: Connect → Connect your application → copy URI
  ```
  MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
  MONGODB_DB_NAME=lifeplan
  ```
- For RAG vector search: in Atlas UI → Search → Create Index → select `rag_documents` collection → use JSON editor:
  ```json
  {
    "mappings": {
      "dynamic": true,
      "fields": {
        "embedding": {
          "dimensions": 768,
          "similarity": "cosine",
          "type": "knnVector"
        }
      }
    }
  }
  ```

### 4. App Secret Key

Generate once and keep safe:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Put the output in:

```
SECRET_KEY=the-64-char-hex-string-you-generated
```

### Complete `.env` Template

```env
# App
APP_NAME=LifePlan
SECRET_KEY=CHANGE_ME_generate_with_python_secrets
DEBUG=false
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# PostgreSQL
DATABASE_URL=postgresql+asyncpg://lifeplan_user:changeme@localhost:5432/lifeplan_db
DATABASE_URL_SYNC=postgresql+psycopg2://lifeplan_user:changeme@localhost:5432/lifeplan_db

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=lifeplan

# GCP / Vertex AI
GCP_PROJECT_ID=your-project-id
GCP_REGION=europe-west6
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json
VERTEX_AI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=text-embedding-004

# Google Calendar OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=http://localhost:5173/calendar/callback
```

---

## Phase 1 — Security & Infrastructure Fixes

- [ ] **1.1** Fix CORS — read `ALLOWED_ORIGINS` from env, not hardcoded `*`
- [ ] **1.2** Validate `SECRET_KEY` at startup — crash if still placeholder
- [ ] **1.3** Generate Alembic initial migration from current SQLAlchemy models
- [ ] **1.4** Reduce JWT to 60 min + add `POST /api/v1/auth/refresh` endpoint
- [ ] **1.5** Add `slowapi` rate limiting to `/ai/` endpoints (10 req/min)
- [ ] **1.6** Fix frontend Dockerfile COPY path for nginx.conf
- [ ] **1.7** Replace silent `except: pass` blocks in RAG with proper `logging.error()`
- [ ] **1.8** Remove infra details from frontend error messages in ChatPage

---

## Phase 2 — MongoDB Integration

- [ ] **2.1** Add `motor==3.3.2` to `requirements.txt`
- [ ] **2.2** Add `MONGODB_URI` + `MONGODB_DB_NAME` to `config.py` and `.env.example`
- [ ] **2.3** Create `backend/app/core/mongodb.py` — Motor client + `get_mongo_db` dependency
- [ ] **2.4** Chat history → MongoDB
  - Backend: store/retrieve chat sessions in `chat_sessions` collection
  - New endpoint `GET /api/v1/ai/chat-history` + `DELETE /api/v1/ai/chat-history`
  - Frontend: load previous messages on ChatPage mount, no more lost-on-refresh
- [ ] **2.5** RAG vector store → MongoDB Atlas Vector Search
  - Move embeddings from JSON columns (meal_logs, workout_logs, schedule_modifications) to `rag_documents` collection
  - Use Atlas `$vectorSearch` aggregation for similarity search
  - Remove `embedding` JSON columns from PostgreSQL models (keep data, just change retrieval)

---

## Phase 3 — User Profile Page

- [ ] **3.1** Backend: `GET /api/v1/user/profile` — return full user profile
- [ ] **3.2** Backend: `PUT /api/v1/user/profile` — update any field; password requires current password verification
- [ ] **3.3** Frontend: `ProfilePage.jsx` with 4 sections:
  - **Account**: display name, email, change password
  - **Body & Targets**: weight, target weight, height, age, daily calorie/protein/carb/fat targets
  - **Preferences**: dietary preferences (halal toggle, disliked/preferred foods), supplements, routine prefs
  - **Grocery Stores**: preferred stores and notes
- [ ] **3.4** Add Profile to navigation (replace the Calendar nav's Settings icon confusion, add user icon)
- [ ] **3.5** Toast notifications on save (success/error)

---

## Phase 4 — RAG Confirm Banner (Smart Save from Chat)

- [ ] **4.1** Backend `routes_ai.py`: tag response when `structured_data` is a valid meal/schedule object
  - Add `action_type` field: `"save_meal_template"`, `"log_meal_today"`, `"add_schedule_event"`
- [ ] **4.2** Frontend: `ActionBanner.jsx` component — shown inside chat when `action_type` is present
  - **Meal banner**: shows nutritional card + ingredients + two buttons (Save Template / Log Today)
  - **Schedule banner**: shows event details + "Add to Schedule" button
- [ ] **4.3** Wire up banner buttons to API calls:
  - Save Template → `POST /api/v1/meals/templates`
  - Log Today → `POST /api/v1/meals/log`
  - Add Schedule Event → `POST /api/v1/schedule/`
- [ ] **4.4** On save: dismiss banner, show success message in chat thread, trigger RAG embedding store

---

## Phase 5 — Calendar Page

- [ ] **5.1** Add `google-auth-oauthlib==1.2.0` + `googleapiclient` to `requirements.txt`
- [ ] **5.2** Add `google_refresh_token` column to User model + Alembic migration
- [ ] **5.3** Backend `routes_calendar.py`:
  - `GET /api/v1/calendar/auth-url` — returns OAuth URL
  - `GET /api/v1/calendar/callback` — exchanges code, stores refresh token on user
  - `GET /api/v1/calendar/events` — fetches upcoming 14 days from Google Calendar
  - `POST /api/v1/calendar/sync` — pushes LifePlan schedule events to GCal
- [ ] **5.4** Frontend `CalendarPage.jsx`:
  - If not connected: connect button + instructions
  - If connected: 2-week view with GCal events + LifePlan schedule overlaid
  - Color coding matching existing schedule event types
  - "Sync to Calendar" button

---

## Phase 6 — Polish & Deployment Updates

- [ ] **6.1** Update `.env.example` with all new variables
- [ ] **6.2** Update `docker-compose.yml` — note MongoDB Atlas (external, no local container needed)
- [ ] **6.3** Update `DEPLOY.md` — add MongoDB Atlas setup, Google Calendar OAuth setup
- [ ] **6.4** Add startup env validation — log warnings if GCP, MongoDB, or Calendar not configured
- [ ] **6.5** Run full Alembic migration test on fresh DB

---

## Current Status

| Phase                         | Status         |
| ----------------------------- | -------------- |
| Phase 1 — Security fixes     | ⬜ Not started |
| Phase 2 — MongoDB            | ⬜ Not started |
| Phase 3 — Profile page       | ⬜ Not started |
| Phase 4 — RAG confirm banner | ⬜ Not started |
| Phase 5 — Calendar page      | ⬜ Not started |
| Phase 6 — Polish             | ⬜ Not started |
