/**
 * Feature: Event Detail
 * Shows pillar impact breakdown, nudge, and action buttons for a single event.
 *
 * Receives params: { event }
 * Navigates back to: 'dashboard'
 */

App.registerView('event-detail', {

  render({ event }) {
    if (!event) return '<div class="error-state"><div class="error-icon">🔍</div><div class="error-title">No event selected</div></div>';

    const u     = App.utils;
    const delta = parseFloat(event.score_delta) || 0;
    const dStr  = u.deltaStr(delta);
    const dCls  = u.deltaClass(delta);
    const day   = u.formatDate(event.time);
    const time  = u.formatTime(event.time);
    const color = u.pillarColor[event.category] || 'var(--accent)';

    return `<div class="event-detail-view">

      <div class="event-detail-header">
        ${u.backBtn()}
        <span class="header-title">Event Detail</span>
      </div>

      <div class="event-detail-content">

        <!-- Title Card -->
        <div class="event-title-card">
          <div class="event-detail-title">${event.title}</div>
          <div class="event-detail-meta">
            <span class="event-detail-time">📅 ${day} · ${time}</span>
            <span class="tag tag-${event.category}">${u.pillarIcon[event.category]} ${u.pillarLabel[event.category]}</span>
          </div>
        </div>

        <!-- Score Delta -->
        <div class="score-delta-display">
          <div>
            <div class="score-delta-label">Hero Score Impact</div>
          </div>
          <div class="score-delta-value ${dCls}" id="delta-value">0</div>
        </div>

        <!-- Pillar Impact Bars -->
        <div class="impact-section">
          <div class="impact-section-title">Pillar Breakdown</div>
          ${u.impactBars(event.ai_score || {})}
        </div>

        <!-- Antarman Says -->
        <div class="antarman-says">
          <div class="antarman-says-icon">🕉️</div>
          <div class="antarman-says-body">
            <div class="antarman-says-label">अंतर्मन Says</div>
            <div class="antarman-says-text">"${event.nudge || 'Your inner voice observes this event.'}"</div>
          </div>
        </div>

        <!-- Decision Buttons (only for upcoming events) -->
        ${!event.completed ? `
        <div>
          <div class="impact-section-title" style="margin-bottom:10px">Your Decision</div>
          <div class="decision-buttons">
            <button class="decision-btn keep" id="btn-keep">
              <span class="decision-btn-icon">✅</span>Keep It
            </button>
            <button class="decision-btn reschedule" id="btn-reschedule">
              <span class="decision-btn-icon">📅</span>Reschedule
            </button>
            <button class="decision-btn skip" id="btn-skip">
              <span class="decision-btn-icon">❌</span>Skip
            </button>
          </div>
        </div>` : ''}

      </div>
    </div>`;
  },

  async mount(container, { event }) {
    // Back button
    container.querySelector('#back-btn')?.addEventListener('click', () => {
      App.navigateTo('dashboard');
    });

    // Animate score delta (counter tick)
    const deltaEl = container.querySelector('#delta-value');
    if (deltaEl) {
      const target = parseFloat(event.score_delta) || 0;
      const steps  = 40;
      let current  = 0;
      const step   = target / steps;
      const sign   = target >= 0 ? '+' : '';

      let i = 0;
      const tick = setInterval(() => {
        current += step;
        i++;
        if (i >= steps) {
          clearInterval(tick);
          deltaEl.textContent = sign + target.toFixed(1);
        } else {
          deltaEl.textContent = sign + current.toFixed(1);
        }
      }, 25);
    }

    // Animate impact bars
    setTimeout(() => App.utils.animateImpactBars(), 100);

    // Decision buttons
    container.querySelector('#btn-keep')?.addEventListener('click', () => {
      App.utils.showToast('Event kept — noted by अंतर्मन 🕉️', 'success');
      setTimeout(() => App.navigateTo('dashboard'), 1500);
    });

    container.querySelector('#btn-reschedule')?.addEventListener('click', () => {
      App.utils.showToast('Marked for rescheduling ✓', 'info');
      setTimeout(() => App.navigateTo('dashboard'), 1500);
    });

    container.querySelector('#btn-skip')?.addEventListener('click', () => {
      App.utils.showToast('Event skipped — अंतर्मन will re-evaluate your score', 'info');
      setTimeout(() => App.navigateTo('dashboard'), 1500);
    });
  },
});
