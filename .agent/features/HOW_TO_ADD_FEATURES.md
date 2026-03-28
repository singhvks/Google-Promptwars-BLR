# अंतर्मन — How to Add New Frontend Features

No redeployment needed. Just add files and refresh your browser.

---

## 3-Step Process

### Step 1: Create the JS feature file
```
js/features/my-feature.js
```
Copy `.agent/features/feature-template.js` and rename it.
The template has all the API calls, utilities, and navigation patterns documented inline.

### Step 2: Create the CSS file (optional, if you need custom styles)
```
css/features/my-feature.css
```

### Step 3: Add 2 lines to `frontend/public/index.html`

In the **Feature Styles** section:
```html
<link rel="stylesheet" href="css/features/my-feature.css" />
```

In the **Feature Modules** section:
```html
<script src="js/features/my-feature.js"></script>
```

### Done. Refresh the browser.

---

## Navigate to Your Feature

From anywhere in the app, call:
```javascript
App.navigateTo('my-feature');
// or with params:
App.navigateTo('my-feature', { userId: 123, mode: 'edit' });
```

From a button in an existing feature:
```javascript
container.querySelector('#my-btn').addEventListener('click', () => {
  App.navigateTo('my-feature', { event: someEvent });
});
```

---

## Feature File Structure

```javascript
App.registerView('my-feature', {

  render(params) {
    // return HTML string — params = what was passed to navigateTo()
    return `<div class="my-feature-view">...</div>`;
  },

  async mount(container, params) {
    // Attach events, run animations, load data
    container.querySelector('#back-btn')?.addEventListener('click', () => {
      App.navigateTo('dashboard');
    });
  },

  unmount() {
    // cleanup (clear intervals, abort requests)
  },
});
```

---

## Available APIs (in `App.api`)

| Method | Description |
|---|---|
| `App.api.dashboard()` | Full dashboard data (pillar scores, hero score, next nudge) |
| `App.api.events()` | All life events |
| `App.api.nudge()` | Next upcoming event with warning |
| `App.api.classifyEvent(text)` | **LIVE LLM** — classify any event text |
| `App.api.whatif(scenario)` | **LLM** — project 7-day score trajectory |

---

## Preloaded State (available without API calls)

```javascript
App.state.dashboard   // dashboard data (loaded at startup)
App.state.events      // events array  (loaded at startup)
App.state.currentView // active view name
App.state.params      // params passed to current view
```

---

## Shared Utilities (in `App.utils`)

### Visual Components
- `App.utils.scoreRing(score, size?, color?)` → SVG score ring HTML
- `App.utils.miniSparkline(data[], color, w?, h?)` → SVG sparkline
- `App.utils.projectedChart(scores[])` → Full SVG area chart for What If
- `App.utils.impactBars(impact{})` → 4 pillar impact bar rows
- `App.utils.backBtn(label?)` → Back button HTML (ID: `#back-btn`)

### Animate (call after render)
- `App.utils.animateRings()` → animates all `.ring-progress` SVG elements
- `App.utils.animateImpactBars()` → animates all `.impact-bar-fill` elements

### Helpers
- `App.utils.showToast(msg, type?)` → floating toast (`'success'|'error'|'info'`)
- `App.utils.formatTime(iso)` → `"09:30 AM"`
- `App.utils.formatDate(iso)` → `"Today" | "Tomorrow" | "Mon, Mar 30"`
- `App.utils.deltaStr(delta)` → `"+8.1"` or `"-3.9"`
- `App.utils.deltaClass(delta)` → `"pos"` or `"neg"`

### Design Constants
- `App.utils.pillarColor` → `{ health: '#FF4D4D', wealth: '#00D4AA', ... }`
- `App.utils.pillarIcon` → `{ health: '🏃', wealth: '💰', ... }`
- `App.utils.pillarLabel` → `{ health: 'Health', wealth: 'Wealth', ... }`

---

## Current Feature Registry

| View Name | File | Description |
|---|---|---|
| `dashboard` | `js/features/dashboard.js` | Hero Score + pillar cards + events |
| `event-detail` | `js/features/event-detail.js` | Pillar breakdown + nudge + decision |
| `whatif` | `js/features/whatif.js` | Scenario simulation + chart |
| `log-event` | `js/features/log-event.js` | Live LLM classification |

---

## Adding a New API Endpoint

If your feature needs a new backend endpoint:

1. Add endpoint to `backend/main.py`
2. Add proxy route to `frontend/src/flows/analyze.js`
3. Add API method to `App.api` in `frontend/public/js/core.js`:
   ```javascript
   myNewEndpoint: (param) => App.api._get('/api/my-endpoint?param=' + param),
   ```
4. Call it in your feature: `const data = await App.api.myNewEndpoint('value');`

---

## Ideas for Future Features

- `pillar-detail` — Drill-down view for a single pillar with full 7-day chart
- `weekly-report` — Weekly life summary (Fitness-report-for-life)
- `onboarding` — Hero definition setup + weight slider
- `streaks` — Gamified streak tracking for habits
- `compare` — Before/after score comparison for a decision taken
