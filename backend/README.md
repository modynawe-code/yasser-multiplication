# Family learning backend

Cloudflare Worker + D1 backend for the Yasser/Khaled learning app.

## Trust boundary

The browser is not authoritative for historical attempts. New attempts are identified by immutable `attemptId` values and sent to D1. Database triggers reject `UPDATE` and `DELETE` on both `attempts` and the one-time learner baseline.

The local four-digit PIN remains only a device UI lock. Cloud sync, restore, and account operations require a server-issued parent bearer session. Passwords are stored as PBKDF2-SHA256 hashes with unique salts; raw session tokens are never stored in D1.

## Cloudflare project isolation

This backend is intentionally isolated from other Cloudflare projects:

- Wrangler profile: `family-learning` (activated only for this backend directory).
- Worker: `yasser-khaled-family-api`.
- D1 database: `yasser-khaled-family`.
- D1 binding used by application code: `DB`.
- Cloudflare account is pinned in `wrangler.jsonc` with `account_id`.

Do not accept Wrangler's automatic D1 snippet if it proposes a different binding name. The backend code uses `env.DB`.

## First deployment

1. Activate/use the dedicated profile from this directory:
   `npx wrangler auth activate family-learning .`
2. Verify the active account/profile:
   `npx wrangler whoami --profile family-learning`
3. Apply migrations to the dedicated remote D1 database:
   `npx wrangler d1 migrations apply yasser-khaled-family --remote --profile family-learning --config wrangler.jsonc`
4. Deploy only this Worker:
   `npx wrangler deploy --profile family-learning --config wrangler.jsonc`
5. Configure the published frontend with the resulting Worker origin through `globalThis.__FAMILY_API_BASE_URL__` in the deployment shell/configuration. Do not place secrets in the frontend.

## API

Public: `GET /health`, `POST /v1/auth/register`, `POST /v1/auth/login`.

Authenticated parent only: `POST /v1/auth/logout`, `GET /v1/me`, `POST /v1/sync/baseline`, `POST /v1/sync/attempts`, `POST /v1/sync/session`, `GET /v1/sync/snapshot`.

There is intentionally no client API for updating or deleting attempt history.
