# Antarman - Deploy to Cloud Run
# Reads GEMINI_API_KEY from .env automatically
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy.ps1

$ErrorActionPreference = "Stop"

# Config
$projectId    = "genai-cloudrun-vikas"
$region       = "europe-west1"
$serviceName  = "genai-service"
$saEmail      = "genai-run-sa@genai-cloudrun-vikas.iam.gserviceaccount.com"
$memory       = "512Mi"
$timeout      = "300"
$maxInstances = "2"
$apiUrl       = "http://127.0.0.1:8000"

# Read GEMINI_API_KEY from .env
$geminiKey = ""
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^GEMINI_API_KEY=(.+)$") {
            $geminiKey = $matches[1].Trim()
        }
    }
}

if (-not $geminiKey) {
    Write-Host "WARNING: GEMINI_API_KEY not found in .env - LLM features will be disabled." -ForegroundColor Yellow
} else {
    Write-Host "GEMINI_API_KEY loaded from .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deploying Antarman to Cloud Run..." -ForegroundColor Cyan
Write-Host "  Project : $projectId"
Write-Host "  Service : $serviceName"
Write-Host "  Region  : $region"
Write-Host ""

$ErrorActionPreference = "Continue"
gcloud config set project $projectId 2>&1 | Out-Null
gcloud config set run/region $region 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

$envVars = "API_URL=$apiUrl,PROJECT_ID=$projectId,REGION=$region"
if ($geminiKey) {
    $envVars = $envVars + ",GEMINI_API_KEY=" + $geminiKey
}

gcloud run deploy $serviceName `
  --source . `
  --region $region `
  --project $projectId `
  --service-account $saEmail `
  --allow-unauthenticated `
  --memory $memory `
  --timeout $timeout `
  --max-instances $maxInstances `
  --port 8080 `
  --set-env-vars $envVars

$serviceUrl = gcloud run services describe $serviceName `
  --region $region `
  --project $projectId `
  --format "value(status.url)"

Write-Host ""
Write-Host "DEPLOYED!" -ForegroundColor Green
Write-Host "URL: $serviceUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test:   .\test.ps1 $serviceUrl"
Write-Host ("Delete: gcloud run services delete " + $serviceName + " --region " + $region + " --project " + $projectId + " --quiet")
Write-Host ""
