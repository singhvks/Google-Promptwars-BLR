# Antarman (अंतर्मन) - Decision Intelligence System Context

## Overview
Antarman is a decision intelligence "Life Operating System". It takes in life events and scores decisions based on four pillars:
1. **Health** (Physical & Mental, 35% weight by default)
2. **Wealth** (Work & Finance, 30% weight default)
3. **Relationships** (Connection & Community, 20% weight default)
4. **Purpose** (Happiness & Growth, 15% weight default)

These pillars formulate the **Hero Score**, a dynamic score (0-100) that models the user's alignment with their "ideal" self.
The system uses the `gemini-2.0-flash` model to analyze vague life events and map their impact to pillars (scoring the impact between -15 to +15 per pillar).
It also runs "What If" scenarios predicting score degradation over a 7-day future window.

## Architecture

**Backend (Port 8000)**
- **Framework:** FastAPI (Python)
- **Main file:** `backend/main.py`
- **Data Source:** Currently mock data loaded from JSON files inside `backend/data/` (`profile.json`, `events.json`, `pillars.json`, `whatif_cache.json`).
- **Endpoints:**
  - `GET /api/dashboard`: Aggregation of profile, pillars, and next nudge warning.
  - `GET /api/events`: Lists populated events.
  - `GET /api/nudge`: Warning/recommendation on upcoming events.
  - `POST /api/classify-event`: LIVE Gemini call mapping text event to pillar impact.
  - `POST /api/whatif`: Cache-first mapping, falls back to Gemini to simulate 7-day projected score trajectory based on a scenario.

**Frontend (Port 8080)**
- **Framework:** Express + Vanilla JS/CSS (No build step, no framework like React/Vue)
- **Main Server file:** `frontend/src/flows/analyze.js` (Express server proxying `/api/*` requests to port 8000 and serving `frontend/public/`).
- **UI Architecture:** Feature-based module loading.
  - The base shell is `frontend/public/index.html`.
  - Core JS and design system exist as `core.js` and `core.css`.
  - Feature logic is isolated inside `frontend/public/js/features/` and styles inside `frontend/public/css/features/`.

## Local Development (Quick Run)
Both servers run concurrently:
```bash
# Terminal 1: backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2: frontend
cd frontend
node src/flows/analyze.js
```
The app runs at http://localhost:8080. 
Make sure you have a `.env` in the root containing `GEMINI_API_KEY=...` to use LLM features.

## How to Quickly Add Features
We use a live-refresh **Feature File Architecture**.
1. **Create Feature JS File:** Copy `.agent/features/feature-template.js` to `frontend/public/js/features/<my-feature>.js`.
2. **Create Feature CSS File:** Add custom styling in `frontend/public/css/features/<my-feature>.css` (Optional).
3. **Link in HTML:** Add the JS and CSS links to `frontend/public/index.html`.
4. **Proxy Route (If needed):** If creating a new API, add proxy logic in `frontend/src/flows/analyze.js` via `proxyGet`/`proxyPost`. Add the backend implementation in `backend/main.py`.
5. **Call API:** The new UI can call backend via `App.api._get()` or `App.api._post()`. Use `App.navigateTo('<my-feature>', params)` to navigate.

Refresh the browser — no rebuild necessary.
