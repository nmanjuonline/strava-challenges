export const dashboard = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Strava Scout Watchtower</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #090d16;
    --bg-gradient: radial-gradient(circle at 85% 0%, rgba(252, 82, 0, 0.14) 0%, transparent 45%),
                   radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.08) 0%, transparent 40%),
                   #090d16;
    --card-bg: rgba(17, 24, 39, 0.72);
    --card-border: rgba(255, 255, 255, 0.08);
    --card-hover-border: rgba(252, 82, 0, 0.35);
    --card-hover-glow: 0 12px 32px -8px rgba(252, 82, 0, 0.2);
    --fg: #f8fafc;
    --fg-muted: #94a3b8;
    --fg-subtle: #64748b;
    --accent: #fc5200;
    --accent-light: #ff7a3d;
    --accent-glow: rgba(252, 82, 0, 0.3);
    --accent-gradient: linear-gradient(135deg, #fc5200 0%, #ff7a3d 100%);
    --cyan: #38bdf8;
    --emerald: #10b981;
    --amber: #f59e0b;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg-gradient);
    background-attachment: fixed;
    color: var(--fg);
    line-height: 1.6;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .mono { font-family: 'JetBrains Mono', monospace; }

  /* Navigation Bar */
  .nav-bar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(9, 13, 22, 0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--card-border);
    padding: 14px 24px;
  }
  .nav-container {
    max-width: 1120px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
  }
  .brand-icon {
    width: 36px;
    height: 36px;
    background: var(--accent-gradient);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    box-shadow: 0 4px 14px var(--accent-glow);
  }
  .brand-text {
    display: flex;
    flex-direction: column;
  }
  .brand-title {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .badge-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(252, 82, 0, 0.15);
    color: var(--accent-light);
    border: 1px solid rgba(252, 82, 0, 0.3);
  }
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .live-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--emerald);
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    padding: 6px 12px;
    border-radius: 9999px;
  }
  .beacon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--emerald);
    box-shadow: 0 0 10px var(--emerald);
    animation: pulse 2s infinite ease-in-out;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.85); }
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    text-decoration: none;
    font-family: inherit;
  }
  .btn-primary {
    background: var(--accent-gradient);
    color: #ffffff;
    box-shadow: 0 2px 10px var(--accent-glow);
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--accent-glow);
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn-ghost {
    background: rgba(255, 255, 255, 0.05);
    color: var(--fg-muted);
    border: 1px solid var(--card-border);
  }
  .btn-ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: var(--fg);
    border-color: rgba(255, 255, 255, 0.15);
  }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }

  /* Main Layout */
  main {
    max-width: 1120px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }

  /* Hero Section */
  .hero { margin-bottom: 36px; }
  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--accent-light);
    margin-bottom: 10px;
  }
  .hero h1 {
    font-size: clamp(2.2rem, 4vw, 3.2rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.15;
    margin-bottom: 10px;
  }
  .gradient-text {
    background: linear-gradient(135deg, #ffffff 40%, #fc5200 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-subtitle {
    color: var(--fg-muted);
    font-size: 15px;
    max-width: 680px;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 48px;
  }
  .stat-card {
    background: var(--card-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }
  .stat-card:hover {
    border-color: var(--card-hover-border);
    box-shadow: var(--card-hover-glow);
    transform: translateY(-2px);
  }
  .stat-card.featured {
    border-color: rgba(252, 82, 0, 0.4);
    background: linear-gradient(180deg, rgba(252, 82, 0, 0.08) 0%, rgba(17, 24, 39, 0.85) 100%);
    box-shadow: 0 4px 20px rgba(252, 82, 0, 0.1);
  }
  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .stat-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--fg-subtle);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .stat-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--card-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--fg-muted);
  }
  .stat-card.featured .stat-icon {
    background: rgba(252, 82, 0, 0.15);
    border-color: rgba(252, 82, 0, 0.3);
    color: var(--accent);
  }
  .stat-value {
    font-size: 1.45rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--fg);
    line-height: 1.25;
    margin-bottom: 8px;
  }
  .stat-meta {
    font-size: 12px;
    color: var(--fg-muted);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .countdown-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(56, 189, 248, 0.15);
    color: var(--cyan);
    border: 1px solid rgba(56, 189, 248, 0.3);
    width: fit-content;
    margin-top: 4px;
  }
  .stat-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--fg-muted);
    width: fit-content;
    margin-top: 4px;
  }
  .stat-tag.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--emerald);
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  /* Controls & Toolbar */
  .section-toolbar {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }
  .toolbar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .section-title {
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .counter-pill {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.07);
    color: var(--fg-muted);
  }
  .toolbar-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    width: 100%;
  }
  .search-box {
    position: relative;
    flex: 1;
    min-width: 260px;
  }
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--fg-subtle);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 10px 14px 10px 40px;
    color: var(--fg);
    font-size: 13px;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }
  .search-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(252, 82, 0, 0.15);
  }
  .search-input::placeholder { color: var(--fg-subtle); }
  .filter-chips {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .filter-chip {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--card-border);
    color: var(--fg-muted);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .filter-chip:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--fg);
  }
  .filter-chip.active {
    background: rgba(252, 82, 0, 0.15);
    border-color: rgba(252, 82, 0, 0.4);
    color: var(--accent-light);
  }

  /* Challenge Cards */
  .challenge-list {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .challenge-card {
    background: var(--card-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--card-border);
    border-radius: 14px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
  }
  .card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }
  .card-top-left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }
  .challenge-image {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
  }
  .challenge-card:hover {
    border-color: var(--card-hover-border);
    box-shadow: var(--card-hover-glow);
    transform: translateY(-2px);
  }
    flex-wrap: wrap;
  }
  .activity-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .activity-pill {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(56, 189, 248, 0.1);
    color: var(--cyan);
    border: 1px solid rgba(56, 189, 248, 0.25);
  }
  .date-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--fg-muted);
  }
  .challenge-title {
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--fg);
  }
  .challenge-desc {
    color: var(--fg-muted);
    font-size: 14px;
    line-height: 1.55;
  }
  .challenge-actions {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .btn-strava {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent-light);
    background: rgba(252, 82, 0, 0.1);
    border: 1px solid rgba(252, 82, 0, 0.25);
    padding: 6px 14px;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
  }
  .btn-strava:hover {
    background: rgba(252, 82, 0, 0.2);
    border-color: rgba(252, 82, 0, 0.5);
    color: #ffffff;
    transform: translateX(2px);
  }
  .btn-resend {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent-light);
    background: rgba(252, 82, 0, 0.1);
    border: 1px solid rgba(252, 82, 0, 0.25);
    padding: 6px 14px;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
  }
  .btn-resend:hover {
    background: rgba(252, 82, 0, 0.2);
    border-color: rgba(252, 82, 0, 0.5);
    color: #ffffff;
    transform: translateX(2px);
    cursor: pointer;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 64px 24px;
    background: var(--card-bg);
    border: 1px dashed var(--card-border);
    border-radius: 16px;
  }
  .empty-icon { font-size: 36px; margin-bottom: 12px; }
  .empty-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .empty-desc { font-size: 13px; color: var(--fg-muted); }

  /* Toast Notification */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .toast {
    background: #1e293b;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 12px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  @keyframes slideIn {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Responsive Design */
  @media (max-width: 960px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr; }
    .nav-container { flex-wrap: wrap; }
  }
</style>
</head>
<body>

<header class="nav-bar">
  <div class="nav-container">
    <a class="brand" href="/">
      <div class="brand-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
      <div class="brand-text">
        <div class="brand-title">
          Strava Watchtower
          <span class="badge-tag">Active</span>
        </div>
      </div>
    </a>
    <div class="nav-actions">
      <div class="live-indicator">
        <span class="beacon-dot"></span>
        <span>Scheduled 4x/day</span>
      </div>
      <button class="btn btn-ghost" id="btn-refresh" title="Refresh dashboard data">
        <svg id="refresh-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
        </svg>
        <span>Refresh</span>
      </button>
      <button class="btn btn-primary" id="btn-scan" title="Trigger an immediate scan">
        <svg id="scan-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span id="scan-btn-text">Scan Now</span>
      </button>
    </div>
  </div>
</header>

<main>
  <section class="hero">
    <div class="hero-eyebrow">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
      STRAVA SCOUT RADAR
    </div>
    <h1>Challenges worth <span class="gradient-text">showing up for.</span></h1>
    <p class="hero-subtitle" id="subtitle-status">Continuous forward scanner discovering new Strava challenges and dispatching instant Telegram notifications.</p>
  </section>

  <!-- 4-Column Stats Grid -->
  <section class="stats-grid">
    <!-- 1. Next Scheduled Scan (Featured Card) -->
    <div class="stat-card featured">
      <div class="stat-header">
        <div class="stat-label">Next Scheduled Scan</div>
        <div class="stat-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
      </div>
      <div>
        <div class="stat-value mono" id="next-scan-time">Calculating…</div>
        <div class="countdown-badge" id="next-scan-countdown">⏱ --</div>
      </div>
      <div class="stat-meta" style="margin-top: 10px;">
        <div id="next-scan-local-meta">Local Time</div>
        <div id="cadence-text" style="font-size: 11px; opacity: 0.7;">Cadence: 01:00, 07:00, 13:00 & 19:00 UTC (4x daily)</div>
      </div>
    </div>

    <!-- 2. Last Scan Executed -->
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-label">Last Scan Executed</div>
        <div class="stat-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
      </div>
      <div>
        <div class="stat-value mono" id="last-scan-time">—</div>
        <div class="stat-tag success" id="last-scan-result">—</div>
      </div>
      <div class="stat-meta" style="margin-top: 10px;">
        <div id="last-scan-relative">Awaiting first scan</div>
      </div>
    </div>

    <!-- 3. Total Detected -->
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-label">Detected Challenges</div>
        <div class="stat-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
            <path d="M4 22h16"></path>
            <path d="M10 14.66V17c0 .55-.45 1-1 1H7v2h10v-2h-2c-.55 0-1-.45-1-1v-2.34"></path>
            <path d="M6 5v6a6 6 0 0 0 12 0V5H6z"></path>
          </svg>
        </div>
      </div>
      <div>
        <div class="stat-value mono" id="total-detected-count">0</div>
        <div class="stat-tag">Persisted in D1</div>
      </div>
      <div class="stat-meta" style="margin-top: 10px;">
        <div>Telegram alerts dispatched</div>
      </div>
    </div>

    <!-- 4. Next Scan ID Target -->
    <div class="stat-card">
      <div class="stat-header">
        <div class="stat-label">Next Target ID</div>
        <div class="stat-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="7"></circle>
            <polyline points="12 9 12 12 13.5 13.5"></polyline>
            <path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"></path>
          </svg>
        </div>
      </div>
      <div>
        <div class="stat-value mono" id="next-id">—</div>
        <div class="stat-tag" id="consecutive-missing-tag">0 missing in a row</div>
      </div>
      <div class="stat-meta" style="margin-top: 10px;">
        <div>Sequential forward scan pointer</div>
      </div>
    </div>
  </section>

  <!-- Challenges Section -->
  <section>
    <div class="section-toolbar">
      <div class="toolbar-header">
        <div class="section-title">
          <span>Discovered Challenges</span>
          <span class="counter-pill" id="display-count">0</span>
        </div>
      </div>
      <div class="toolbar-controls">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-input" id="search-input" placeholder="Search by challenge name, activity (Run, Ride...), or ID…">
        </div>
        <div class="filter-chips" id="filter-chips">
          <button class="filter-chip active" data-filter="all">All</button>
          <button class="filter-chip" data-filter="run">🏃 Run</button>
          <button class="filter-chip" data-filter="ride">🚴 Ride</button>
          <button class="filter-chip" data-filter="walk">🚶 Walk / Hike</button>
          <button class="filter-chip" data-filter="swim">🏊 Swim</button>
        </div>
      </div>
    </div>

    <div class="challenge-list" id="list">
      <div class="empty-state">
        <div class="empty-icon">⏳</div>
        <div class="empty-title">Loading challenges…</div>
        <div class="empty-desc">Connecting to Strava Scout Watchtower</div>
      </div>
    </div>
  </section>
</main>

<div class="toast-container" id="toast-container"></div>

<script>
let allChallenges = [];
let nextScanIsoTimestamp = null;
let currentFilter = 'all';
let searchQuery = '';

function showToast(message, isError) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = isError ? '#ef4444' : 'rgba(255, 255, 255, 0.12)';
  toast.innerHTML = (isError ? '⚠️ ' : '✅ ') + message;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

function computeClientNextScanIso() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  //const slot1 = new Date(Date.UTC(y, m, d, 7, 0, 0, 0));
  //const slot2 = new Date(Date.UTC(y, m, d, 19, 0, 0, 0));
  //const slotTomorrow = new Date(Date.UTC(y, m, d + 1, 7, 0, 0, 0));
  
  //if (now.getTime() < slot1.getTime()) return slot1.toISOString();
  //if (now.getTime() < slot2.getTime()) return slot2.toISOString();
  //return slotTomorrow.toISOString();

  const slots = [1, 7, 13, 19].map(h => new Date(Date.UTC(y, m, d, h, 0, 0, 0)));
  const next = slots.find(s => now.getTime() < s.getTime());
  if (next) return next.toISOString();
  return new Date(Date.UTC(y, m, d + 1, 1, 0, 0, 0)).toISOString();
}

function formatLocalDateTime(isoString) {
  if (!isoString) return { main: 'Never', sub: '', countdown: '', relative: 'Never' };
  const target = new Date(isoString);
  if (isNaN(target.getTime())) return { main: isoString, sub: '', countdown: '', relative: '' };

  const now = new Date();
  const isToday = target.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = target.toDateString() === tomorrow.toDateString();

  const timeStr = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = target.toLocaleDateString([], { month: 'short', day: 'numeric' });

  let main = dateStr + ', ' + timeStr;
  if (isToday) main = 'Today, ' + timeStr;
  else if (isTomorrow) main = 'Tomorrow, ' + timeStr;

  // Timezone information
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  const offsetMin = -target.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offsetMin) / 60);
  const mins = Math.abs(offsetMin) % 60;
  const offsetStr = 'GMT' + sign + hours + (mins ? ':' + String(mins).padStart(2, '0') : '');
  const sub = offsetStr + ' (' + tzName.replace(/_/g, ' ') + ')';

  const diffMs = target.getTime() - now.getTime();
  let countdown = '';
  let relative = '';

  if (diffMs > 0) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    if (diffHours > 0) {
      countdown = '⏱ in ' + diffHours + 'h ' + remMins + 'm';
    } else {
      countdown = '⏱ in ' + diffMins + 'm';
    }
    relative = countdown;
  } else {
    const pastMins = Math.floor(-diffMs / (1000 * 60));
    const pastHours = Math.floor(pastMins / 60);
    const remMins = pastMins % 60;
    if (pastHours > 0) {
      relative = pastHours + 'h ' + remMins + 'm ago';
    } else if (pastMins > 0) {
      relative = pastMins + 'm ago';
    } else {
      relative = 'Just now';
    }
    countdown = relative;
  }

  return { main, sub, countdown, relative };
}

function updateNextScanDisplay() {
  const targetIso = nextScanIsoTimestamp || computeClientNextScanIso();
  const fmt = formatLocalDateTime(targetIso);
  document.getElementById('next-scan-time').textContent = fmt.main;
  document.getElementById('next-scan-countdown').textContent = fmt.countdown || '⏱ Scanning soon';
  document.getElementById('next-scan-local-meta').textContent = 'Local Time · ' + fmt.sub;
}

function renderChallenges() {
  const list = document.getElementById('list');
  const filtered = allChallenges.filter(c => {
    const matchesSearch = !searchQuery ||
      c.title.toLowerCase().includes(searchQuery) ||
      (c.description && c.description.toLowerCase().includes(searchQuery)) ||
      (c.qualifyingActivities && c.qualifyingActivities.toLowerCase().includes(searchQuery)) ||
      String(c.id).includes(searchQuery);

    if (!matchesSearch) return false;
    if (currentFilter === 'all') return true;
    const act = (c.qualifyingActivities || '').toLowerCase();
    if (currentFilter === 'run') return act.includes('run');
    if (currentFilter === 'ride') return act.includes('ride') || act.includes('cycle') || act.includes('bike');
    if (currentFilter === 'walk') return act.includes('walk') || act.includes('hike');
    if (currentFilter === 'swim') return act.includes('swim');
    return true;
  });

  document.getElementById('display-count').textContent = filtered.length + ' of ' + allChallenges.length;

  if (!filtered.length) {
    if (allChallenges.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><div class="empty-title">No challenges discovered yet</div><div class="empty-desc">The scanner runs every 6 hours. You can also trigger an on-demand scan above!</div></div>';
    } else {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No matching challenges</div><div class="empty-desc">Try modifying your search keywords or filter pills.</div></div>';
    }
    return;
  }

  list.innerHTML = filtered.map(c => {
    const activities = (c.qualifyingActivities || 'Activity').split(',').map(a => a.trim()).filter(Boolean);
    
    let visibleActivities = activities;
    let overflowCount = 0;
    if (activities.length > 4) {
      visibleActivities = activities.slice(0, 3);
      overflowCount = activities.length - 3;
    }

    let actPills = visibleActivities.map(a => '<span class="activity-pill">' + escapeHtml(a) + '</span>').join('');
    if (overflowCount > 0) {
      actPills += '<span class="activity-pill" style="opacity: 0.8; background: transparent; border: 1px dashed rgba(56, 189, 248, 0.4); color: var(--fg-muted);">+' + overflowCount + ' more</span>';
    }
    const imgHtml = c.imageUrl ? '<img src="' + escapeHtml(c.imageUrl) + '" class="challenge-image" />' : '';
    
    return '<article class="challenge-card">' +
      '<div class="challenge-id-badge mono" style="position: absolute; top: -12px; left: 16px; font-size: 12px; font-weight: 700; color: var(--accent-light); background: var(--card-bg); border: 1px solid rgba(252, 82, 0, 0.4); padding: 4px 10px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">#' + c.id + '</div>' +
      '<div class="card-top-row">' +
        '<div class="card-top-left">' +
          '<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">' +
            '<div class="date-badge">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' +
              escapeHtml(c.dateInterval || 'Dates unlisted') +
            '</div>' +
          '</div>' +
          '<h2 class="challenge-title">' + escapeHtml(c.title) + '</h2>' +
        '</div>' +
        imgHtml +
      '</div>' +
      '<p class="challenge-desc" style="margin-top: 8px;">' + escapeHtml(c.description || 'No description provided') + '</p>' +
      '<div class="activity-pills" style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">' + actPills + '</div>' +
      '<div class="card-bottom-row" style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">' +
        '<div class="challenge-actions">' +
          '<a class="btn-strava" href="' + escapeHtml(c.url) + '" target="_blank" rel="noreferrer">' +
            '<span>Open on Strava</span>' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>' +
          '</a>' +
          '<button class="btn-resend" data-id="' + c.id + '" data-url="/api/challenges/' + c.id + '/notify">' +
            '<span>Resend</span>' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6H7a3 3 0 0 0-3 3v2" /><polyline points="14 3 17 6 14 9" /><path d="M7 18h10a3 3 0 0 0 3-3v-2" /><polyline points="10 21 7 18 10 15" /></svg>'+ 
          '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function load() {
  const refreshIcon = document.getElementById('refresh-icon');
  refreshIcon.classList.add('spin');
  try {
    const r = await fetch('/api/status');
    const d = await r.json();

    allChallenges = d.challenges || [];
    nextScanIsoTimestamp = d.nextScanAt || computeClientNextScanIso();

    updateNextScanDisplay();

    if (d.lastScanAt) {
      const lastFmt = formatLocalDateTime(d.lastScanAt);
      document.getElementById('last-scan-time').textContent = lastFmt.main;
      document.getElementById('last-scan-relative').textContent = lastFmt.relative + ' · ' + lastFmt.sub;
    } else {
      document.getElementById('last-scan-time').textContent = 'Never';
      document.getElementById('last-scan-relative').textContent = 'Awaiting initial scan run';
    }

    document.getElementById('last-scan-result').textContent = d.lastScanResult || 'No history';
    document.getElementById('next-id').textContent = '#' + (d.nextId || '—');
    document.getElementById('consecutive-missing-tag').textContent = (d.consecutiveMissing || 0) + ' missing in a row';
    document.getElementById('total-detected-count').textContent = allChallenges.length;

    renderChallenges();
  } catch (err) {
    showToast('Failed to refresh status: ' + err.message, true);
  } finally {
    setTimeout(() => { refreshIcon.classList.remove('spin'); }, 500);
  }
}

async function triggerScan() {
  const btn = document.getElementById('btn-scan');
  const btnText = document.getElementById('scan-btn-text');
  const scanIcon = document.getElementById('scan-icon');

  btn.disabled = true;
  btnText.textContent = 'Scanning…';
  scanIcon.classList.add('spin');

  try {
    const res = await fetch('/api/scan', { method: 'POST' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    showToast('Scan complete: ' + data.found + ' found, ' + data.missing + ' missing, ' + data.errors + ' errors');
    await load();
  } catch (err) {
    showToast('Manual scan failed: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Scan Now';
    scanIcon.classList.remove('spin');
  }
}

// Event Listeners
document.getElementById('btn-refresh').addEventListener('click', load);
document.getElementById('btn-scan').addEventListener('click', triggerScan);

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-resend');
  if (!btn) return;
  btn.disabled = true;
  try {
    const res = await fetch(btn.dataset.url, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) showToast('Message resend successful.', false);
    else showToast('Resend failed: ' + (data.detail || data.error), true);
  } catch (err) {
    showToast('Resend failed: ' + err.message, true);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('search-input').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  renderChallenges();
});

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.getAttribute('data-filter');
    renderChallenges();
  });
});

// Localize Cadence text
const formatLocal = (utcHour) => {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const cadenceEl = document.getElementById('cadence-text');
if (cadenceEl) {
  cadenceEl.textContent = 'Cadence: ' + formatLocal(1) + ', ' + formatLocal(7) + ', ' + formatLocal(13) + ' & ' + formatLocal(19) + ' Local Time (4x daily)';
}

// Update countdown every 10 seconds
setInterval(updateNextScanDisplay, 10000);

load();
</script>
</body>
</html>`;
