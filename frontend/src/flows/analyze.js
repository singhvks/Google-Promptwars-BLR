/**
 * अंतर्मन (Antarman) — Frontend Server
 *
 * Express server that:
 *   1. Serves static HTML/CSS/JS from /public
 *   2. Proxies /api/* calls to FastAPI backend (port 8000)
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || "http://127.0.0.1:8000";
const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.json());

// Static files
const publicPath = path.join(__dirname, "../../public");
app.use(express.static(publicPath));

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "antarman-frontend" });
});

// ─── API Proxy Helper ─────────────────────────────────────────────────────────
async function proxyGet(path, res) {
  try {
    const r = await fetch(`${API_URL}${path}`);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Backend unavailable", detail: err.message });
  }
}

async function proxyPost(path, body, res) {
  try {
    const r = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Backend unavailable", detail: err.message });
  }
}

// ─── Proxy Routes (add new features here) ────────────────────────────────────
app.get("/api/dashboard", (req, res) => proxyGet("/api/dashboard", res));

app.get("/api/events", (req, res) => proxyGet("/api/events", res));

app.get("/api/nudge", (req, res) => proxyGet("/api/nudge", res));

app.post("/api/classify-event", (req, res) =>
  proxyPost("/api/classify-event", req.body, res)
);

app.post("/api/whatif", (req, res) =>
  proxyPost("/api/whatif", req.body, res)
);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🕉️  Antarman frontend running on http://localhost:${PORT}`);
  console.log(`   Static files : ${publicPath}`);
  console.log(`   Backend API  : ${API_URL}`);
});
