PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS game_rooms (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  game_id TEXT NOT NULL CHECK (game_id IN ('xo')),
  status TEXT NOT NULL CHECK (status IN ('waiting','playing','won','draw','closed')),
  state_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  creator_key TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_room_players (
  room_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  learner_id TEXT NOT NULL CHECK (learner_id IN ('yasser','khaled')),
  display_name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  seat INTEGER NOT NULL CHECK (seat IN (0,1)),
  joined_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (room_id, player_id),
  UNIQUE (room_id, seat),
  UNIQUE (room_id, learner_id),
  FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_expiry ON game_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_game_rooms_creator_time ON game_rooms(creator_key,created_at);
CREATE INDEX IF NOT EXISTS idx_game_room_players_token ON game_room_players(room_id,token_hash);
