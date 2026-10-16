# Family learning backend

Cloudflare Worker + D1 backend for the open Family Learning Platform (Yasser, Khaled, Mashaal, and future registered learners).

## Trust boundary

The browser is not authoritative for historical learning records. New attempts, developmental evidence, and session history use immutable/idempotent identities and are sent to D1. Database triggers reject mutation of protected historical records.

The local four-digit PIN remains only a device UI lock. Cloud sync, restore, and account operations require a server-issued parent bearer session. Passwords are stored as PBKDF2-SHA256 hashes with unique salts; raw session tokens are never stored in D1.

Temporary online game rooms use a separate trust boundary. A room receives a six-digit code and each device receives a random room-player token; only the SHA-256 hash of that token is stored in D1. The server is authoritative for XO turn order, cells, win/draw state, mutual rematch readiness and optimistic room versions. Rooms expire after 30 minutes and do not contain learner progress or parent credentials. Room creation and room-code guessing have separate throttles.

The client stores only the temporary room capability needed to resume an interrupted match. It can reconnect to the same room after refresh/app resume while the room is still valid. Explicitly leaving the games area clears that local resume capability.

The current preview keeps the educational question gate on the child's device. This is suitable for family/friendly play, but it is not a server-verifiable anti-cheat proof. Ranked leaderboards must remain disabled until challenge completion is server-verifiable.

## Cloudflare project isolation

This backend is intentionally isolated from other Cloudflare projects:

- Wrangler profile: `family-learning` (activated only for this backend directory).
- Worker: `yasser-khaled-family-api`.
- D1 database: `yasser-khaled-family`.
- D1 binding used by application code: `DB`.
- Cloudflare account is pinned in `wrangler.jsonc` with `account_id`.

Do not accept Wrangler's automatic D1 snippet if it proposes a different binding name. The backend code uses `env.DB`.

## Migration model

- `0001_family_core.sql` — initial parent/learner/attempt/session core and attempt/baseline immutability.
- `0002_game_rooms.sql` — temporary online game rooms.
- `0003_game_room_join_throttle.sql` — game-room join throttling.
- `0004_open_family_learners.sql` — open learner slugs, preserved historical family rows, developmental evidence, append-only evidence protection.
- `0005_learning_session_payload.sql` — exact curriculum-specific session JSON plus append-only session protection.

Do not apply production migrations ad hoc. Follow `PRODUCTION_ROLLOUT.md`; it requires explicit pre-migration bookmark/export/counts, post-migration verification, and Mohammed's approval before remote production changes.

## Deployment

From this directory:

1. Activate/use the dedicated profile:
   `npx wrangler auth activate family-learning .`
2. Verify the currently active profile/account:
   `npx wrangler whoami`
3. Review pending remote migrations before applying anything:
   `npx wrangler d1 migrations list yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc`
4. Follow `PRODUCTION_ROLLOUT.md` for backup/bookmark/migration verification.
5. After the database gate passes, deploy only this Worker:
   `npx wrangler deploy --profile family-learning --config wrangler.jsonc`
6. Configure the published frontend with the resulting Worker origin through `globalThis.__FAMILY_API_BASE_URL__` in the deployment shell/configuration. Do not place secrets in the frontend.

## API

Public account endpoints:
- `GET /health`
- `POST /v1/auth/register`
- `POST /v1/auth/login`

Temporary game-room endpoints:
- `POST /v1/games/rooms`
- `POST /v1/games/rooms/join`
- `GET /v1/games/rooms/:code`
- `POST /v1/games/rooms/:code/actions`

Reading/updating an existing room requires its temporary `x-game-token`.

Authenticated parent only:
- `POST /v1/auth/logout`
- `GET /v1/me`
- `POST /v1/sync/baseline`
- `POST /v1/sync/attempts`
- `POST /v1/sync/evidence`
- `POST /v1/sync/session`
- `GET /v1/sync/snapshot`

There is intentionally no client API for updating or deleting protected historical attempts, evidence, or learning sessions.
