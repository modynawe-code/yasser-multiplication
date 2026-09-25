CREATE TABLE IF NOT EXISTS game_matches (
  match_id TEXT PRIMARY KEY,
  family_scope TEXT NOT NULL DEFAULT 'default-family',
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

CREATE TABLE IF NOT EXISTS game_match_players (
  match_id TEXT NOT NULL REFERENCES game_matches(match_id) ON DELETE RESTRICT,
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

CREATE INDEX IF NOT EXISTS idx_game_matches_scope_time ON game_matches(family_scope, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_matches_game_time ON game_matches(game_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_match_players_learner ON game_match_players(learner_id, match_id);

CREATE TRIGGER IF NOT EXISTS game_matches_no_delete
BEFORE DELETE ON game_matches
BEGIN
  SELECT RAISE(ABORT, 'game match history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS game_matches_no_update
BEFORE UPDATE ON game_matches
BEGIN
  SELECT RAISE(ABORT, 'game match history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS game_match_players_no_delete
BEFORE DELETE ON game_match_players
BEGIN
  SELECT RAISE(ABORT, 'game match player history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS game_match_players_no_update
BEFORE UPDATE ON game_match_players
BEGIN
  SELECT RAISE(ABORT, 'game match player history is append-only');
END;
