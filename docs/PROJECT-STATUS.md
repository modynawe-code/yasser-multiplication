# Project Status

Updated: 2026-09-07

## Verified on `feature/games-platform-v1`

- Shared learner hub for Yasser and Khaled.
- Yasser multiplication 1–10 training, exam, mastery, feedback audio, parent reporting, and PWA support.
- Khaled Grade 1 mathematics: curriculum groups 1–13 are playable.
- Khaled guided correction: the first wrong answer is permanently recorded before a second guided attempt.
- Explicit zero counting visual, Arabic speech prompts, touch-target and landscape hardening for tablet use.
- Combined parent report for both learners.
- Append-only local attempt ledger with stable attempt IDs and migration baselines.
- Cloudflare Worker + D1 production backend is live at `https://yasser-khaled-family-api.modynawe.workers.dev`.
- Production smoke verification covers `/health`, Capacitor CORS, protected cloud-sync boundary, XO room creation, a second learner joining from another device context, and authenticated room reads.
- Android ignores stale development API overrides stored by older previews and uses the production family API unless an explicit runtime injection is supplied.
- XO local and online room flows are implemented; production two-player room lifecycle is verified from an external GitHub runner.
- CI covers the learning app, family backend contracts, launcher-icon contract, rewards/challenges, and Android APK build.
- Android launcher icon uses the approved Yasser + Khaled + calculator composition with split orange/blue identity and no text.
- Seven approved original Khaled PNG assets are protected against unintended resizing/recompression/re-encoding.

## Curriculum verification

- Chapters 1–6: metadata cross-checked against the published 1448 Grade 1 first-term index.
- Chapters 7–13: interactive content is implemented, but current-year 1448 metadata remains explicitly pending until the current edition is available/verified.
- The app implements original interactive practice and does not reproduce textbook pages.

## Remaining release gate

1. **Physical Galaxy Tab validation** — verify the latest APK on the actual Samsung tablet: online XO from two physical devices, parent cloud account/sync using the family account, portrait/landscape, touch, offline/reconnect, learner switching, interrupted-session persistence, and the full curriculum flows. Automated CI and production smoke are guards but do not replace the device check.

## Deployment rule

- Production backend deployment is explicit/manual through `.github/workflows/backend-production-deploy.yml` and requires the repository secret `CLOUDFLARE_API_TOKEN` only when a future backend deployment is intentionally requested.
- `.github/workflows/backend-production-smoke.yml` is the non-destructive production verification gate and does not require Cloudflare credentials.

## Repository rule

`main` remains the release source of truth after verified feature work is merged. Superseded draft PRs must not be merged. New work should use focused branches/PRs with green CI and device validation where applicable.
