# Security model

## Current static/PWA phase
GitHub Pages is a public static client. Nothing shipped to the browser is secret. The local parent PIN is only a UX gate and is **not** an authorization boundary. LocalStorage can be cleared by a device user.

## Backend phase requirements
- HTTPS only.
- Student and parent identities with separate authorization scopes.
- Server-side validation of every attempt payload.
- Server-generated/verified timestamps where relevant.
- Append-only attempt history for student clients; no student delete permission.
- Rate limiting and abuse controls.
- Least-privilege database credentials and environment-managed secrets.
- No API secrets embedded in JavaScript or the PWA bundle.
- Audit trail for privileged parent/admin actions.
- Mastery and reports calculated server-side from trusted attempt records.
- Database constraints, foreign keys, migrations and indexed access paths.

## Trust boundary
The browser is untrusted. A student can modify JavaScript, localStorage or network requests. The future server must never trust client-provided mastery, scores, roles or historical counters.
