/**
 * ─────────────────────────────────────────────────────────────────────────────
 * अंतर्मन Feature Template
 * Copy this file to: js/features/your-feature-name.js
 * Add matching CSS to: css/features/your-feature-name.css
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * STEP 1: Copy this file
 * STEP 2: Add to index.html:
 *   <link rel="stylesheet" href="css/features/your-feature-name.css" />
 *   <script src="js/features/your-feature-name.js"></script>
 * STEP 3: Navigate to it anywhere with:
 *   App.navigateTo('your-feature-name', { optionalParam: value })
 * STEP 4: Refresh browser — no restart needed
 *
 * API METHODS AVAILABLE:
 *   App.api.dashboard()             → GET /api/dashboard
 *   App.api.events()                → GET /api/events
 *   App.api.nudge()                 → GET /api/nudge
 *   App.api.classifyEvent(text)     → POST /api/classify-event
 *   App.api.whatif(scenario)        → POST /api/whatif
 *
 * UTILITY METHODS:
 *   App.utils.scoreRing(score)
 *   App.utils.miniSparkline(data, color)
 *   App.utils.projectedChart(scores)
 *   App.utils.impactBars(impact)
 *   App.utils.animateRings()
 *   App.utils.animateImpactBars()
 *   App.utils.backBtn(label?)
 *   App.utils.showToast(message, type?)   // type: 'success' | 'error' | 'info'
 *   App.utils.formatTime(iso)
 *   App.utils.formatDate(iso)
 *   App.utils.deltaStr(delta)
 *   App.utils.deltaClass(delta)
 *   App.utils.pillarColor  // { health, wealth, relationships, purpose }
 *   App.utils.pillarIcon   // { health, wealth, relationships, purpose }
 *   App.utils.pillarLabel  // { health, wealth, relationships, purpose }
 *
 * STATE AVAILABLE:
 *   App.state.dashboard   → /api/dashboard response (preloaded)
 *   App.state.events      → /api/events response (preloaded)
 *   App.state.currentView → name of active view
 *   App.state.params      → params passed to navigateTo
 */

App.registerView('your-feature-name', {

  /**
   * render(params) → returns HTML string for the view
   * params = the object passed to App.navigateTo('your-feature-name', params)
   */
  render(params) {
    return `
      <div class="your-feature-view">

        <!-- Standard header with back button -->
        <div style="display:flex;align-items:center;gap:12px;padding:20px 16px 16px;">
          ${App.utils.backBtn()}
          <span class="header-title">Your Feature Title</span>
        </div>

        <!-- Your content here -->
        <div style="padding:0 16px">
          <div class="card">
            <p style="color:var(--text-muted)">Your feature content goes here.</p>
            <p style="color:var(--accent);margin-top:8px">Passed params: ${JSON.stringify(params)}</p>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * mount(container, params) → attach event listeners, run animations
   * Called AFTER render() — the DOM is ready here.
   */
  async mount(container, params) {

    // Back button — always include this
    container.querySelector('#back-btn')?.addEventListener('click', () => {
      App.navigateTo('dashboard');
    });

    // Example: Load data from the API
    // try {
    //   const data = await App.api.dashboard();
    //   // update DOM with data
    // } catch (err) {
    //   App.utils.showToast(err.message, 'error');
    // }

    // Example: Navigate to another view
    // container.querySelector('#some-button')?.addEventListener('click', () => {
    //   App.navigateTo('other-view', { someParam: 'value' });
    // });

    // Example: Show a toast
    // App.utils.showToast('Feature loaded!', 'success');
  },

  /**
   * unmount() → cleanup when leaving this view (optional)
   * Clear intervals, abort requests, etc.
   */
  unmount() {
    // cleanup here
  },
});
