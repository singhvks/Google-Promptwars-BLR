/**
 * Feature: Log New Event (LIVE LLM)
 * User types any life event → Gemini classifies + scores it in real-time.
 *
 * This is the DEMO KILLER FEATURE — shows live AI judgment.
 * Navigates back to: 'dashboard'
 */

const EXAMPLE_EVENTS = [
  'Went to the gym for 45 mins',
  'Ate junk food for dinner',
  'Stayed up till 2am working',
  'Had a great meeting with my mentor',
  'Called mom for an hour',
  'Completed an online course chapter',
  'Skipped lunch due to deadlines',
  'Took a peaceful 30-min walk',
];

App.registerView('log-event', {

  render() {
    const chips = EXAMPLE_EVENTS.map(e =>
      `<button class="log-example-chip" data-example="${e}">${e}</button>`
    ).join('');

    return `<div class="log-event-view">

      <div class="log-event-header">
        ${App.utils.backBtn()}
        <span class="header-title">Log a Life Event</span>
      </div>

      <div class="log-event-content">

        <!-- Input -->
        <div class="log-input-card">
          <div class="log-input-label">What happened?</div>
          <textarea class="log-textarea" id="log-textarea"
            placeholder="Describe what you did, skipped, or experienced today…"
            rows="3"></textarea>
          <button class="log-submit-btn" id="log-submit">
            <span class="btn-icon">🕉️</span>
            <span>Analyze with अंतर्मन</span>
          </button>
        </div>

        <!-- Examples -->
        <div class="log-examples">
          <div class="log-examples-title">Tap to try</div>
          <div class="log-example-chips">${chips}</div>
        </div>

        <!-- Result slot -->
        <div id="log-result-slot"></div>

      </div>
    </div>`;
  },

  async mount(container) {
    const textarea  = container.querySelector('#log-textarea');
    const submitBtn = container.querySelector('#log-submit');
    const slot      = container.querySelector('#log-result-slot');

    // Back button
    container.querySelector('#back-btn')?.addEventListener('click', () => {
      App.navigateTo('dashboard');
    });

    // Example chips
    container.querySelectorAll('.log-example-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        textarea.value = chip.dataset.example;
        textarea.focus();
      });
    });

    // Submit
    async function analyze() {
      const text = textarea.value.trim();
      if (!text) { App.utils.showToast('Describe an event first', 'error'); return; }

      // Loading state
      slot.innerHTML = `<div class="log-analyzing">
        <div class="analyzing-rings">
          <div class="analyzing-ring"></div>
          <div class="analyzing-ring"></div>
        </div>
        <div class="analyzing-text">अंतर्मन is reading your life…</div>
      </div>`;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner"></div><span>Analyzing…</span>';

      try {
        const result = await App.api.classifyEvent(text);
        _renderResult(slot, text, result);
      } catch (err) {
        slot.innerHTML = `<div class="error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-title">Analysis failed</div>
          <div class="error-text">${err.message}</div>
        </div>`;
        App.utils.showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">🕉️</span><span>Analyze with अंतर्मन</span>';
      }
    }

    submitBtn.addEventListener('click', analyze);

    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); }
    });
  },
});

function _renderResult(slot, originalText, result) {
  const u     = App.utils;
  const delta = parseFloat(result.score_delta) || 0;
  const dStr  = u.deltaStr(delta);
  const dCls  = u.deltaClass(delta);

  const tags = (result.pillars_affected || []).map(p =>
    `<span class="tag tag-${p}">${u.pillarIcon[p]} ${u.pillarLabel[p]}</span>`
  ).join('');

  slot.innerHTML = `<div class="log-result">

    <div class="log-result-header">
      <div class="log-result-title">Score Impact</div>
      <div class="log-result-delta ${dCls}" id="log-delta-val">0</div>
    </div>

    <div class="log-result-tags">${tags}</div>

    <div style="margin:4px 0">
      ${u.impactBars(result.impact || {})}
    </div>

    <div class="log-result-nudge">
      "${result.nudge || 'Your अंतर्मन has noted this event.'}"
    </div>

    ${result.metrics ? `<div style="font-size:0.75rem; color:var(--text-muted); text-align:center; margin:16px 0 8px; font-family:monospace">⚡ Gemini Analysis: ${result.metrics.response_time_ms}ms</div>` : ''}

    <div class="log-result-actions">
      <button class="log-again-btn" id="log-again-btn">← Try Another</button>
      <button class="log-done-btn" id="log-done-btn">Back to Dashboard</button>
    </div>

  </div>`;

  // Animate delta counter
  const deltaEl = slot.querySelector('#log-delta-val');
  if (deltaEl) {
    const steps = 40;
    let current = 0;
    const step  = delta / steps;
    const sign  = delta >= 0 ? '+' : '';
    let i = 0;
    const tick = setInterval(() => {
      current += step;
      i++;
      if (i >= steps) {
        clearInterval(tick);
        deltaEl.textContent = sign + delta.toFixed(1);
      } else {
        deltaEl.textContent = sign + current.toFixed(1);
      }
    }, 22);
  }

  // Animate impact bars
  setTimeout(() => App.utils.animateImpactBars(), 100);

  // Buttons
  slot.querySelector('#log-again-btn')?.addEventListener('click', () => {
    slot.innerHTML = '';
    document.querySelector('#log-textarea').value = '';
    document.querySelector('#log-textarea').focus();
  });

  slot.querySelector('#log-done-btn')?.addEventListener('click', () => {
    App.navigateTo('dashboard');
  });
}
