PRAGMA defer_foreign_keys = ON;

-- Generalize online rooms without deleting existing XO sessions.
CREATE TABLE game_rooms_v2 (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  game_id TEXT NOT NULL CHECK (
    length(game_id) BETWEEN 1 AND 64
    AND game_id NOT GLOB '*[^a-z0-9-]*'
    AND substr(game_id,1,1) GLOB '[a-z0-9]'
    AND substr(game_id,-1,1) GLOB '[a-z0-9]'
  ),
  status TEXT NOT NULL CHECK (
    length(status) BETWEEN 1 AND 32
    AND status NOT GLOB '*[^a-z0-9-]*'
    AND substr(status,1,1) GLOB '[a-z0-9]'
    AND substr(status,-1,1) GLOB '[a-z0-9]'
  ),
  state_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  creator_key TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO game_rooms_v2(id,code,game_id,status,state_json,version,creator_key,expires_at,created_at,updated_at)
SELECT id,code,game_id,status,state_json,version,creator_key,expires_at,created_at,updated_at FROM game_rooms;

CREATE TABLE game_room_players_v3 (
  room_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  learner_id TEXT NOT NULL CHECK (
    length(learner_id) BETWEEN 1 AND 64
    AND learner_id NOT GLOB '*[^a-z0-9-]*'
    AND substr(learner_id,1,1) GLOB '[a-z0-9]'
    AND substr(learner_id,-1,1) GLOB '[a-z0-9]'
  ),
  display_name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  seat INTEGER CHECK (seat IS NULL OR (seat >= 0 AND seat <= 15)),
  participation_role TEXT NOT NULL DEFAULT 'player' CHECK (participation_role IN ('player','spectator')),
  authority_role TEXT NOT NULL DEFAULT 'guest' CHECK (authority_role IN ('host','guest')),
  joined_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (room_id, player_id),
  UNIQUE (room_id, seat),
  UNIQUE (room_id, learner_id),
  FOREIGN KEY (room_id) REFERENCES game_rooms_v2(id) ON DELETE CASCADE
);

INSERT INTO game_room_players_v3(room_id,player_id,learner_id,display_name,token_hash,seat,participation_role,authority_role,joined_at,last_seen_at)
SELECT room_id,player_id,learner_id,display_name,token_hash,seat,'player',CASE WHEN seat=0 THEN 'host' ELSE 'guest' END,joined_at,last_seen_at
FROM game_room_players;

DROP TABLE game_room_players;
DROP TABLE game_rooms;
ALTER TABLE game_rooms_v2 RENAME TO game_rooms;
ALTER TABLE game_room_players_v3 RENAME TO game_room_players;

CREATE INDEX IF NOT EXISTS idx_game_rooms_code ON game_rooms(code);
CREATE INDEX IF NOT EXISTS idx_game_rooms_expiry ON game_rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_game_rooms_creator_time ON game_rooms(creator_key,created_at);
CREATE INDEX IF NOT EXISTS idx_game_room_players_token ON game_room_players(room_id,token_hash);
CREATE INDEX IF NOT EXISTS idx_game_room_players_role ON game_room_players(room_id,participation_role);

PRAGMA defer_foreign_keys = OFF;
