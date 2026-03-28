# 🧪 Testing Skill

## 🎯 Goal

Quick smoke tests to verify the app works before demo.

---

## 🏃 Quick Test

### Local
```powershell
.\test.ps1
# defaults to http://localhost:8080
```

### Production (after deploy)
```powershell
.\test.ps1 https://your-service-url.run.app
```

---

## 📋 What test.ps1 Checks

1. **Health** — `/health` returns `{"status": "ok"}`
2. **Frontend** — root URL returns HTTP 200

Add app-specific tests per project.

---

## 🔧 Manual Testing

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:8080/health"

# Frontend loads
Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing

# API call (example)
$body = @{ text = "hello" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/your-endpoint" -Method Post -ContentType "application/json" -Body $body
```

---

## 🐛 Troubleshooting

| Issue | Fix |
|---|---|
| Connection refused | Start backend + frontend first |
| 502 Bad Gateway | Backend not running or crashed — check logs |
| Cold start timeout | First request after deploy takes 5-10s — retry |
| CORS error | Both services in same container — shouldn't happen |

---

## 📊 Performance Targets

| Metric | Target |
|---|---|
| `/health` | < 100ms |
| Frontend load | < 2s |
| API response | < 5s |
| Cold start | < 10s |
