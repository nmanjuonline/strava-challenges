import { Env, Challenge } from "./types";
import { notifications } from "./notifications";

const missingLimit = 4;
const retryDelayMs = 12 * 60 * 60 * 1000;

function htmlEntityDecode(value: string): string {
    let decoded = value;
    let previous = "";
    while (decoded !== previous) {
        previous = decoded;
        decoded = decoded
            .replace(/&amp;/gi, "&")
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/&apos;/gi, "'")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
            .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    }
    return decoded.trim();
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
    const imageUrl = meta(html, "og:image");
    return { id, title, description, dateInterval, qualifyingActivities, url: `https://www.strava.com/challenges/${id}`, imageUrl };
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

function isIncomplete(challenge: Challenge): boolean {
    return (
        challenge.description === "Description unavailable" &&
        challenge.dateInterval === "Dates unavailable" &&
        challenge.qualifyingActivities === "Activities unavailable"
    );
}

async function state(db: D1Database, key: string, fallback: string): Promise<string> {
    return (await db.prepare("SELECT value FROM scan_state WHERE key = ?").bind(key).first<{ value: string }>())?.value ?? fallback;
}

async function setState(db: D1Database, key: string, value: string): Promise<void> {
    await db.prepare("INSERT INTO scan_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(key, value).run();
}



async function scan(env: Env): Promise<{ found: number; missing: number; errors: number }> {
    const fetchBatchSize = env.FETCH_BATCH_SIZE ? Number(env.FETCH_BATCH_SIZE) : 8;
    const stateKeys = ["next_id", "consecutive_missing"];
    const stateRows = await env.DB.prepare(`SELECT key, value FROM scan_state WHERE key IN (?, ?)`).bind(...stateKeys).all<{key: string, value: string}>();
    const stateMap = new Map((stateRows.results || []).map(r => [r.key, r.value]));
    let nextId = Number(stateMap.get("next_id") ?? env.START_ID);
    let consecutiveMissing = Number(stateMap.get("consecutive_missing") ?? "0");
    let found = 0;
    let missing = 0;
    let errors = 0;
    // Reset any previously "found" challenges whose data is all-unavailable back to missing so they are retried.
    await env.DB.prepare(
        "UPDATE attempts SET status = 'missing', next_retry_at = ? " +
        "WHERE id IN (" +
        "  SELECT c.id FROM challenges c INNER JOIN attempts a ON c.id = a.id " +
        "  WHERE a.status = 'found' " +
        "  AND c.description = 'Description unavailable' " +
        "  AND c.date_interval = 'Dates unavailable' " +
        "  AND c.qualifying_activities = 'Activities unavailable'" +
        ")"
    ).bind(new Date().toISOString()).run();
    const retryRows = await env.DB.prepare(`SELECT id FROM attempts WHERE status != 'found' AND next_retry_at <= ? ORDER BY id LIMIT ${fetchBatchSize}`).bind(new Date().toISOString()).all<{ id: number }>();
    const retryIds = new Set((retryRows.results ?? []).map((row) => row.id));
    const newIdsStart = nextId;
    const newIds = Array.from({ length: fetchBatchSize }, (_, index) => nextId + index);
    const ids = [...new Set([...retryIds, ...newIds])].sort((a, b) => a - b);

    let foundAnyNew = false;
    let deferredMissingNewIds: number[] = [];
    let highestFoundNewId = -1;
    const newChallenges: Challenge[] = [];
    
    const dbStatements: D1PreparedStatement[] = [];

    const fetchResults = await Promise.all(
        ids.map(async (id) => {
            try {
                return { id, challenge: await fetchChallenge(id), error: null };
            } catch (error) {
                return { id, challenge: null, error };
            }
        })
    );

    const validIds = fetchResults.filter(r => r.challenge && !isIncomplete(r.challenge)).map(r => r.id);
    const existingIdsSet = new Set<number>();
    if (validIds.length > 0) {
        const placeholders = validIds.map(() => "?").join(",");
        const existingRows = await env.DB.prepare(`SELECT id FROM challenges WHERE id IN (${placeholders})`).bind(...validIds).all<{id: number}>();
        existingRows.results?.forEach(r => existingIdsSet.add(r.id));
    }

    const now = new Date().toISOString();
    const retryDelay = new Date(Date.now() + retryDelayMs).toISOString();

    for (const result of fetchResults) {
        const { id, challenge, error } = result;
        if (error) {
            errors++;
            dbStatements.push(env.DB.prepare("INSERT INTO attempts (id, status, last_error, last_checked_at, next_retry_at, attempts) VALUES (?, 'error', ?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET status = 'error', last_error = excluded.last_error, last_checked_at = excluded.last_checked_at, next_retry_at = excluded.next_retry_at, attempts = attempts + 1").bind(id, String(error), now, retryDelay));
            continue;
        }

        if (!challenge) {
            missing++;
            consecutiveMissing++;
            if (retryIds.has(id)) {
                // Known retry-queue id, still missing — keep tracking it and push its next retry out.
                dbStatements.push(env.DB.prepare("INSERT INTO attempts (id, status, last_checked_at, next_retry_at, attempts) VALUES (?, 'missing', ?, ?, 1) ON CONFLICT(id) DO UPDATE SET status = 'missing', last_checked_at = excluded.last_checked_at, next_retry_at = excluded.next_retry_at, attempts = attempts + 1").bind(id, now, retryDelay));
            } else if (id >= newIdsStart) {
                deferredMissingNewIds.push(id);
            }
            continue;
        }
        // Challenge page exists but all key fields failed to parse — treat as missing and retry next cycle.
        if (isIncomplete(challenge)) {
            missing++;
            consecutiveMissing = 0; // Page exists, don't count against the consecutive-missing stop limit.
            dbStatements.push(env.DB.prepare("INSERT INTO attempts (id, status, last_checked_at, next_retry_at, attempts) VALUES (?, 'missing', ?, ?, 1) ON CONFLICT(id) DO UPDATE SET status = 'missing', last_checked_at = excluded.last_checked_at, next_retry_at = excluded.next_retry_at, attempts = attempts + 1").bind(id, now, retryDelay));
            continue;
        }

        // We only reach here if the challenge is COMPLETELY VALID
        if (id >= newIdsStart) {
            foundAnyNew = true;
            highestFoundNewId = Math.max(highestFoundNewId, id);
        }

        found++;
        consecutiveMissing = 0;
        const existing = existingIdsSet.has(id);
        const detectedAtFallback = now;
        
        dbStatements.push(env.DB.prepare("INSERT OR REPLACE INTO challenges (id, title, description, date_interval, qualifying_activities, url, image_url, detected_at, notified_at) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT detected_at FROM challenges WHERE id = ?), ?), (SELECT notified_at FROM challenges WHERE id = ?))").bind(id, challenge.title, challenge.description, challenge.dateInterval, challenge.qualifyingActivities, challenge.url, challenge.imageUrl || null, id, detectedAtFallback, id));
        dbStatements.push(env.DB.prepare("INSERT INTO attempts (id, status, last_checked_at, next_retry_at, attempts) VALUES (?, 'found', ?, ?, 1) ON CONFLICT(id) DO UPDATE SET status = 'found', last_checked_at = excluded.last_checked_at, next_retry_at = excluded.next_retry_at").bind(id, now, retryDelay));

        if (!existing) {
            newChallenges.push(challenge);
            dbStatements.push(env.DB.prepare("INSERT INTO scan_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(`notified:${id}`, now));
            dbStatements.push(env.DB.prepare("UPDATE challenges SET notified_at = ? WHERE id = ?").bind(now, id));
        }
    }

    if (foundAnyNew) {
        for (const deferredId of deferredMissingNewIds) {
            dbStatements.push(env.DB.prepare("INSERT INTO attempts (id, status, last_checked_at, next_retry_at, attempts) VALUES (?, 'missing', ?, ?, 1) ON CONFLICT(id) DO UPDATE SET status = 'missing', last_checked_at = excluded.last_checked_at, next_retry_at = excluded.next_retry_at, attempts = attempts + 1").bind(deferredId, now, retryDelay));
        }
        nextId = highestFoundNewId + 1;
    }

    dbStatements.push(env.DB.prepare("INSERT INTO scan_state (key, value) VALUES ('next_id', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(String(nextId)));
    dbStatements.push(env.DB.prepare("INSERT INTO scan_state (key, value) VALUES ('consecutive_missing', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(String(consecutiveMissing)));
    dbStatements.push(env.DB.prepare("INSERT INTO scan_state (key, value) VALUES ('last_scan_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(now));
    dbStatements.push(env.DB.prepare("INSERT INTO scan_state (key, value) VALUES ('last_scan_result', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(`${found} found, ${missing} missing, ${errors} errors`));

    for (let i = 0; i < dbStatements.length; i += 90) {
        await env.DB.batch(dbStatements.slice(i, i + 90));
    }

    try {
        await notifications.notifyBatched(env, newChallenges);
    } catch (error) {
        console.error("Failed to send batched notification:", error);
    }

    try {
        await notifications.sendScanReport(env, { found, missing, errors }, ids.length);
    } catch (error) {
        console.error("Failed to send scan report:", error);
    }

    return { found, missing, errors };
}

function getNextScheduledScan(now = new Date()): string {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();
    const slot1 = new Date(Date.UTC(y, m, d, 1, 0, 0, 0));
    const slot2 = new Date(Date.UTC(y, m, d, 7, 0, 0, 0));
    const slot3 = new Date(Date.UTC(y, m, d, 13, 0, 0, 0));
    const slot4 = new Date(Date.UTC(y, m, d, 19, 0, 0, 0));
    const slotTomorrow = new Date(Date.UTC(y, m, d + 1, 1, 0, 0, 0));

    if (now.getTime() < slot1.getTime()) {
        return slot1.toISOString();
    } else if (now.getTime() < slot2.getTime()) {
        return slot2.toISOString();
    } else if (now.getTime() < slot3.getTime()) {
        return slot3.toISOString();
    } else if (now.getTime() < slot4.getTime()) {
        return slot4.toISOString();
    } else {
        return slotTomorrow.toISOString();
    }
}

import { dashboard } from "./dashboard";
import { subscribePage } from "./subscribe";

export default {
    async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> { ctx.waitUntil(scan(env)); },
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname === "/") return new Response(dashboard, { headers: { "content-type": "text/html;charset=UTF-8" } });
        if (url.pathname === "/subscribe") return new Response(subscribePage, { headers: { "content-type": "text/html;charset=UTF-8" } });
        if (url.pathname === "/api/subscribe" && request.method === "POST") {
            try {
                const body = await request.json() as { email: string };
                if (!body || !body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
                    return Response.json({ error: "Invalid email address" }, { status: 400 });
                }
                await env.DB.prepare("INSERT INTO email_subscribers (email) VALUES (?) ON CONFLICT(email) DO NOTHING").bind(body.email).run();
                return Response.json({ success: true });
            } catch (error) {
                return Response.json({ error: "Failed to subscribe" }, { status: 500 });
            }
        }
        if (url.pathname === "/api/health") {
            try {
                // Lazy migration to add image_url column since CLI remote D1 auth failed
                await env.DB.prepare("ALTER TABLE challenges ADD COLUMN image_url TEXT;").run();
            } catch(e) {
                // Ignore if it already exists
            }
            return Response.json({ ok: true });
        }
        if (url.pathname === "/api/status") {
            const [lastScanAt, nextId, consecutiveMissing, lastScanResult, challenges] = await Promise.all([
                state(env.DB, "last_scan_at", ""),
                state(env.DB, "next_id", env.START_ID),
                state(env.DB, "consecutive_missing", "0"),
                state(env.DB, "last_scan_result", "Never scanned"),
                env.DB.prepare("SELECT id, title, description, date_interval AS dateInterval, qualifying_activities AS qualifyingActivities, url, image_url AS imageUrl, detected_at AS detectedAt FROM challenges ORDER BY detectedAt DESC LIMIT 50").all()
            ]);
            const nextScanAt = getNextScheduledScan();
            return Response.json({
                lastScanAt,
                nextId: Number(nextId),
                consecutiveMissing: Number(consecutiveMissing),
                lastScanResult,
                nextScanAt,
                cronSchedule: "0 1,7,13,19 * * *",
                challenges: challenges.results ?? []
            });
        }
        const challengesMatch = url.pathname.match(/^\/api\/challenges$/);
        if (challengesMatch && request.method === "GET") {
            const page = parseInt(url.searchParams.get("page") || "0", 10);
            const limit = 20;
            const offset = page * limit;
            try {
                const challenges = await env.DB.prepare("SELECT id, title, description, date_interval AS dateInterval, qualifying_activities AS qualifyingActivities, url, image_url AS imageUrl, detected_at AS detectedAt FROM challenges ORDER BY detectedAt DESC LIMIT ? OFFSET ?").bind(limit, offset).all();
                return Response.json({ challenges: challenges.results ?? [] });
            } catch (error) {
                return Response.json({ error: "Database error", detail: String(error) }, { status: 500 });
            }
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
        if (url.pathname.match(/^\/api\/challenges\/(\d+)\/notify$/) && request.method === "POST") {
            const id = Number(url.pathname.match(/^\/api\/challenges\/(\d+)\/notify$/)?.[1]);
            try {
                const challenge = await fetchChallenge(id);
                if (!challenge) return Response.json({ error: "Challenge not found", id }, { status: 404 });
                await notifications.notify(env, challenge);
                await setState(env.DB, `notified:${id}`, new Date().toISOString());
                await env.DB.prepare("UPDATE challenges SET notified_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
                return Response.json({ success: true, id });
            } catch (error) {
                return Response.json({ error: "Unable to resend", detail: String(error), id }, { status: 502 });
            }
        }
        if (url.pathname === "/api/scan" && request.method === "POST") {
            //if (request.headers.get("authorization") !== `Bearer ${env.SCAN_ADMIN_TOKEN}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
            return Response.json(await scan(env));
        }
        return new Response("Not found", { status: 404 });
    }
};

