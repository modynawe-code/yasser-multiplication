# تعلم ياسر وخالد

The repository now serves one modular family-learning application from `preview-v4/`. The root `index.html` is only a redirect into that application.

## Active structure

- `preview-v4/src/domain` — Yasser multiplication domain state and rules.
- `preview-v4/src/application` — Yasser training/attempt application services.
- `preview-v4/src/modules/khaled` — Khaled Grade 1 mathematics curriculum, question banks, renderers, storage, and UI.
- `preview-v4/src/modules/hub` — learner selection shell/router bridge.
- `preview-v4/src/modules/parent` — combined parent reporting and cloud controls.
- `preview-v4/src/shared` — shared security, audio, append-only data ledger, and sync clients.
- `preview-v4/src/infrastructure` — browser persistence adapters.
- `preview-v4/src/platform` — PWA/service-worker integration.
- `backend/` — Cloudflare Worker + D1 family sync/auth backend.

## Data rules

Learner mistakes are never hidden or rewritten by the app. New attempts are appended with stable attempt IDs. The backend schema additionally rejects UPDATE/DELETE operations on protected attempt history.

The browser remains offline-first. Cloud protection only becomes authoritative after the Worker and D1 database are deployed and the frontend API URL is configured.

## Verification

CI runs the learning-app test suite and backend security/validation tests. Physical Galaxy Tab testing remains a manual release gate and is not replaced by static/CI checks.

See `docs/PROJECT-STATUS.md` for the exact completed and pending release items.
