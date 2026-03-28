# ☁️ Cloud Run Deploy Skill

## 🎯 Goal

Deploy to Google Cloud Run with one command. No manual config.

---

## 📋 Prerequisites

1. ✅ `gcloud` CLI installed and authenticated (`gcloud auth login`)
2. ✅ GCP project with billing enabled
3. ✅ Service Account with roles: `roles/run.admin`, `roles/storage.admin`
4. ✅ APIs enabled: `run.googleapis.com`, `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`

Enable APIs:
```powershell
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

---

## 🚀 Deploy (One Command)

```powershell
.\deploy.ps1
```

That's it. Config is hardcoded in `deploy.ps1`:
- Project: `genai-cloudrun-vikas`
- Region: `us-central1`
- Service Account: `genai-run-sa@genai-cloudrun-vikas.iam.gserviceaccount.com`

---

## 🧪 Test After Deploy

```powershell
.\test.ps1 <service-url>
```

---

## 🔄 Redeploy After Code Changes

Same command:
```powershell
.\deploy.ps1
```

---

## 🗑️ Stop/Delete Service

```powershell
gcloud run services delete genai-service --region us-central1 --project genai-cloudrun-vikas --quiet
```

---

## ⚠️ PowerShell Gotchas

| Issue | Fix |
|---|---|
| `--format="value(x)"` fails | Use `--format "value(x)"` (space, not `=`) |
| `-or` for defaults | Use `if (-not $var) { $var = "default" }` |
| Script won't run | `powershell -ExecutionPolicy Bypass -File .\deploy.ps1` |

See `learnings/deployment_errors.md` for full reference.

---

## 📈 Cost (Hackathon ~24hrs)

| Component | Cost |
|---|---|
| Cloud Run (512Mi, max 2 instances) | ~$0.05 |
| Cloud Build | ~$0.01 |
| **Total** | **~$0.06** |

Set `--max-instances 1` to cut cost further.
