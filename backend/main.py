"""
अंतर्मन (Antarman) — FastAPI Backend
Decision Intelligence System

Architecture:
  - Frontend (Express on port 8080) proxies /api/* calls here
  - Backend (FastAPI on port 8000) handles logic + LLM
  - Both run in one Docker container on Cloud Run
"""

import json
import os
from pathlib import Path

import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import google.cloud.logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Load .env from project root (parent of backend/)
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=True)

# GCP Logging Setup
try:
    client = google.cloud.logging.Client()
    client.setup_logging()
    print("✅ Google Cloud Logging configured")
except Exception:
    print("ℹ️  GCP Logging skipped (local or no creds)")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Antarman — Decision Intelligence API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Gemini Setup ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None

if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        print("✅ Gemini configured with gemini-2.0-flash")
    except Exception as e:
        print(f"⚠️  Gemini init failed: {e}")
else:
    print("⚠️  GEMINI_API_KEY not set — LLM features disabled")

# --- Data Layer ---
DATA_DIR = Path(__file__).parent / "data"


def load_json(filename: str):
    path = DATA_DIR / filename
    if not path.exists():
        raise HTTPException(500, f"Data file not found: {filename}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# --- Health Check ---
@app.get("/health")
@limiter.limit("20/minute")
def health(request: Request):
    return {
        "status": "ok",
        "service": "antarman-backend",
        "llm_ready": gemini_model is not None,
    }


# --- Dashboard ---
@app.get("/api/dashboard")
@limiter.limit("20/minute")
def dashboard(request: Request):
    profile = load_json("profile.json")
    pillars = load_json("pillars.json")
    events = load_json("events.json")

    upcoming = [e for e in events if not e["completed"]]
    next_event = upcoming[0] if upcoming else None

    return {
        "name": profile["name"],
        "hero_score": profile["current_hero_score"],
        "hero_archetype": profile["hero_archetype"],
        "hero_weights": profile["hero_weights"],
        "pillars": pillars,
        "next_nudge_event": next_event,
    }


# --- Events ---
@app.get("/api/events")
@limiter.limit("20/minute")
def get_events(request: Request):
    return load_json("events.json")


# --- Nudge (next upcoming event) ---
@app.get("/api/nudge")
@limiter.limit("20/minute")
def get_nudge(request: Request):
    events = load_json("events.json")
    upcoming = [e for e in events if not e["completed"]]
    if not upcoming:
        return {"event_title": None, "warning": None, "time": None}
    nxt = upcoming[0]
    return {
        "event_title": nxt["title"],
        "warning": nxt.get("nudge", ""),
        "time": nxt["time"],
        "category": nxt.get("category", ""),
    }


# --- Classify Event (LIVE LLM) ---
class EventRequest(BaseModel):
    event_text: str = Field(..., min_length=2, max_length=500, description="The life event description to analyze.")


@app.post("/api/classify-event")
@limiter.limit("5/minute")
async def classify_event(req: EventRequest, request: Request):
    if not gemini_model:
        raise HTTPException(503, "Gemini API not configured. Add GEMINI_API_KEY to .env")

    profile = load_json("profile.json")
    hero_weights = profile["hero_weights"]

    prompt = f"""You are Antarman, a life intelligence system. Analyze this life event and score its impact across four life pillars.

User's Hero Weights (how much each pillar matters to them):
{json.dumps(hero_weights, indent=2)}

Life Event: "{req.event_text}"

Return ONLY valid JSON — no markdown, no explanation, no code blocks:
{{
  "pillars_affected": ["health"],
  "impact": {{"health": 0, "wealth": 0, "relationships": 0, "purpose": 0}},
  "score_delta": 0.0,
  "nudge": "One wise, concise sentence spoken as their inner voice."
}}

Rules:
- impact values are integers between -15 and +15
- score_delta = weighted sum using hero_weights (can be negative)
- pillars_affected lists only pillars with non-zero impact
- nudge sounds like a wise, personal inner voice — NOT a generic chatbot response
- Be honest: negative events should have negative scores"""

    try:
        t0 = time.time()
        response = gemini_model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )
        t1 = time.time()
        result = json.loads(response.text)
        result["metrics"] = {"response_time_ms": int((t1 - t0) * 1000)}
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"LLM returned invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(500, f"LLM error: {str(e)}")


# --- What If Scenario (cache-first → LLM fallback) ---
class WhatIfRequest(BaseModel):
    scenario: str = Field(..., min_length=2, max_length=500, description="The 'what if' scenario to simulate.")


@app.post("/api/whatif")
@limiter.limit("5/minute")
async def whatif(req: WhatIfRequest, request: Request):
    # Check cache first (fuzzy match — handles phrase variations)
    cache = load_json("whatif_cache.json")
    scenario_lower = req.scenario.lower().strip()

    for key, value in cache.items():
        key_lower = key.lower().strip()
        # Exact or substring match
        if key_lower in scenario_lower or scenario_lower in key_lower:
            return value
        # Word-overlap match: ≥2 significant words in common
        key_words = {w for w in key_lower.split() if len(w) > 3}
        scen_words = {w for w in scenario_lower.split() if len(w) > 3}
        if len(key_words & scen_words) >= 2:
            value["metrics"] = {"response_time_ms": 15, "cached": True}
            return value

    # Fall back to LLM
    if not gemini_model:
        raise HTTPException(
            503, "Scenario not in cache and Gemini API not configured. Add GEMINI_API_KEY to .env"
        )

    profile = load_json("profile.json")

    prompt = f"""You are Antarman, a life intelligence system that simulates future impact of decisions.

Current Hero Score: {profile["current_hero_score"]}
Hero Weights: {json.dumps(profile["hero_weights"])}
Hero Archetype: {profile["hero_archetype"]}

Scenario the user is considering: "{req.scenario}"

Project the user's Hero Score for each of the next 7 days if they follow through on this scenario.

Return ONLY valid JSON:
{{
  "projected_scores": [62, 60, 58, 55, 52, 50, 48],
  "warning": "2-3 sentences as a wise inner voice analyzing this decision."
}}

Rules:
- projected_scores must have EXACTLY 7 integers (0-100 range)
- First value should be close to current score ({profile["current_hero_score"]})
- warning is insightful and personal — not generic
- Consider their hero_weights when projecting (health-heavy person is more affected by health choices)"""

    try:
        t0 = time.time()
        response = gemini_model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"},
        )
        t1 = time.time()
        result = json.loads(response.text)
        result["metrics"] = {"response_time_ms": int((t1 - t0) * 1000), "cached": False}
        return result
    except Exception as e:
        raise HTTPException(500, f"LLM error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
