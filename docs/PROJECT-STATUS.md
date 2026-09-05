# Project Status

Updated: 2026-09-05

## Complete in `main` after the current asset PR merges

- Shared learner hub for Yasser and Khaled.
- Yasser multiplication 1–10 training, exam, mastery, feedback audio, parent reporting, and PWA support.
- Khaled Grade 1 mathematics: curriculum groups 1–13 are playable.
- Khaled guided correction: the first wrong answer is permanently recorded before a second guided attempt.
- Explicit zero counting visual, Arabic speech prompts, touch-target and landscape hardening for tablet use.
- Combined parent report for both learners.
- Append-only local attempt ledger with stable attempt IDs and migration baselines.
- Cloudflare Worker + D1 backend source with real parent authentication, idempotent sync/restore, login throttling, and database-level UPDATE/DELETE protection for attempt history.
- CI for the learning app and backend contracts.
- Seven approved original Khaled PNG assets committed byte-for-byte with SHA-256 regression checks; no resizing, recompression, cropping, or re-encoding.
- Khaled artwork is loaded by scene: only welcome and thinking are warmed initially, while result/celebration states load on first use and enter the normal runtime cache.

## Curriculum verification

- Chapters 1–6: metadata cross-checked against the published 1448 Grade 1 first-term index.
- Chapters 7–13: interactive content is implemented, but current-year 1448 metadata remains explicitly pending until the current edition is available/verified.
- The app implements original interactive practice and does not reproduce textbook pages.

## Pending release gates

1. **Cloud production deployment** — create the real D1 database/binding, run migrations, deploy the Worker, configure exact allowed origins, then configure the frontend API URL. Until this is done, browser storage is still the only live persistence layer.
2. **Physical Galaxy Tab validation** — manually verify portrait/landscape, audio, touch, PWA install, offline/reconnect, learner switching, interrupted-session persistence, and all Khaled curriculum groups on the actual Samsung tablet. CI only provides automated guards.

## Repository rule

`main` is the only current source of truth. Superseded draft PRs must not be merged. New work should use focused branches/PRs with green CI before merge.
