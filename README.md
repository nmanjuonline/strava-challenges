# Strava Challenge Watch

A Cloudflare Worker that checks public Strava challenge IDs twice a day, stores results in D1, and sends new challenges to Telegram.

## Deploy

1. Install Node.js, then run `npm install`.
2. Create a D1 database: `npx wrangler d1 create strava-challenges`.
3. Put the returned database ID in `wrangler.toml`, then apply the schema: `npx wrangler d1 migrations apply strava-challenges --remote`.
4. Create a Telegram bot with BotFather, start a chat with it, and obtain the chat ID.
5. Set secrets: `npx wrangler secret put TELEGRAM_BOT_TOKEN`, `npx wrangler secret put TELEGRAM_CHAT_ID`, and `npx wrangler secret put SCAN_ADMIN_TOKEN`.
6. Run `npm run deploy`. The dashboard is the Worker URL.

The cron is UTC at 07:00 and 19:00. Change the expression in `wrangler.toml` if your preferred half-days differ. `START_ID` defaults to `6434`.

## Behavior

The forward scan probes up to 20 IDs and stops after four consecutive missing IDs. Missing and failed probes remain in D1 with a 12-hour retry time, so a temporary Strava failure or an ID that was not available during one pass is revisited later. A challenge is notified only once.

## API

The deployed Worker URL is the dashboard URL. The administrative endpoints require the `SCAN_ADMIN_TOKEN` secret as a bearer token.

### Check one challenge

Check a single Strava challenge immediately without advancing the scheduled scan:

```text
GET /api/challenges/<id>
Authorization: Bearer <SCAN_ADMIN_TOKEN>
```

Example:

```powershell
Invoke-RestMethod -Method Get `
	-Uri "https://<your-worker>.<your-subdomain>.workers.dev/api/challenges/6386" `
	-Headers @{ Authorization = "Bearer <SCAN_ADMIN_TOKEN>" }
```

Responses:

- `200`: `{ "challenge": { ... } }` with the extracted title, description, date interval, qualifying activities, and Strava URL.
- `401`: the bearer token is missing or incorrect.
- `404`: the challenge ID does not exist.
- `502`: Strava could not be reached or returned an unusable response.

### Other endpoints

- `GET /`: dashboard showing scan state and detected challenges.
- `GET /api/status`: scan state and the latest 50 detected challenges.
- `GET /api/health`: lightweight health check.
- `POST /api/scan`: manually run the sequential scan; requires the bearer token.

The parser reads public HTML and Open Graph metadata. If Strava requires login for a challenge or changes its markup, the probe is retained as an error for retry; this worker does not bypass authentication or rate limits.