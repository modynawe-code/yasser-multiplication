PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS game_room_join_throttle (
  throttle_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT
);

CREATE INDEX IF NOT EXISTS idx_game_room_join_throttle_blocked ON game_room_join_throttle(blocked_until);
