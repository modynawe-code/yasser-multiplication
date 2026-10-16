# Family Learning Backend — Controlled Production Rollout

Status: **prepared only — not executed**.

This runbook exists so production D1 changes are never improvised. Do not run the remote migration or deploy the Worker until PR #29 release blockers are cleared and Mohammed explicitly approves production rollout.

Database: `yasser-khaled-family`  
Binding: `DB`  
Wrangler profile: `family-learning`  
Config: `wrangler.jsonc`

## 1. Release gate before touching production

Require all of the following:

- latest integration-branch CI is green;
- PR #29 is the reviewed source of truth;
- Mashaal local Surat Al-Ikhlas media + SHA-256 gate is cleared;
- target Galaxy Tab visual QA is complete;
- explicit approval to perform the production migration is given.

Stop if any item is missing.

## 2. Confirm the Cloudflare account and pending migrations

Run from `backend/`:

```bash
npx wrangler auth activate family-learning .
npx wrangler whoami
npx wrangler d1 migrations list yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc
```

Do not assume which migrations are pending. Record the actual list shown by Wrangler before proceeding.

## 3. Capture two independent recovery points

First capture the current D1 Time Travel bookmark:

```bash
npx wrangler d1 time-travel info yasser-khaled-family --profile family-learning --config wrangler.jsonc
```

Copy the bookmark into the rollout log before applying anything.

Also export the remote database to a timestamped SQL file outside the deployed asset tree:

```bash
npx wrangler d1 export yasser-khaled-family --remote --output=./backups/pre-family-rollout-YYYYMMDD-HHMM.sql --profile family-learning --config wrangler.jsonc
```

Create the local `backups` directory first if needed. Do not commit production database exports to Git.

Cloudflare D1 also captures a backup when migrations are applied, but the explicit export + bookmark are required by this project runbook.

## 4. Record pre-migration row counts

The pre-open-family schema already contains these historical tables. Record their counts:

```bash
npx wrangler d1 execute yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc --command="SELECT 'parents' AS table_name, COUNT(*) AS rows FROM parents; SELECT 'learners' AS table_name, COUNT(*) AS rows FROM learners; SELECT 'learner_baselines' AS table_name, COUNT(*) AS rows FROM learner_baselines; SELECT 'attempts' AS table_name, COUNT(*) AS rows FROM attempts; SELECT 'learning_sessions' AS table_name, COUNT(*) AS rows FROM learning_sessions;"
```

Save the output in the rollout log. Migration `0004_open_family_learners.sql` must preserve those existing rows while opening learner slugs and adding developmental evidence.

## 5. Apply migrations

Only after the preflight, bookmark, export, and row-count snapshot are complete:

```bash
npx wrangler d1 migrations apply yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc
```

Relevant family migrations include:

- `0004_open_family_learners.sql` — generic learner slugs, preserved historical rows, developmental evidence and immutability triggers;
- `0005_learning_session_payload.sql` — exact `session_json` storage and append-only session triggers.

If Wrangler reports a migration error, stop. Do not manually patch production SQL in place.

## 6. Verify schema and immutability before Worker deploy

Confirm there are no unexpected pending migrations:

```bash
npx wrangler d1 migrations list yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc
```

Verify the session payload column:

```bash
npx wrangler d1 execute yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc --command="PRAGMA table_info(learning_sessions);"
```

Verify critical append-only triggers:

```bash
npx wrangler d1 execute yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc --command="SELECT name FROM sqlite_schema WHERE type='trigger' AND name IN ('attempts_no_delete','attempts_no_update','learner_baselines_no_delete','learner_baselines_no_update','learning_evidence_no_delete','learning_evidence_no_update','learning_sessions_no_delete','learning_sessions_no_update') ORDER BY name;"
```

Expected trigger count: **8**.

## 7. Compare post-migration historical row counts

Run the same historical count query from step 4 and compare each pre-existing table count. Existing parent, learner, baseline, attempt, and session rows must not decrease.

Then verify the new developmental evidence table exists:

```bash
npx wrangler d1 execute yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc --command="SELECT COUNT(*) AS learning_evidence_rows FROM learning_evidence;"
```

Any unexplained historical row loss is a stop/rollback condition.

## 8. Deploy the Worker only after database verification

```bash
npx wrangler deploy --profile family-learning --config wrangler.jsonc
```

After deploy:

- call `GET /health` on the deployed Worker;
- verify parent authentication;
- verify a read-only snapshot can be retrieved for an authenticated test parent;
- do not generate/delete historical production data merely to test immutability.

## 9. Rollback rule

Rollback is for a confirmed production problem such as unexplained row loss, broken authentication/snapshot reads, or schema incompatibility. Do not rollback simply because the UI has a visual issue.

The preferred database rollback point is the **pre-migration Time Travel bookmark captured in step 3**. D1 Time Travel restore overwrites the database in place, so it requires an explicit decision before execution:

```bash
npx wrangler d1 time-travel restore yasser-khaled-family --bookmark=<PRE_MIGRATION_BOOKMARK> --profile family-learning --config wrangler.jsonc
```

Keep the SQL export as the independent recovery artifact. Do not attempt to fake a rollback by writing ad-hoc inverse SQL against append-only production history.

## 10. Close the rollout

Record:

- deployed integration commit SHA;
- CI run number;
- pre-migration bookmark;
- export filename;
- migration list applied;
- before/after row counts;
- trigger verification result;
- Worker deployment URL/version;
- health/snapshot smoke-test result.

Only after those checks pass should `productionMigrationApplied` be changed to `true` in the Mashaal release gate.

## Cloudflare references

- D1 Wrangler commands: https://developers.cloudflare.com/d1/wrangler-commands/
- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- D1 import/export: https://developers.cloudflare.com/d1/best-practices/import-export-data/
- D1 Time Travel: https://developers.cloudflare.com/d1/reference/time-travel/
