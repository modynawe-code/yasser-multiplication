PRAGMA defer_foreign_keys = ON;

-- Preserve existing XO rooms while expanding capacity and game support.
CREATE TABLE game_rooms_v2 (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  game_id TEXT NOT NULL CHECK (game_id IN ('xo','king-inspector-thief-executioner')),
  status TEXT NOT NULL CHECK (status IN ('waiting','playing','won','draw','closed')),
  state_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  creator_key TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO game_rooms_v2(id,code,game_id,status,state_json,version,creator_key,expires_at,created_at,updated_at)
SELECT id,code,game_id,status,state_json,version,creator_key,expires_at,created_at,updated_at FROM game_rooms;

CREATE TABLE game_room_players_v2 (
  room_id TEXT NOT NULL REFERENCES game_rooms_v2(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  learner_id TEXT NOT NULL CHECK (
    length(learner_id) BETWEEN 1 AND 64
    AND learner_id NOT GLOB '*[^a-z0-9-]*'
    AND substr(learner_id,1,1) GLOB '[a-z0-9]'
    AND substr(learner_id,-1,1) GLOB '[a-z0-9]'
  ),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
  token_hash TEXT NOT NULL,
  seat INTEGER NOT NULL CHECK (seat BETWEEN 0 AND 3),
  joined_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (room_id,player_id),
  UNIQUE (room_id,seat),
  UNIQUE (room_id,learner_id)
);

INSERT INTO game_room_players_v2(room_id,player_id,learner_id,display_name,token_hash,seat,joined_at,last_seen_at)
SELECT room_id,player_id,learner_id,display_name,token_hash,seat,joined_at,last_seen_at FROM game_room_players;

DROP TABLE game_room_players;
DROP TABLE game_rooms;
ALTER TABLE game_rooms_v2 RENAME TO game_rooms;
ALTER TABLE game_room_players_v2 RENAME TO game_room_players;

CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_expiry ON game_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_game_rooms_creator_time ON game_rooms(creator_key,created_at);
CREATE INDEX IF NOT EXISTS idx_game_room_players_token ON game_room_players(room_id,token_hash);

-- One append-only result per round; roles are stored only after the round ends.
CREATE TABLE IF NOT EXISTS king_inspector_round_history (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  winner_ids_json TEXT NOT NULL,
  scores_json TEXT NOT NULL,
  roles_json TEXT NOT NULL,
  accusation_json TEXT,
  ended_at TEXT NOT NULL,
  UNIQUE (room_code,round_number)
);

CREATE INDEX IF NOT EXISTS idx_king_inspector_history_room_round
  ON king_inspector_round_history(room_code,round_number);

CREATE TRIGGER IF NOT EXISTS king_inspector_history_no_update
BEFORE UPDATE ON king_inspector_round_history
BEGIN
  SELECT RAISE(ABORT, 'game round history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS king_inspector_history_no_delete
BEFORE DELETE ON king_inspector_round_history
BEGIN
  SELECT RAISE(ABORT, 'game round history is append-only');
END;
