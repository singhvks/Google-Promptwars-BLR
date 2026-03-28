# Deployment Learnings – Google Cloud Run (FastAPI + Express)

Errors encountered during the Map Dash project deployment and their resolutions.
Use this as a quick-reference during hackathons.

---

## Error 1: `pydantic-core` build failure in pip install

**When:** `pip install pydantic==2.5.0` on Windows / Alpine Docker

**Error:**
```
Building wheel for pydantic-core (pyproject.toml) ... error
Failed to build a native library
```

**Resolution:** Don't pin pydantic/fastapi to old versions. Use unpinned versions in `requirements.txt`:
```
fastapi
uvicorn
pydantic
```
Alpine Docker may lack Rust compiler for `pydantic-core` compilation on old versions.

---

## Error 2: `deploy.ps1` fails on `gcloud auth list`

**When:** Running `powershell -ExecutionPolicy Bypass -File .\deploy.ps1`

**Error:**
```
CommandNotFoundException: (account:String)
```

**Cause:** PowerShell `-File` mode interprets `--format="value(account)"` differently than interactive mode. The parentheses confuse the parser.

**Resolution:** Use double-quote wrapping without `=`:
```powershell
# WRONG:
$authList = gcloud auth list --format="value(account)"

# RIGHT:
$authAccounts = gcloud auth list --format "value(account)" 2>$null
```

---

## Error 3: PowerShell `-or` operator for default values

**When:** `deploy.ps1` loading env vars

**Error:** Variables get set to boolean `True` instead of the default string.

**Cause:** `-or` in PowerShell is a boolean operator, not a null-coalescing operator.

**Resolution:** Use `if (-not $var)` pattern:
```powershell
# WRONG:
$memory = [System.Environment]::GetEnvironmentVariable("MEMORY") -or "512Mi"

# RIGHT:
$memory = [System.Environment]::GetEnvironmentVariable("MEMORY")
if (-not $memory) { $memory = "512Mi" }
```

---

## Error 4: Absolute positioning without positioned parent

**When:** "Confirm Guess" button invisible during gameplay

**Cause:** `position: absolute; bottom: 2rem;` on the button had no `position: relative` parent. The header pushed content past 100vh, so the button rendered off-screen.

**Resolution:**
1. Wrap map + overlays in a `position: relative` container:
```html
<div class="map-wrapper" style="position: relative; flex: 1;">
  <div id="map"></div>
  <div class="confirm-btn-container">...</div>
</div>
```
2. Hide the header during gameplay:
```javascript
header.style.display = (id === 'gameScreen') ? 'none' : 'block';
```

---

## Error 5: `gcloud run deploy` with `--runtime` flag

**When:** Using `--runtime nodejs18` alongside `--source .` (with Dockerfile)

**Cause:** When `--source .` is used AND a `Dockerfile` exists, Cloud Build uses the Dockerfile. The `--runtime` flag conflicts.

**Resolution:** Remove `--runtime` when using `--source .` with a Dockerfile. Cloud Build auto-detects.

---

## Error 6: Genkit dependency bloat

**When:** `npm install` takes forever, `node_modules` is 300MB+

**Cause:** `@genkit-ai/flow` and `@genkit-ai/googleai` pull in massive dependency trees.

**Resolution:** If you don't need Genkit flows, use plain Express:
```json
{
  "dependencies": {
    "express": "^4.18.2"
  }
}
```
Express alone: ~2MB `node_modules`. With Genkit: ~300MB.

---

## Shortcut Summary

| Task | Shortcut |
|---|---|
| Deploy | `gcloud run deploy SERVICE --source . --region REGION --project PROJECT --service-account SA --allow-unauthenticated --memory 512Mi --port 8080` |
| Unpinned Python deps | `fastapi`, `uvicorn`, `pydantic` — never pin patch versions |
| Frontend | Plain `express` — skip Genkit unless you need AI flows |
| PowerShell quoting | Use `--format "value(field)"` not `--format="value(field)"` |
| Absolute positioning | Always add `position: relative` to the parent container |
| Test endpoints | `Invoke-RestMethod -Uri "$url/health"` — simple and reliable |

---

## Verified Working Package Versions (March 2026)

### Backend (Python)
```
fastapi          (latest ~0.115.x)
uvicorn          (latest ~0.34.x)
pydantic         (latest ~2.10.x)
```

### Frontend (Node.js)
```
express          ^4.18.2
```

### Docker Base
```
node:18-alpine + apk add python3 py3-pip
```
