# Strava Scout Watch

<div align="center">

A serverless Cloudflare Worker application that automatically discovers Strava challenges and sends notifications to Telegram. This project continuously scans Strava's public challenge database, extracts challenge details, and alerts users whenever new challenges are detected.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

**Strava Scout** is a lightweight, serverless application that monitors Strava's challenge platform and automatically notifies users via Telegram when new challenges become available. Built on Cloudflare Workers with D1 database backend, it provides real-time challenge discovery without requiring manual checking.

The application runs on a scheduled cron job (twice daily by default), scans sequential challenge IDs, intelligently retries failed attempts, and maintains a persistent log of all discovered challenges.

---

## ✨ Features

### Core Functionality
- **Automated Challenge Discovery**: Continuously scans Strava challenge IDs using an efficient forward-scan algorithm
- **Intelligent Retry Logic**: Automatically retries failed or temporary network errors with a 12-hour retry window
- **Duplicate Prevention**: Each challenge is notified only once, preventing notification spam
- **Persistent Storage**: All discovered challenges stored in Cloudflare D1 database with metadata

### Notifications
- **Telegram Integration**: Real-time alerts via Telegram with complete challenge information
- **Rich Notifications**: Includes title, description, date interval, qualifying activities, and direct Strava link

### Web Interface
- **Interactive Dashboard**: View scan history and all detected challenges
- **Real-time Status**: Monitor scanner state and last execution details
- **Health Checks**: Lightweight endpoint for uptime monitoring

### Management Tools
- **Manual Scan Trigger**: Admin endpoint to run scans on-demand
- **Individual Challenge Lookup**: Query specific challenge details
- **Admin Token Authentication**: Secure access to sensitive endpoints

---

## 🏗️ Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Cloudflare Workers | Serverless compute |
| **Database** | Cloudflare D1 (SQLite) | Challenge data persistence |
| **Language** | TypeScript | Type-safe implementation |
| **Notifications** | Telegram Bot API | User alerts |
| **Scheduling** | Cron Triggers | Automated execution |

### Data Flow

```
┌──────────────────┐
│ Cron Trigger     │
│ (2x daily)       │
└────────┬─────────┘
		 │
		 ▼
┌──────────────────────────────┐
│ Scan Worker                  │
│ - Check Challenge IDs        │
│ - Parse HTML/Metadata        │
│ - Handle Errors/Retries      │
└────────┬─────────────────────┘
		 │
	┌────┴────┐
	▼         ▼
┌────────┐ ┌──────────┐
│ D1 DB  │ │ Telegram │
│ Store  │ │ Notify   │
└────────┘ └──────────┘
	│         
	▼         
┌──────────────────────┐
│ Web Dashboard        │
│ - View Challenges    │
│ - Check Status       │
│ - Admin API          │
└──────────────────────┘
```

---

## 📦 Prerequisites

Before deployment, ensure you have:

- **Node.js** 18.0 or later ([Download](https://nodejs.org/))
- **npm** 9.0 or later (included with Node.js)
- **Cloudflare Account** with Workers enabled ([Sign up](https://dash.cloudflare.com/))
- **Telegram Bot** created via [@BotFather](https://t.me/BotFather)
- **Git** (for version control, optional)

### Estimated Costs

- **Cloudflare Workers**: Free tier includes 100,000 requests/day (sufficient for twice-daily scans)
- **D1 Database**: Free tier includes 3 databases with 5 GB storage
- **Telegram**: Free (via Telegram Bot API)

---

## 🚀 Installation & Setup

### Step 1: Clone or Initialize Project

```bash
# Clone the repository
git clone https://github.com/yourusername/strava-scout.git
cd strava-scout

# Or initialize from scratch
npm init
npm install --save-dev wrangler @cloudflare/workers-types typescript
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `wrangler`: Cloudflare Workers CLI
- `@cloudflare/workers-types`: TypeScript types for Workers API
- `typescript`: TypeScript compiler

### Step 3: Create Cloudflare D1 Database

```bash
# Create a new D1 database named 'strava-scout'
npx wrangler d1 create strava-scout
```

After running this command, you'll receive output like:
```
✅ Successfully created DB 'strava-scout'
   ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Copy the database ID (UUID).

### Step 4: Configure wrangler.toml

Edit `wrangler.toml` and add:

```toml
[env.production]
name = "strava-scout"

[[d1_databases]]
binding = "DB"
database_name = "strava-scout"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Paste your ID here

[triggers]
crons = ["0 7,19 * * *"]  # Run at 07:00 and 19:00 UTC

[env.production.vars]
START_ID = "6434"  # First challenge ID to scan
```

### Step 5: Apply Database Schema

```bash
# Run migrations to create tables
npx wrangler d1 migrations apply strava-scout --remote
```

This creates three tables:
- `challenges`: Stores discovered challenges
- `scan_state`: Maintains scanner state (next ID, consecutive missing count)
- `attempts`: Tracks probe attempts and retry status

### Step 6: Create Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow prompts:
   - Choose a name for your bot (e.g., "Strava Scout Alerts")
   - Choose a username (must be unique, e.g., "strava_scout_bot")
3. Copy the **Bot Token** (example: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. Start a chat with your bot and obtain your **Chat ID**:
   - Message your bot anything
   - Visit: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
   - Find your `chat.id` in the JSON response

### Step 7: Set Environment Secrets

```bash
# Set Telegram Bot Token
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Paste: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Set Telegram Chat ID
npx wrangler secret put TELEGRAM_CHAT_ID
# Paste: 987654321

# Set admin token for API access (use a strong random string)
npx wrangler secret put SCAN_ADMIN_TOKEN
# Paste: your-secret-token-here-make-it-long-and-random
```

Generate a strong token:
```bash
# On macOS/Linux
openssl rand -hex 32

# On Windows PowerShell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 })) -join ''
```

### Step 8: Deploy

```bash
# Typecheck code
npm run typecheck

# Deploy to Cloudflare Workers
npm run deploy
```

After deployment, you'll see:
```
✅ Deployed to https://strava-scout-abc123.workers.dev/
```

Save this URL—it's your dashboard link.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `START_ID` | Number | `6434` | Initial challenge ID to begin scanning |
| `TELEGRAM_BOT_TOKEN` | Secret | - | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Secret | - | Your Telegram chat/user ID |
| `SCAN_ADMIN_TOKEN` | Secret | - | Bearer token for admin API endpoints |

### Schedule Configuration

Edit the `crons` field in `wrangler.toml`:

```toml
# Examples:
crons = ["0 7,19 * * *"]     # Daily at 07:00 and 19:00 UTC (default)
crons = ["0 */6 * * *"]       # Every 6 hours
crons = ["30 9 * * MON-FRI"]  # Weekdays at 09:30 UTC
crons = ["0 0 * * *"]         # Daily at midnight UTC
```

[Cron Format Reference](https://crontab.guru/)

### Scan Parameters

In `src/index.ts`, adjust these constants if needed:

```typescript
const missingLimit = 4;              // Stop scanning after 4 consecutive missing IDs
const retryDelayMs = 12 * 60 * 60 * 1000;  // Retry failed probes after 12 hours
```

---

## 📖 Usage

### Local Development

```bash
# Start development server with hot reload
npm run dev
```

Access the dashboard at `http://localhost:8787/`

### Deployment

```bash
# Deploy to production
npm run deploy

# View recent logs
npx wrangler tail
```

### Manual Testing

Test the deployed worker:

```bash
# Check health
curl https://your-worker.workers.dev/api/health

# Get status
curl https://your-worker.workers.dev/api/status

# Trigger manual scan (requires auth)
curl -X POST https://your-worker.workers.dev/api/scan \
  -H "Authorization: Bearer your-admin-token"
```

---

## 🔌 API Reference

### Public Endpoints

#### Dashboard
```
GET /
```

Returns an HTML dashboard showing:
- Current scan state
- Next scheduled scan time
- All detected challenges with details
- Challenge count and statistics

#### Health Check
```
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Used for uptime monitoring and load balancer health checks.

#### Scanner Status
```
GET /api/status
```

**Response (200 OK):**
```json
{
  "scanState": {
	"nextId": 7200,
	"consecutiveMissing": 0,
	"lastScanAt": "2024-01-15T19:00:00Z",
	"lastScanResult": "Found 3 challenges, 12 missing, 1 error"
  },
  "challenges": [
	{
	  "id": 7195,
	  "title": "New Year New Skills",
	  "description": "Complete one activity per day",
	  "dateInterval": "Jan 1 - Jan 31, 2024",
	  "qualifyingActivities": "Running, Cycling",
	  "url": "https://www.strava.com/challenges/7195",
	  "detectedAt": "2024-01-15T19:00:00Z",
	  "notifiedAt": "2024-01-15T19:05:00Z"
	}
  ]
}
```

### Protected Endpoints

All protected endpoints require:
```
Authorization: Bearer <SCAN_ADMIN_TOKEN>
```

#### Get Single Challenge
```
GET /api/challenges/<id>
Authorization: Bearer <SCAN_ADMIN_TOKEN>
```

**Parameters:**
- `id` (path): Strava challenge ID (integer)

**Response (200 OK):**
```json
{
  "challenge": {
	"id": 6386,
	"title": "Distance Challenge",
	"description": "Reach 100 km this month",
	"dateInterval": "Jan 1 - Jan 31, 2024",
	"qualifyingActivities": "Running, Trail Running",
	"url": "https://www.strava.com/challenges/6386"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid or missing authentication token"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Challenge does not exist on Strava"
}
```

**Response (502 Bad Gateway):**
```json
{
  "error": "Unable to reach Strava or invalid response received"
}
```

#### Manual Scan Trigger
```
POST /api/scan
Authorization: Bearer <SCAN_ADMIN_TOKEN>
```

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "result": {
	"found": 5,
	"missing": 18,
	"errors": 2
  },
  "message": "Scan completed successfully"
}
```

Triggers an immediate scan without waiting for the scheduled cron job. Useful for testing or urgent scanning.

---

## 🔍 How It Works

### Scanning Algorithm

The scanner uses an intelligent forward-scan strategy:

1. **Fetch Next ID**: Retrieve the last known challenge ID from database
2. **Probe Challenge**: Attempt to fetch the challenge from Strava
3. **Parse Response**:
   - **Found**: Extract metadata using HTML/Open Graph parsing, store in DB, notify if new
   - **Missing (404)**: Increment consecutive missing counter
   - **Error**: Record error, schedule retry in 12 hours, continue scanning
4. **Stop Condition**: Stop when 4 consecutive challenges are missing (gap detected)
5. **Retry Logic**: Previously failed probes automatically retry after 12 hours

### Example Scan Flow

```
Current State: Next ID = 7100, Consecutive Missing = 0

Attempt 1: GET /challenges/7100
  → Status: 200 ✓ (Found)
  → Store in DB, notify Telegram, reset missing counter

Attempt 2: GET /challenges/7101
  → Status: 404 (Not Found)
  → Increment missing counter = 1

Attempt 3: GET /challenges/7102
  → Status: 500 (Server Error)
  → Record error, schedule retry, keep consecutive_missing = 1

Attempt 4: GET /challenges/7103
  → Status: 404 (Not Found)
  → Increment missing counter = 2

Attempt 5: GET /challenges/7104
  → Status: 404 (Not Found)
  → Increment missing counter = 3

Attempt 6: GET /challenges/7105
  → Status: 404 (Not Found)
  → Increment missing counter = 4
  → STOP: 4 consecutive missing reached

Save State: Next ID = 7106, Consecutive Missing = 4
Later (12h): Retry challenge 7102 (previous error)
```

### Data Extraction

For each challenge, the parser extracts:

| Field | Source | Fallback |
|-------|--------|----------|
| **Title** | Open Graph `og:title` → HTML text → Default format |
| **Description** | Open Graph `og:description` → HTML text → "Description unavailable" |
| **Date Interval** | Calendar metadata in JSON → HTML text → "Dates unavailable" |
| **Qualifying Activities** | Payload JSON → HTML text → "Activities unavailable" |
| **URL** | Constructed from challenge ID |

The parser does **NOT**:
- Bypass authentication (respects Strava login requirements)
- Bypass rate limits (uses standard HTTP requests)
- Modify requests beyond standard headers

---

## 🗄️ Database Schema

### `challenges` Table

Stores all discovered challenges.

```sql
CREATE TABLE challenges (
  id INTEGER PRIMARY KEY,          -- Strava challenge ID
  title TEXT NOT NULL,             -- Challenge name
  description TEXT NOT NULL,       -- Full description
  date_interval TEXT NOT NULL,     -- Date range (e.g., "Jan 1 - Jan 31")
  qualifying_activities TEXT NOT NULL,  -- Comma-separated activities
  url TEXT NOT NULL,               -- Direct Strava URL
  detected_at TEXT NOT NULL,       -- ISO 8601 timestamp
  notified_at TEXT                 -- ISO 8601 timestamp of Telegram notification
);

-- Example row:
-- id: 6386
-- title: "Distance Challenge"
-- description: "Complete 100 km of activities"
-- date_interval: "January 1 - January 31, 2024"
-- qualifying_activities: "Running, Trail Running, Walking"
-- url: "https://www.strava.com/challenges/6386"
-- detected_at: "2024-01-15T19:00:00.000Z"
-- notified_at: "2024-01-15T19:05:00.000Z"
```

### `scan_state` Table

Maintains persistent scanner state between runs.

```sql
CREATE TABLE scan_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Key-Value Pairs:**

| Key | Example Value | Purpose |
|-----|---|---------|
| `next_id` | `7206` | Next challenge ID to probe |
| `consecutive_missing` | `2` | Count of consecutive missing IDs |
| `last_scan_at` | `2024-01-15T19:00:00Z` | Timestamp of last completed scan |
| `last_scan_result` | `Found 5, missing 15, errors 2` | Result summary |

### `attempts` Table

Tracks individual probe attempts and retry scheduling.

```sql
CREATE TABLE attempts (
  id INTEGER PRIMARY KEY,      -- Challenge ID
  status TEXT NOT NULL,        -- "success" | "missing" | "error"
  last_error TEXT,             -- Error message if status is "error"
  last_checked_at TEXT NOT NULL,  -- ISO 8601 timestamp
  next_retry_at TEXT NOT NULL, -- ISO 8601 timestamp (NULL if success)
  attempts INTEGER DEFAULT 1   -- Number of attempts
);

-- Example row (error, pending retry):
-- id: 7102
-- status: "error"
-- last_error: "Strava returned HTTP 500"
-- last_checked_at: "2024-01-15T19:02:00.000Z"
-- next_retry_at: "2024-01-16T07:02:00.000Z"
-- attempts: 2
```

---

## 🐛 Troubleshooting

### Scanner Not Running

**Problem**: Scheduled scans haven't executed

**Solutions**:
1. Check Cloudflare Worker status at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Verify cron schedule in `wrangler.toml`:
   ```bash
   npx wrangler deployments list
   ```
3. Check logs:
   ```bash
   npx wrangler tail --follow
   ```
4. Try manual trigger:
   ```bash
   curl -X POST https://your-worker.workers.dev/api/scan \
	 -H "Authorization: Bearer your-token"
   ```

### No Telegram Notifications

**Problem**: Challenges found but no messages in Telegram

**Solutions**:
1. Verify bot token and chat ID are correct:
   ```bash
   npx wrangler secret list
   ```
2. Test Telegram API directly:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/sendMessage" \
	 -d chat_id=<CHAT_ID> \
	 -d text="Test message"
   ```
3. Check worker logs for Telegram errors:
   ```bash
   npx wrangler tail
   ```

### Challenges Not Being Stored

**Problem**: `/api/status` returns empty challenge list despite scans running

**Solutions**:
1. Verify D1 binding is correct:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "strava-scout"
   database_id = "YOUR_ID"
   ```
2. Check if migrations applied:
   ```bash
   npx wrangler d1 execute strava-scout --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
   ```
3. Check for database errors in logs:
   ```bash
   npx wrangler tail
   ```

### High 5xx Errors from Strava

**Problem**: Many probes returning 502 Bad Gateway

**Solutions**:
1. **Temporary Strava Outage**: Check [Strava Status](https://status.strava.com/)
2. **Rate Limiting**: Reduce scan frequency or add delays between requests
3. **Network Issues**: Verify Cloudflare Workers can reach Strava
4. These are automatically retried after 12 hours

### "401 Unauthorized" on Admin Endpoints

**Problem**: Admin API calls returning 401 errors

**Solutions**:
1. Verify token format in request:
   ```bash
   # ✓ Correct
   -H "Authorization: Bearer your-actual-token"

   # ✗ Wrong
   -H "Authorization: your-actual-token"  # Missing "Bearer"
   ```
2. Verify token value matches secret:
   ```bash
   npx wrangler secret list | grep SCAN_ADMIN_TOKEN
   ```
3. Re-set the secret if unsure:
   ```bash
   npx wrangler secret put SCAN_ADMIN_TOKEN
   ```

### Database Out of Storage

**Problem**: Error "database is full" after extended operation

**Solutions**:
1. Check D1 usage at [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Clean old data (older than 30 days):
   ```bash
   npx wrangler d1 execute strava-scout --remote \
	 --command "DELETE FROM challenges WHERE detected_at < datetime('now', '-30 days');"
   ```
3. Upgrade to paid D1 tier if needed

---

## 📝 Development

### Project Structure

```
strava-scout/
├── src/
│   └── index.ts           # Main Worker code
├── migrations/
│   └── 0001_initial.sql   # Database schema
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── wrangler.toml          # Worker configuration
└── README.md              # This file
```

### Building & Testing

```bash
# Type checking
npm run typecheck

# Local development
npm run dev

# Deploy
npm run deploy
```

### Code Style

- **Language**: TypeScript (strict mode)
- **Formatting**: 2-space indentation
- **API Style**: RESTful with JSON responses
- **Error Handling**: Graceful degradation with detailed error messages

### Contributing

Contributions welcome! Areas for improvement:

- [ ] Additional parser improvements for different Strava metadata formats
- [ ] Webhook support for real-time challenge notifications
- [ ] Multiple alert destination support (Discord, Slack, etc.)
- [ ] Advanced filtering (by activity type, difficulty, etc.)
- [ ] Analytics dashboard
- [ ] Mobile app integration

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Support

- **Issues**: GitHub Issues (if using GitHub)
- **Discussion**: GitHub Discussions (if using GitHub)
- **Strava API**: https://developers.strava.com/
- **Cloudflare Docs**: https://developers.cloudflare.com/workers/

---

## 🙏 Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [Strava API](https://www.strava.com/) - Challenge data source
- [Telegram Bot API](https://core.telegram.org/bots/api) - Notification delivery

---

**Last Updated**: January 2024  
**Version**: 1.0.0
