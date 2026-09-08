ALTER TABLE learning_sessions ADD COLUMN session_json TEXT;

CREATE TRIGGER IF NOT EXISTS learning_sessions_no_delete
BEFORE DELETE ON learning_sessions
BEGIN
  SELECT RAISE(ABORT, 'learning session history is append-only');
END;

CREATE TRIGGER IF NOT EXISTS learning_sessions_no_update
BEFORE UPDATE ON learning_sessions
BEGIN
  SELECT RAISE(ABORT, 'learning session history is append-only');
END;
