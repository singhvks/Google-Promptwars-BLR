# 🚀 Fullstack Builder Skill (Express + FastAPI + Cloud Run)

## 🎯 Goal

Scaffold a production-ready monorepo for hackathons:
- **Frontend:** Express server (Node.js) serving static HTML
- **Backend:** FastAPI (Python) for app logic / API
- **Container:** Single Cloud Run service (both in one container)
- **Deploy:** One-command via `deploy.ps1`

---

## 📦 Project Structure (Skeleton)

```
project-root/
├── backend/
│   ├── main.py              # FastAPI app (skeleton — agent fills in)
│   ├── requirements.txt     # Python deps (unpinned)
│   └── .gitignore
│
├── frontend/
│   ├── package.json         # Only express dependency
│   ├── src/
│   │   └── flows/
│   │       └── analyze.js   # Express server + API proxy
│   └── public/
│       └── index.html       # App UI (agent builds from appIdea.md)
│
├── Dockerfile               # Node + Python in one container
├── entrypoint.sh            # Starts both services
├── deploy.ps1               # One-click Cloud Run deploy
├── test.ps1                 # Smoke tests
├── appIdea.md               # YOUR APP IDEA (agent reads this)
├── .env                     # GCP config (gitignored)
├── .gitignore
├── learnings/               # Deployment error reference
└── README.md
```

---

## 🛠️ How to Use This Skeleton

### For a new hackathon project:

1. **Edit `appIdea.md`** with your app concept (what it does, features, gameplay)
2. **Tell the agent:** "Build the app from appIdea.md using the fullstack-builder skill"
3. The agent will:
   - Read `appIdea.md`
   - Rewrite `backend/main.py` with your API endpoints
   - Rewrite `frontend/public/index.html` with your UI
   - Update `frontend/src/flows/analyze.js` with proxy routes
   - Add any new files needed (data modules, etc.)
4. **Deploy:** `.\deploy.ps1`
5. **Test:** `.\test.ps1 <cloud-run-url>`

---

## 📋 Pre-installed Dependencies

### Backend (Python — already in .venv)
```
fastapi     # Web framework
uvicorn     # ASGI server
pydantic    # Data validation
```

Add more with: `pip install <package>` (and add to `requirements.txt`)

### Frontend (Node.js — already in node_modules)
```
express     # HTTP server + static files + API proxy
```

Add more with: `npm install <package>` (inside `frontend/`)

---

## ⚠️ Key Learnings (Don't Repeat These Mistakes)

1. **Never pin pydantic to old versions** — causes `pydantic-core` build failures
2. **Don't use Genkit** unless you specifically need AI flows — it adds 300MB of deps
3. **Use `position: relative`** on parent containers when using `position: absolute` overlays
4. **PowerShell quoting:** Use `--format "value(field)"` not `--format="value(field)"`
5. **Hide the header during fullscreen views** (games, maps) — otherwise content overflows 100vh

See `learnings/deployment_errors.md` for full error reference.

---

## 🔍 Architecture

### Backend (FastAPI — port 8000)
- Agent adds endpoints based on `appIdea.md`
- `/health` — always present (for Cloud Run health checks)
- Internal only — not exposed to internet

### Frontend (Express — port 8080)
- Serves `public/index.html` (the app UI)
- Proxies `/api/*` requests to FastAPI backend
- Port 8080 is exposed to Cloud Run / internet

### Docker Container
- `node:18-alpine` base
- Python installed via `apk add python3 py3-pip`
- `entrypoint.sh` starts both services
- Cloud Run exposes port 8080 only

---

## 📞 Troubleshooting

| Issue | Fix |
|---|---|
| `pip install` fails | Use unpinned versions, check `learnings/deployment_errors.md` |
| Port in use | `netstat -ano | findstr :8080` → `taskkill /PID <pid> /F` |
| Deploy fails | Run deploy command directly, see `learnings/` |
| UI element hidden | Check `position: relative` parent, check viewport overflow |
