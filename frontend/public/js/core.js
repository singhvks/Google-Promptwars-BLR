/**
 * अंतर्मन (Antarman) — Core App Framework
 *
 * Provides the global `App` object used by all feature files.
 * Features register themselves via App.registerView(name, { render, mount, unmount? })
 *
 * HOW TO ADD A NEW FEATURE:
 *   1. Create js/features/my-feature.js
 *   2. Call App.registerView('my-feature', { render, mount }) at the bottom
 *   3. Add <script src="js/features/my-feature.js"></script> to index.html
 *   4. Add <link rel="stylesheet" href="css/features/my-feature.css"> to index.html
 *   5. Navigate to it with: App.navigateTo('my-feature')
 */

window.App = {
  // ─── State ───────────────────────────────────────────────────────────────
  state: {
    dashboard: null,
    events: null,
    currentView: null,
    params: {},
  },

  // ─── View Registry ────────────────────────────────────────────────────────
  _views: {},

  registerView(name, { render, mount, unmount }) {
    this._views[name] = {
      render,
      mount,
      unmount: unmount || (() => {}),
    };
  },

  // ─── Navigation ──────────────────────────────────────────────────────────
  async navigateTo(viewName, params = {}) {
    const root = document.getElementById('view-root');

    // Unmount previous view
    if (this.state.currentView && this._views[this.state.currentView]?.unmount) {
      this._views[this.state.currentView].unmount();
    }

    this.state.currentView = viewName;
    this.state.params = params;

    const view = this._views[viewName];
    if (!view) {
      root.innerHTML = `<div class="error-state"><div class="error-icon">🧩</div><div class="error-title">View not found</div><div class="error-text">No feature registered for "${viewName}"</div></div>`;
      return;
    }

    // Render HTML
    root.innerHTML = view.render(params);

    // Scroll to top
    window.scrollTo(0, 0);

    // Mount (attach events, animate)
    try {
      await view.mount(root, params);
    } catch (err) {
      console.error(`Error mounting view "${viewName}":`, err);
    }
  },

  // ─── API Client ───────────────────────────────────────────────────────────
  api: {
    async _get(path) {
      const r = await fetch(path);
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: r.statusText }));
        throw new Error(err.detail || err.error || r.statusText);
      }
      return r.json();
    },

    async _post(path, body) {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: r.statusText }));
        throw new Error(err.detail || err.error || r.statusText);
      }
      return r.json();
    },

    dashboard:     ()    => App.api._get('/api/dashboard'),
    events:        ()    => App.api._get('/api/events'),
    nudge:         ()    => App.api._get('/api/nudge'),
    classifyEvent: (text) => App.api._post('/api/classify-event', { event_text: text }),
    whatif:        (scenario) => App.api._post('/api/whatif', { scenario }),
  },

  // ─── Shared Utilities ─────────────────────────────────────────────────────
  utils: {
    pillarColor: {
      dharma: '#E69F00',   // Orange
      artha:  '#009E73',   // Bluish Green
      kama:   '#D55E00',   // Vermillion
      moksha: '#56B4E9',   // Sky Blue
    },

    pillarIcon: {
      dharma: '⚖️',
      artha:  '💰',
      kama:   '❤️',
      moksha: '🕊️',
    },

    pillarLabel: {
      dharma: 'Dharma',
      artha:  'Artha',
      kama:   'Kama',
      moksha: 'Moksha',
    },

    pillarBg: {
      dharma: 'var(--dharma-dim)',
      artha:  'var(--artha-dim)',
      kama:   'var(--kama-dim)',
      moksha: 'var(--moksha-dim)',
    },

    // ── SVG Score Ring (Chakra) ───────────────────────────────────────────
    scoreRing(score, size = 148, color = '#FFB800') {
      const cx = size / 2;
      const cy = size / 2;
      const r  = size * 0.376;
      const innerR = size * 0.28;
      const sw = size * 0.082;
      const circumference = 2 * Math.PI * r;
      const offset = circumference - (Math.min(score, 100) / 100) * circumference;
      const fs = size * 0.19;
      const fsl = size * 0.076;

      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="score-ring" role="img" aria-label="Chakra Score: ${score}">
        <title>Chakra Score indicating overall life balance</title>
        <!-- Chakra Spokes -->
        <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="rgba(255,184,0,0.15)" stroke-width="4" stroke-dasharray="2 6" aria-hidden="true"/>
        <!-- Background Track -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1C2130" stroke-width="${sw}" aria-hidden="true"/>
        <!-- Progress Ring -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}"
          stroke-width="${sw}" stroke-dasharray="${circumference.toFixed(2)}"
          stroke-dashoffset="${circumference.toFixed(2)}"
          stroke-linecap="round"
          transform="rotate(-90 ${cx} ${cy})"
          data-target-offset="${offset.toFixed(2)}"
          class="ring-progress"
          role="progressbar" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100"/>
        <text x="${cx}" y="${cy - 3}" text-anchor="middle" class="ring-score-text" font-size="${fs}">${score}</text>
        <text x="${cx}" y="${cy + fs * 0.65}" text-anchor="middle" class="ring-label-text" font-size="${fsl}">CHAKRA SCORE</text>
      </svg>`;
    },

    // ── Mini Sparkline ────────────────────────────────────────────────────
    miniSparkline(data, color, w = 80, h = 24) {
      if (!data || data.length < 2) return '';
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;
      const pad = 2;
      const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * (w - pad * 2) + pad;
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <polyline points="${pts}" fill="none" stroke="${color}"
          stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    },

    // ── Projected Chart (What If) ─────────────────────────────────────────
    projectedChart(scores, gradientId = 'chartGrad') {
      const w = 400, h = 120;
      const minS = Math.min(...scores);
      const maxS = Math.max(...scores);
      const range = maxS - minS || 10;
      const padT = 18, padB = 4;

      const pts = scores.map((s, i) => {
        const x = (i / (scores.length - 1)) * w;
        const y = padT + (1 - (s - minS) / range) * (h - padT - padB);
        return { x, y, s };
      });

      const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
      const area = [...pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
                    `${w},${h}`, `0,${h}`].join(' ');

      const isDropping = scores[scores.length - 1] < scores[0];
      const lineColor  = isDropping ? '#FF4D4D' : '#00D4AA';
      const stopColor  = isDropping ? '#FF4D4D' : '#00D4AA';

      const circles = pts.map(p =>
        `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${lineColor}"/>
         <text x="${p.x.toFixed(1)}" y="${(p.y - 7).toFixed(1)}" text-anchor="middle"
           font-family="Outfit,sans-serif" font-size="9" fill="var(--text-muted)">${p.s}</text>`
      ).join('');

      return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="overflow:visible">
        <defs>
          <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${stopColor}" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="${stopColor}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="${area}" fill="url(#${gradientId})"/>
        <polyline points="${polyline}" fill="none" stroke="${lineColor}"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${circles}
      </svg>`;
    },

    // ── Impact Bars ───────────────────────────────────────────────────────
    impactBars(impact) {
      const pillars = ['dharma', 'artha', 'kama', 'moksha'];
      return pillars.map(p => {
        const v = impact[p] || 0;
        const color = App.utils.pillarColor[p];
        const pct = (Math.abs(v) / 15) * 100;
        const isPos = v >= 0;
        const barColor = isPos ? color : 'var(--danger)';

        return `<div class="impact-row">
          <div class="impact-label">
            <span class="impact-label-icon">${App.utils.pillarIcon[p]}</span>
            <span class="impact-label-text">${App.utils.pillarLabel[p]}</span>
          </div>
          <div class="impact-bar-track">
            <div class="impact-bar-fill" style="width:0%;background:${barColor}" data-target-width="${pct}%"></div>
          </div>
          <span class="impact-value ${isPos ? 'pos' : 'neg'}">${v > 0 ? '+' : ''}${v}</span>
        </div>`;
      }).join('');
    },

    // ── Animate Impact Bars ───────────────────────────────────────────────
    animateImpactBars() {
      requestAnimationFrame(() => {
        document.querySelectorAll('.impact-bar-fill[data-target-width]').forEach(el => {
          const target = el.dataset.targetWidth;
          el.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
          el.style.width = target;
        });
      });
    },

    // ── Animate Score Ring ────────────────────────────────────────────────
    animateRings() {
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.querySelectorAll('.ring-progress').forEach(el => {
            el.style.strokeDashoffset = el.getAttribute('data-target-offset');
          });
        }, 80);
      });
    },

    // ── Format Helpers ────────────────────────────────────────────────────
    formatTime(iso) {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    },

    formatDate(iso) {
      const d = new Date(iso);
      const today    = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      if (d.toDateString() === today.toDateString())    return 'Today';
      if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
      return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    },

    deltaStr(delta) {
      return (delta >= 0 ? '+' : '') + (parseFloat(delta) || 0).toFixed(1);
    },

    deltaClass(delta) {
      return delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'neutral';
    },

    // ── Back Button HTML ──────────────────────────────────────────────────
    backBtn(label = 'Back') {
      return `<button class="header-back-btn" id="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        ${label}
      </button>`;
    },

    // ── Toast ─────────────────────────────────────────────────────────────
    showToast(message, type = 'info') {
      document.querySelectorAll('.toast').forEach(t => t.remove());
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },
  },

  // ─── Init ─────────────────────────────────────────────────────────────────
  async init() {
    try {
      const [dashboard, events] = await Promise.all([
        this.api.dashboard(),
        this.api.events(),
      ]);
      this.state.dashboard = dashboard;
      this.state.events    = events;
    } catch (err) {
      console.error('Failed to load data:', err);
      document.getElementById('view-root').innerHTML = `
        <div class="error-state" style="padding-top:100px">
          <div class="error-icon">⚠️</div>
          <div class="error-title">Backend Offline</div>
          <div class="error-text">Start the FastAPI server on port 8000.<br><code>cd backend && python -m uvicorn main:app --reload --port 8000</code></div>
        </div>`;
      return;
    }

    await this.navigateTo('dashboard');
  },
};

// All feature scripts run synchronously before DOMContentLoaded —
// so by the time init() is called, all views are already registered.
document.addEventListener('DOMContentLoaded', () => App.init());
