/**
 * Feature: Dashboard
 * Shows the Hero Score ring, 4 pillar cards, life events list, and nudge banner.
 *
 * Navigates to:
 *   - 'event-detail' (on event click)
 *   - 'log-event'    (on "+ Log Event" button)
 *   - 'whatif'       (on "What If?" button)
 */

App.registerView('dashboard', {

  render() {
    const { dashboard, events } = App.state;
    if (!dashboard) return '<div class="loading-screen"><div class="loading-ring"></div></div>';

    const u = App.utils;
    const pillars = ['dharma', 'artha', 'kama', 'moksha'];

    // ── Pillar Cards ────────────────────────────────────────────
    const pillarCards = pillars.map(p => {
      const pd    = dashboard.pillars[p];
      const color = u.pillarColor[p];
      const tIcon = pd.trend === 'up' ? '↑' : pd.trend === 'down' ? '↓' : '→';
      const tCls  = `trend-${pd.trend === 'up' ? 'up' : pd.trend === 'down' ? 'down' : 'stable'}`;

      // Paint Completion Ring for score
      const pR = 14;
      const circ = 2 * Math.PI * pR;
      const off  = circ - (Math.min(pd.score, 100) / 100) * circ;
      const ringSvg = `<svg width="34" height="34" viewBox="0 0 34 34" style="transform:rotate(-90deg)">
        <circle cx="17" cy="17" r="${pR}" fill="none" stroke="var(--surface-2)" stroke-width="4"/>
        <circle cx="17" cy="17" r="${pR}" fill="none" stroke="${color}" stroke-width="4"
          stroke-dasharray="${circ}" stroke-dashoffset="${off}" stroke-linecap="round"/>
      </svg>`;

      return `<div class="pillar-card" data-pillar="${p}" style="--pillar-color:${color}" id="pillar-${p}">
        <div class="pillar-icon">${u.pillarIcon[p]}</div>
        <div class="pillar-label">${u.pillarLabel[p]}</div>
        <div class="pillar-score-row" style="display:flex; align-items:center; gap:8px;">
          ${ringSvg}
          <div style="display:flex; flex-direction:column;">
            <span class="pillar-score" style="color:${color}; font-size:1.2rem;">${pd.score}</span>
            <span class="pillar-trend ${tCls}" style="font-size:0.75rem">${tIcon}</span>
          </div>
        </div>
        <div class="pillar-insight">${pd.insight}</div>
        <div class="pillar-sparkline">${u.miniSparkline(pd.trend_7d, color)}</div>
      </div>`;
    }).join('');

    // ── Events List ─────────────────────────────────────────────
    const eventItems = events.map(e => {
      const delta    = parseFloat(e.score_delta) || 0;
      const dStr     = u.deltaStr(delta);
      const dCls     = u.deltaClass(delta);
      const icon     = e.completed ? '✅' : '⏳';
      const day      = u.formatDate(e.time);
      const time     = u.formatTime(e.time);

      const sourceTag = e.source ? `<span style="font-size:0.6rem; background:var(--surface-2); padding:2px 6px; border-radius:4px; margin-right:6px; color:var(--text-muted); text-transform:uppercase">${e.source}</span>` : '';

      return `<div class="event-item ${e.completed ? 'completed' : 'upcoming'}" data-event-id="${e.id}" id="event-${e.id}">
        <span class="event-status">${icon}</span>
        <div class="event-body">
          <div class="event-time">${day} · ${time}</div>
          <div class="event-title">${sourceTag}${e.title}</div>
        </div>
        <span class="event-delta ${dCls}">${dStr}</span>
      </div>`;
    }).join('');

    // ── Nudge Banner ─────────────────────────────────────────────
    const nxt = dashboard.next_nudge_event;
    const nudge = nxt ? `
      <div class="nudge-banner" id="nudge-banner">
        <div class="nudge-icon">⚠️</div>
        <div class="nudge-body">
          <div class="nudge-title">अंतर्मन warns: <strong>${nxt.title}</strong></div>
          <div class="nudge-text">${nxt.nudge}</div>
        </div>
      </div>` : '';

    return `<div class="dashboard-view">
      <header class="app-header">
        <div>
          <div class="app-title">अंतर्मन</div>
          <div class="app-subtitle">${dashboard.name} · ${dashboard.hero_archetype}</div>
        </div>
      </header>

      <div class="hero-score-section">
        <div class="hero-score-ring-wrap">
          <div class="hero-score-glow"></div>
          ${App.utils.scoreRing(dashboard.hero_score)}
        </div>
      </div>

      <div class="pillars-grid">${pillarCards}</div>

      ${nudge}

      <div class="events-section">
        <div class="section-header">
          <h2>Life Events</h2>
          <span class="section-subtitle">This week</span>
        </div>
        <div class="events-list">${eventItems}</div>
      </div>

      <div class="action-bar">
        <button class="action-btn primary" id="btn-log-event">+ Log Event</button>
        <button class="action-btn secondary" id="btn-whatif">What If?</button>
      </div>
    </div>`;
  },

  async mount(container) {
    // Animate score ring
    App.utils.animateRings();

    // Log Event button
    container.querySelector('#btn-log-event')?.addEventListener('click', () => {
      App.navigateTo('log-event');
    });

    // What If button
    container.querySelector('#btn-whatif')?.addEventListener('click', () => {
      App.navigateTo('whatif');
    });

    // Event items → detail view
    container.querySelectorAll('.event-item').forEach(el => {
      el.addEventListener('click', () => {
        const eventId = el.dataset.eventId;
        const event   = App.state.events.find(e => e.id === eventId);
        if (event) App.navigateTo('event-detail', { event });
      });
    });

    // Pillar cards (future: pillar drill-down view)
    container.querySelectorAll('.pillar-card').forEach(el => {
      el.title = `Click to see ${el.dataset.pillar} details`;
    });
  },
});
