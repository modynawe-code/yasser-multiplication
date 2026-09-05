PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learners (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug IN ('yasser','khaled')),
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(parent_id, slug)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_parent ON auth_sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS learner_baselines (
  learner_id TEXT PRIMARY KEY REFERENCES learners(id) ON DELETE RESTRICT,
  state_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS learner_baselines_no_delete
BEFORE DELETE ON learner_baselines
BEGIN
  SELECT RAISE(ABORT, 'learner baseline is immutable');
END;
CREATE TRIGGER IF NOT EXISTS learner_baselines_no_update
BEFORE UPDATE ON learner_baselines
BEGIN
  SELECT RAISE(ABORT, 'learner baseline is immutable');
END;

CREATE TABLE IF NOT EXISTS attempts (
  attempt_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE RESTRICT,
  skill_id TEXT NOT NULL,
  table_number INTEGER,
  multiplier INTEGER,
  question_id TEXT,
  question_type TEXT,
  answer_json TEXT,
  correct_answer_json TEXT,
  is_correct INTEGER NOT NULL CHECK (is_correct IN (0,1)),
  response_ms INTEGER,
  client_created_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_learner_created ON attempts(learner_id, client_created_at);

CREATE TRIGGER IF NOT EXISTS attempts_no_delete
BEFORE DELETE ON attempts
BEGIN
  SELECT RAISE(ABORT, 'attempt history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS attempts_no_update
BEFORE UPDATE ON attempts
BEGIN
  SELECT RAISE(ABORT, 'attempt history is append-only');
END;

CREATE TABLE IF NOT EXISTS learning_sessions (
  session_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE RESTRICT,
  skill_id TEXT,
  mode TEXT,
  started_at TEXT,
  ended_at TEXT,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  incomplete INTEGER NOT NULL DEFAULT 0 CHECK (incomplete IN (0,1)),
  received_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_learner ON learning_sessions(learner_id, ended_at);

CREATE TABLE IF NOT EXISTS auth_throttle (
  throttle_key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT
);
