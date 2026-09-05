# Architecture

## Goal
Keep learning rules independent from the browser UI so the same domain/application logic can later be reused by a native Android/iOS client or a separate parent dashboard.

## Layers
- `src/domain`: pure learning concepts, state shape, mastery and question selection. No DOM and no storage.
- `src/application`: use-case logic such as attempts, training sessions and progress aggregation.
- `src/infrastructure`: replaceable adapters such as local storage today and remote API sync later.
- `src/ui`: browser rendering and event binding only.
- `src/platform`: PWA/browser platform concerns.

## Dependency direction
UI -> Application -> Domain
Infrastructure implements storage/sync concerns consumed by the application bootstrap.
Domain must never import UI, browser APIs or backend clients.

## Migration rule
Any future backend must be added as an infrastructure adapter behind stable application contracts. Any future mobile app should reuse the same domain rules or mirror the same API contracts rather than embedding business rules in screens.
