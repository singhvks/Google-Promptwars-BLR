/**
 * Feature: What If? Scenario Simulation
 * Projects Hero Score trajectory for a given life decision.
 *
 * Uses cache-first → LLM fallback on backend.
 * Navigates back to: 'dashboard'
 */

const PRESETS = [
  'skip the gym for a week',
  'work on weekends',
  'start meditating',
  'stop sleeping early',
  'take a new job',
];

App.registerView('whatif', {

  render() {
    const presetButtons = PRESETS.map(p =>
      `<button class="preset-btn" data-scenario="${p}">"${p}"</button>`
    ).join('');

    return `<div class="whatif-view">

      <div class="whatif-header">
        ${App.utils.backBtn()}
        <span class="header-title">What If?</span>
      </div>

      <div class="whatif-content">

        <!-- Input -->
        <div class="whatif-input-section">
          <div class="whatif-input-label">Ask your अंतर्मन</div>
          <div class="whatif-input-wrap">
            <span class="whatif-prefix">What if I…</span>
            <textarea class="whatif-input" id="whatif-input"
              placeholder="skip the gym for a week"
              rows="2"></textarea>
          </div>
          <div style="margin-top:10px;text-align:right">
            <button class="whatif-submit-btn" id="whatif-submit">
              <span>Simulate</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <!-- Presets -->
        <div class="preset-scenarios">
          <div class="preset-title">Quick scenarios</div>
          <div class="preset-list">${presetButtons}</div>
        </div>

        <!-- Results slot -->
        <div id="whatif-results-slot"></div>

      </div>
    </div>`;
  },

  async mount(container) {
    const input    = container.querySelector('#whatif-input');
    const submitBtn = container.querySelector('#whatif-submit');
    const slot      = container.querySelector('#whatif-results-slot');

    // Back button
    container.querySelector('#back-btn')?.addEventListener('click', () => {
      App.navigateTo('dashboard');
    });

    // Preset chips
    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.scenario;
        input.focus();
      });
    });

    // Submit
    async function runSimulation() {
      const scenario = input.value.trim();
      if (!scenario) { App.utils.showToast('Describe a scenario first', 'error'); return; }

      // Loading state
      slot.innerHTML = `<div class="whatif-loading">
        <div class="loading-ring"></div>
        <div class="whatif-loading-text">अंतर्मन is simulating your future…</div>
      </div>`;

      submitBtn.disabled = true;
      submitBtn.textContent = '…';

      try {
        const data = await App.api.whatif(scenario);
        _renderResults(slot, scenario, data);
      } catch (err) {
        slot.innerHTML = `<div class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-title">Simulation failed</div>
          <div class="error-text">${err.message}</div>
        </div>`;
        App.utils.showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Simulate</span><span>→</span>';
      }
    }

    submitBtn.addEventListener('click', runSimulation);

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runSimulation(); }
    });
  },
});

function _renderResults(slot, scenario, data) {
  const u      = App.utils;
  const scores = data.projected_scores || [];
  const start  = scores[0] || 62;
  const end    = scores[scores.length - 1] || 62;
  const diff   = end - start;
  const dStr   = u.deltaStr(diff);
  const dCls   = u.deltaClass(diff);

  const dayLabels = scores.map((_, i) =>
    `<span class="chart-day-label">Day ${i + 1}</span>`
  ).join('');

  slot.innerHTML = `<div class="whatif-results">

    <!-- Chart Card -->
    <div class="chart-card">
      <div class="chart-title">7-Day Hero Score Projection</div>
      <div class="chart-wrap">
        ${u.projectedChart(scores)}
      </div>
      <div class="chart-day-labels">${dayLabels}</div>

      <div class="score-range" style="margin-top:14px">
        <div class="score-range-item">
          <div class="score-range-value" style="color:var(--text-muted)">${start}</div>
          <div class="score-range-label">Today</div>
        </div>
        <div class="score-range-item" style="text-align:center">
          <div class="score-range-value ${dCls}">${dStr}</div>
          <div class="score-range-label">Change</div>
        </div>
        <div class="score-range-item" style="text-align:right">
          <div class="score-range-value ${dCls}">${end}</div>
          <div class="score-range-label">Day 7</div>
        </div>
      </div>
    </div>

    <!-- Warning -->
    <div class="whatif-warning">
      <div class="whatif-warning-icon">🕉️</div>
      <div class="whatif-warning-text">${data.warning}</div>
    </div>

    ${data.metrics ? `<div style="font-size:0.75rem; color:var(--text-muted); text-align:right; margin-top:12px; font-family:monospace">⚡ Time: ${data.metrics.response_time_ms}ms ${data.metrics.cached ? '(Cached)' : '(Live)'}</div>` : ''}

  </div>`;
}
