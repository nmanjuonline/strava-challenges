CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date_interval TEXT NOT NULL,
  qualifying_activities TEXT NOT NULL,
  url TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  notified_at TEXT
);

CREATE TABLE IF NOT EXISTS scan_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL,
  last_error TEXT,
  last_checked_at TEXT NOT NULL,
  next_retry_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO scan_state (key, value) VALUES
  ('next_id', '6434'),
  ('consecutive_missing', '0'),
  ('last_scan_at', ''),
  ('last_scan_result', 'Never scanned');