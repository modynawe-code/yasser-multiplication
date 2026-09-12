PRAGMA defer_foreign_keys = ON;

CREATE TABLE learners_v2 (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (
    length(slug) BETWEEN 1 AND 64
    AND slug NOT GLOB '*[^a-z0-9-]*'
    AND substr(slug,1,1) GLOB '[a-z0-9]'
    AND substr(slug,-1,1) GLOB '[a-z0-9]'
  ),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
  created_at TEXT NOT NULL,
  UNIQUE(parent_id, slug)
);

CREATE TABLE learner_baselines_v2 (
  learner_id TEXT PRIMARY KEY REFERENCES learners_v2(id) ON DELETE RESTRICT,
  state_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE attempts_v2 (
  attempt_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners_v2(id) ON DELETE RESTRICT,
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

CREATE TABLE learning_sessions_v2 (
  session_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners_v2(id) ON DELETE RESTRICT,
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

INSERT INTO learners_v2(id,parent_id,slug,display_name,created_at)
SELECT id,parent_id,slug,display_name,created_at FROM learners;

INSERT INTO learner_baselines_v2(learner_id,state_json,created_at)
SELECT learner_id,state_json,created_at FROM learner_baselines;

INSERT INTO attempts_v2(attempt_id,learner_id,skill_id,table_number,multiplier,question_id,question_type,answer_json,correct_answer_json,is_correct,response_ms,client_created_at,received_at)
SELECT attempt_id,learner_id,skill_id,table_number,multiplier,question_id,question_type,answer_json,correct_answer_json,is_correct,response_ms,client_created_at,received_at FROM attempts;

INSERT INTO learning_sessions_v2(session_id,learner_id,skill_id,mode,started_at,ended_at,correct,wrong,total,incomplete,received_at)
SELECT session_id,learner_id,skill_id,mode,started_at,ended_at,correct,wrong,total,incomplete,received_at FROM learning_sessions;

DROP TRIGGER IF EXISTS learner_baselines_no_delete;
DROP TRIGGER IF EXISTS learner_baselines_no_update;
DROP TRIGGER IF EXISTS attempts_no_delete;
DROP TRIGGER IF EXISTS attempts_no_update;

DROP TABLE learner_baselines;
DROP TABLE attempts;
DROP TABLE learning_sessions;
DROP TABLE learners;

ALTER TABLE learners_v2 RENAME TO learners;
ALTER TABLE learner_baselines_v2 RENAME TO learner_baselines;
ALTER TABLE attempts_v2 RENAME TO attempts;
ALTER TABLE learning_sessions_v2 RENAME TO learning_sessions;

CREATE TABLE learning_evidence (
  evidence_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE RESTRICT,
  skill_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  payload_json TEXT,
  client_created_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_learners_parent ON learners(parent_id);
CREATE INDEX IF NOT EXISTS idx_attempts_learner_created ON attempts(learner_id, client_created_at);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_learner ON learning_sessions(learner_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_learning_evidence_learner_created ON learning_evidence(learner_id, client_created_at);

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

CREATE TRIGGER IF NOT EXISTS learning_evidence_no_delete
BEFORE DELETE ON learning_evidence
BEGIN
  SELECT RAISE(ABORT, 'learning evidence is append-only');
END;

CREATE TRIGGER IF NOT EXISTS learning_evidence_no_update
BEFORE UPDATE ON learning_evidence
BEGIN
  SELECT RAISE(ABORT, 'learning evidence is append-only');
END;

PRAGMA defer_foreign_keys = OFF;
