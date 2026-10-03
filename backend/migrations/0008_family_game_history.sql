CREATE TABLE IF NOT EXISTS family_game_devices (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT 'family-device',
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS game_room_history_families (
  room_id TEXT PRIMARY KEY REFERENCES game_rooms(id) ON DELETE CASCADE,
  family_id TEXT NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
  linked_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS family_game_matches (
  match_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
  game_id TEXT NOT NULL CHECK (
    length(game_id) BETWEEN 1 AND 64
    AND game_id NOT GLOB '*[^a-z0-9-]*'
  ),
  game_version INTEGER NOT NULL DEFAULT 1 CHECK (game_version >= 1),
  play_mode TEXT NOT NULL CHECK (play_mode IN ('local','online')),
  source_room_id TEXT,
  source_room_version INTEGER,
  started_at TEXT,
  ended_at TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  winner_ids_json TEXT NOT NULL DEFAULT '[]',
  details_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(source_room_id, source_room_version)
);

CREATE TABLE IF NOT EXISTS family_game_match_players (
  match_id TEXT NOT NULL REFERENCES family_game_matches(match_id) ON DELETE RESTRICT,
  learner_id TEXT NOT NULL CHECK (
    length(learner_id) BETWEEN 1 AND 64
    AND learner_id NOT GLOB '*[^a-z0-9-]*'
  ),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
  seat INTEGER,
  score REAL,
  outcome TEXT NOT NULL CHECK (outcome IN ('win','draw','loss','played')),
  details_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (match_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_family_game_devices_parent ON family_game_devices(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_game_devices_token ON family_game_devices(token_hash);
CREATE INDEX IF NOT EXISTS idx_game_room_history_family ON game_room_history_families(family_id, room_id);
CREATE INDEX IF NOT EXISTS idx_family_game_matches_family_time ON family_game_matches(family_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_game_matches_game_time ON family_game_matches(game_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_game_match_players_learner ON family_game_match_players(learner_id, match_id);

CREATE TRIGGER IF NOT EXISTS family_game_matches_no_delete
BEFORE DELETE ON family_game_matches
BEGIN
  SELECT RAISE(ABORT, 'family game match history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS family_game_matches_no_update
BEFORE UPDATE ON family_game_matches
BEGIN
  SELECT RAISE(ABORT, 'family game match history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS family_game_match_players_no_delete
BEFORE DELETE ON family_game_match_players
BEGIN
  SELECT RAISE(ABORT, 'family game player history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS family_game_match_players_no_update
BEFORE UPDATE ON family_game_match_players
BEGIN
  SELECT RAISE(ABORT, 'family game player history is append-only');
END;
