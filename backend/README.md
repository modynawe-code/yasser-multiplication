# Family learning backend

Cloudflare Worker + D1 backend for the Yasser/Khaled learning app.

## Trust boundary

The browser is not authoritative for historical attempts. New attempts are identified by immutable `attemptId` values and sent to D1. Database triggers reject `UPDATE` and `DELETE` on both `attempts` and the one-time learner baseline.

The local four-digit PIN remains only a device UI lock. Cloud sync, restore, and account operations require a server-issued parent bearer session. Passwords are stored as PBKDF2-SHA256 hashes with unique salts; raw session tokens are never stored in D1.

## First deployment

1. Create a D1 database named `yasser-khaled-family`.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` with that database ID.
3. Review `ALLOWED_ORIGINS`; keep only the production GitHub Pages origin and required local development origins.
4. Apply migrations:
   `npx wrangler d1 migrations apply yasser-khaled-family --remote`
5. Deploy:
   `npx wrangler deploy`
6. Configure the published frontend with the resulting Worker origin through `globalThis.__FAMILY_API_BASE_URL__` in the deployment shell/configuration. Do not place secrets in the frontend.

## API

Public: `GET /health`, `POST /v1/auth/register`, `POST /v1/auth/login`.

Authenticated parent only: `POST /v1/auth/logout`, `GET /v1/me`, `POST /v1/sync/baseline`, `POST /v1/sync/attempts`, `POST /v1/sync/session`, `GET /v1/sync/snapshot`.

There is intentionally no client API for updating or deleting attempt history.
