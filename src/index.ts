export interface Env {
  DB: D1Database;
  START_ID: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  SCAN_ADMIN_TOKEN: string;
}

type Challenge = {
  id: number;
  title: string;
  description: string;
  dateInterval: string;
  qualifyingActivities: string;
  url: string;
};

const missingLimit = 4;
const retryDelayMs = 12 * 60 * 60 * 1000;

function htmlEntityDecode(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function meta(html: string, name: string): string {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`, "i");
  const reverse = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`, "i");
  return htmlEntityDecode(pattern.exec(html)?.[1] ?? reverse.exec(html)?.[1] ?? "");
}

function textContent(html: string): string {
  return htmlEntityDecode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function around(text: string, label: string): string {
  const match = new RegExp(`${label}\\s*:?\\s*(.{0,180})`, "i").exec(text);
  return match?.[1]?.split(/(?:Qualifying activities|Description|Date interval|Title)\s*:/i)[0].trim() ?? "";
}

function calendarDateInterval(html: string): string {
  const decodedHtml = htmlEntityDecode(html);
  const match = /["']summary["']\s*:\s*\{\s*["']calendar["']\s*:\s*\{\s*["']title["']\s*:\s*["']([^"']+)/i.exec(decodedHtml);
  const title = match?.[1] ?? "";
  return title.replace(/\s+[—-]{1,2}\s+\d+\s+days?\s+(?:left|until\s+start)\s*$/i, "").trim();
}

function qualifyingActivitiesFromPayload(html: string): string {
  const decodedHtml = htmlEntityDecode(html);
  const section = /["']key["']\s*:\s*["']qualifyingActivities["'][\s\S]{0,1000}?["']qualifyingActivities["']\s*:\s*\[([\s\S]*?)\]/i.exec(decodedHtml)?.[1] ?? "";
  const activities: string[] = [];
  for (const match of section.matchAll(/["']text["']\s*:\s*["']([^"']*)["']/gi)) {
    if (match[1]) activities.push(match[1]);
  }
  return activities.join(", ");
}

function parseChallenge(id: number, html: string): Challenge {
  const text = textContent(html);
  const title = meta(html, "og:title") || around(text, "Title") || `Strava challenge ${id}`;
  const description = meta(html, "og:description") || around(text, "Description") || "Description unavailable";
  const dateInterval = calendarDateInterval(html) || around(text, "Date interval") || around(text, "Dates") || "Dates unavailable";
  const qualifyingActivities = qualifyingActivitiesFromPayload(html) || around(text, "Qualifying activities") || around(text, "Activities") || "Activities unavailable";
  return { id, title, description, dateInterval, qualifyingActivities, url: `https://www.strava.com/challenges/${id}` };
}

async function fetchChallenge(id: number): Promise<Challenge | null> {
  const response = await fetch(`https://www.strava.com/challenges/${id}`, {
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
    }
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Strava returned HTTP ${response.status}`);
  const html = await response.text();
  if (/page not found|challenge not found|does not exist/i.test(html)) return null;
  return parseChallenge(id, html);
}

async function state(db: D1Database, key: string, fallback: string): Promise<string> {
  return (await db.prepare("SELECT value FROM scan_state WHERE key = ?").bind(key).first<{ value: string }>())?.value ?? fallback;
}

async function setState(db: D1Database, key: string, value: string): Promise<void> {
  await db.prepare("INSERT INTO scan_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(key, value).run();
}

async function notify(env: Env, challenge: Challenge): Promise<void> {
  const message = `New Challenge Detected!\nTitle: ${challenge.title}\nDescription: ${challenge.description}\nDate Interval: ${challenge.dateInterval}\nQualifying Activities: ${challenge.qualifyingActivities}\n${challenge.url}`;
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: message, disable_web_page_preview: false }) });
  if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}`);
}

async function scan(env: Env): Promise<{ found: number; missing: number; errors: number }> {
  let nextId = Number(await state(env.DB, "next_id", env.START_ID));
  let consecutiveMissing = Number(await state(env.DB, "consecutive_missing", "0"));
  let found = 0;
  let missing = 0;
  let errors = 0;
  const retryRows = await env.DB.prepare("SELECT id FROM attempts WHERE status != 'found' AND next_retry_at <= ? ORDER BY id LIMIT 20").bind(new Date().toISOString()).all<{ id: number }>();
  const ids = [...new Set([...(retryRows.results ?? []).map((row) => row.id), ...Array.from({ length: 20 }, (_, index) => nextId + index)])].sort((a, b) => a - b);
  for (const id of ids) {
    try {
      const challenge = await fetchChallenge(id);
      if (!challenge) {
        missing++;
        consecutiveMissing++;
        await env.DB.prepare("INSERT INTO attempts (id, status, last_checked_at, next_retry_at, attempts) VALUES (?, 'missing', ?, ?, 1) ON CONFLICT(id) DO UPDATE SET status = 'missing', last_checked_at = excluded.last_checked_at, next_retry_at = excluded.next_retry_at, attempts = attempts + 1").bind(id, new Date().toISOString(), new Date(Date.now() + retryDelayMs).toISOString()).run();
        if (id >= nextId && consecutiveMissing >= missingLimit) break;
        continue;
      }
      found++;
      consecutiveMissing = 0;
      const existing = await env.DB.prepare("SELECT id FROM challenges WHERE id = ?").bind(id).first();
      await env.DB.prepare("INSERT OR REPLACE INTO challenges (id, title, description, date_interval, qualifying_activities, url, detected_at, notified_at) VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT detected_at FROM challenges WHERE id = ?), ?), ?)").bind(id, challenge.title, challenge.description, challenge.dateInterval, challenge.qualifyingActivities, challenge.url, id, new Date().toISOString(), existing ? (await state(env.DB, `notified:${id}`, "")) : null).run();
      await env.DB.prepare("INSERT INTO attempts (id, status, last_checked_at, next_retry_at, attempts) VALUES (?, 'found', ?, ?, 1) ON CONFLICT(id) DO UPDATE SET status = 'found', last_checked_at = excluded.last_checked_at, next_retry_at = excluded.next_retry_at").bind(id, new Date().toISOString(), new Date(Date.now() + retryDelayMs).toISOString()).run();
      if (!existing) {
        try { await notify(env, challenge); await setState(env.DB, `notified:${id}`, new Date().toISOString()); await env.DB.prepare("UPDATE challenges SET notified_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run(); } catch (error) { errors++; await setState(env.DB, `notified:${id}`, ""); }
      }
      if (id >= nextId) nextId = id + 1;
    } catch (error) {
      errors++;
      await env.DB.prepare("INSERT INTO attempts (id, status, last_error, last_checked_at, next_retry_at, attempts) VALUES (?, 'error', ?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET status = 'error', last_error = excluded.last_error, last_checked_at = excluded.last_checked_at, next_retry_at = excluded.next_retry_at, attempts = attempts + 1").bind(id, String(error), new Date().toISOString(), new Date(Date.now() + retryDelayMs).toISOString()).run();
    }
  }
  await setState(env.DB, "next_id", String(nextId));
  await setState(env.DB, "consecutive_missing", String(consecutiveMissing));
  await setState(env.DB, "last_scan_at", new Date().toISOString());
  await setState(env.DB, "last_scan_result", `${found} found, ${missing} missing, ${errors} errors`);
  return { found, missing, errors };
}

const dashboard = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Strava Challenge Watch</title><style>:root{font-family:Georgia,serif;color:#18231d;background:#f3f0e8}body{margin:0}main{max-width:980px;margin:auto;padding:48px 22px}header{display:flex;justify-content:space-between;align-items:end;border-bottom:2px solid #18231d;padding-bottom:22px}h1{font-size:clamp(2.5rem,7vw,5.8rem);line-height:.9;margin:0;max-width:650px;font-weight:500}p{font-family:system-ui,sans-serif;line-height:1.5}.eyebrow{font:700 12px system-ui,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#c34d2d}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#18231d;margin:28px 0}.stat{background:#f3f0e8;padding:18px}.stat b{display:block;font-size:1.6rem;font-weight:500}.challenge{border-top:1px solid #899188;padding:24px 0;display:grid;grid-template-columns:90px 1fr;gap:18px}.challenge h2{margin:0 0 8px;font-size:1.5rem;font-weight:500}.challenge a{color:#c34d2d;font-family:system-ui,sans-serif;font-size:.9rem}@media(max-width:600px){header{display:block}.stats{grid-template-columns:1fr}.challenge{grid-template-columns:60px 1fr}.challenge p{font-size:.95rem}}</style></head><body><main><header><div><div class="eyebrow">Strava / watchtower</div><h1>Challenges worth showing up for.</h1></div><p id="status">Loading...</p></header><section class="stats"><div class="stat"><small>LAST SCAN</small><b id="last">--</b></div><div class="stat"><small>NEXT ID</small><b id="next">--</b></div><div class="stat"><small>SCAN RESULT</small><b id="result">--</b></div></section><section><div class="eyebrow">Detected challenges</div><div id="list"></div></section></main><script>async function load(){const r=await fetch('/api/status');const d=await r.json();document.querySelector('#last').textContent=d.lastScanAt?new Date(d.lastScanAt).toLocaleString():'Never';document.querySelector('#next').textContent=d.nextId;document.querySelector('#result').textContent=d.lastScanResult;document.querySelector('#status').textContent=d.consecutiveMissing+' missing in a row';document.querySelector('#list').innerHTML=d.challenges.map(c=>'<article class="challenge"><strong>#'+c.id+'</strong><div><h2>'+c.title+'</h2><p>'+c.description+'</p><p>'+c.dateInterval+'<br>'+c.qualifyingActivities+'</p><a href="'+c.url+'" target="_blank" rel="noreferrer">Open on Strava ↗</a></div></article>').join('')||'<p>No challenges detected yet.</p>'}load()</script></body></html>`;

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> { ctx.waitUntil(scan(env)); },
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/") return new Response(dashboard, { headers: { "content-type": "text/html;charset=UTF-8" } });
    if (url.pathname === "/api/health") return Response.json({ ok: true });
    if (url.pathname === "/api/status") {
      const [lastScanAt, nextId, consecutiveMissing, lastScanResult, challenges] = await Promise.all([state(env.DB, "last_scan_at", ""), state(env.DB, "next_id", env.START_ID), state(env.DB, "consecutive_missing", "0"), state(env.DB, "last_scan_result", "Never scanned"), env.DB.prepare("SELECT id, title, description, date_interval AS dateInterval, qualifying_activities AS qualifyingActivities, url, detected_at AS detectedAt FROM challenges ORDER BY id DESC LIMIT 50").all()]);
      return Response.json({ lastScanAt, nextId: Number(nextId), consecutiveMissing: Number(consecutiveMissing), lastScanResult, challenges: challenges.results ?? [] });
    }
    const singleChallengeMatch = url.pathname.match(/^\/api\/challenges\/(\d+)$/);
    if (singleChallengeMatch && request.method === "GET") {
      //if (request.headers.get("authorization") !== `Bearer ${env.SCAN_ADMIN_TOKEN}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
      const id = Number(singleChallengeMatch[1]);
      try {
        const challenge = await fetchChallenge(id);
        if (!challenge) return Response.json({ error: "Challenge not found", id }, { status: 404 });
        return Response.json({ challenge });
      } catch (error) {
        return Response.json({ error: "Unable to check challenge", detail: String(error), id }, { status: 502 });
      }
    }
    if (url.pathname === "/api/scan" && request.method === "POST") {
      //if (request.headers.get("authorization") !== `Bearer ${env.SCAN_ADMIN_TOKEN}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
      return Response.json(await scan(env));
    }
    return new Response("Not found", { status: 404 });
  }
};