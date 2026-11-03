# Monopoly TV — binding visual acceptance and implementation ledger

Status: IN PROGRESS — no visual acceptance granted.
Branch: `feature/monopoly-tv-multiscreen-v1`
Baseline before this ledger: `cf22ad28dd41667d6943c148b69ff56576bc1844`
Scope: TV viewer, independent phone controllers, isolated staging, Android TV. Production `main` is out of scope.

## Evidence-based audit (2026-11-03)
- Existing TV DOM presentation: `preview-v4/monopoly-party/tv/tv.js` builds 40 HTML cells, a DOM center scene, circular player tokens and HTML dice.
- `preview-v4/monopoly-party/party.css` uses CSS `transform: scale()` and `transform-origin` for focus, and CSS position transitions for tokens; this does NOT meet the cinematic camera acceptance gate.
- Current inspected manifests (`package.json`, `preview-v4/package.json`) do not list PixiJS, GSAP or Three.js; they are not verified as integrated.
- Room backend and controller exist; preserve their server authority and per-player permissions.
- Confirmed successful CI on previous TV branch: Preview V4 CI run 41673625506, TV/Phone QA run 41673499376, isolated live staging run 41672571162, Android TV APK run 41672570939 (earlier commit).
- Real 50-inch Android TV testing and final cinematic visuals remain **NOT VERIFIED**.
- These recorded successful workflow runs are evidence for the tested scope, NOT proof of all game rules, visual fidelity, TV device performance, or final APK.

## Non-negotiable implementation contract

1. Never duplicate financial/rules logic in a renderer. All random dice and financial decisions originate from the authoritative game state.
2. PixiJS/WebGL must render **actual TV scene content**, not merely appear in dependencies. Record specific module imports, rendered layers, a running screenshot/video and frame measurements. Provide DOM fallback only where necessary (accessibility/offline).
3. GSAP must own the TV cinematic timeline and camera transitions, with cancellation/recovery and `prefers-reduced-motion` behavior. Record code imports and a verified animation capture.
4. Investigate Three.js only for genuine 3D dice/pawns/lighting requirements; use it if real render benefit exceeds integration/performance costs. Document acceptance/rejection with evidence. Do not pretend a 2D canvas is a real 3D world.
5. Use existing Cloudflare Worker + D1 first. Durable Objects/WebSockets are conditional on measured latency and recovery defects, not a mandatory migration. No production D1 migration or billable resource activation without explicit approval and rollback.
6. Preserve public-only QR code, scoped per-player session tokens, spectator-only TV access, action permission checks, idempotency and versioning.
7. Keep original family app routes, Quran, learning games, existing Monopoly and production data intact.
8. No claim of release readiness without tested TV and phone browsers, APK artifact, actual Android TV acceptance, and user visual approval.
9. Each requirement is either NOT STARTED, IMPLEMENTED/UNVERIFIED, FAILED or VERIFIED. A GitHub commit alone is not visual proof.
10. Capture accessibility, RTL, reduced motion, sound unlock/mute, performance and disconnect behavior.

## Acceptance ledger

| ID | Required result | Mandatory tool / path | Observable gate | Current status |
|---|---|---|---|---|
| BASE-01 | Reproducible baseline and rollback SHA | Git/GitHub Actions | Baseline tests + rollback documented | PARTIAL |
| RENDER-01 | Full-screen 16:9 high-quality TV game table, readable from 50-inch distance | PixiJS/WebGL | On-device screenshot; correct 40-tile hit locations and visible property overlays | NOT STARTED |
| RENDER-02 | Real shadows, surfaces, property states, 2–4 player tokens, houses/hotels | PixiJS/WebGL | Screenshot comparisons before/after, correct board coordinates | IMPLEMENTED/UNVERIFIED (initial pawn/shadow layer only) |
| CAMERA-01 | Idle overview > dice throw > step-by-step follow > landing focus > event > smooth overview | GSAP timeline | Recorded multi-turn video; no competing animations, precise camera follow | IMPLEMENTED/UNVERIFIED (camera GSAP; complete scene director pending) |
| CAMERA-02 | Event safe zones: never cover active tile, token or essential event | GSAP + layout tests | Screenshot checks at 1080p and TV viewport | NOT STARTED |
| DICE-01 | Two convincing dice with roll, collision, bounce and result from server only | PixiJS + optionally Three.js | Video at normal speed, deterministic outcome verification | IMPLEMENTED/UNVERIFIED (Three.js BoxGeometry, six textured faces and GSAP bounce; real physics collision and visual approval pending) |
| TOKEN-01 | 2–4 visually distinct pieces turn corners and move one tile at a time | PixiJS + GSAP | Video + motion/position tests | IMPLEMENTED/UNVERIFIED (Pixi pawns on existing step route) |
| EVENT-01 | Distinct scenes for buy, rent, auction, build, mortgage, trade, chance, chest, jail, bankruptcy and victory | PixiJS + GSAP | Each event exercised, recorded and checked against server state | NOT STARTED |
| AUDIO-01 | Dice, steps, money, construction, cards, jail, win, mute and levels | Existing audio + Web Audio | Captured sound and no autoplay failures | NOT STARTED |
| PHONE-01 | Each player sees turn, actions, cash, property and drag-to-roll | Existing controller + accessibility | 2/3/4 player test on phones | IMPLEMENTED/UNVERIFIED |
| SYNC-01 | No duplicate money changes, disallowed actions or missing turns | Cloudflare/D1 + backend tests | Failure/rejoin/replay permission tests | PARTIAL |
| NET-01 | Timing/reconnection measured before considering DO/WebSocket | QA instrumentation | Measured latency with 2–4 players and network interruptions | NOT STARTED |
| TV-01 | Android TV install, remote navigation, resume, scaling, audio | Android TV APK + device | Actual 50-inch TV acceptance | NOT STARTED |
| QA-01 | Browser, engine, integration, E2E, visual, accessibility and perf gates | Playwright + CI | All listed evidence links and no required gate skipped | PARTIAL |
| RELEASE-01 | Staging accepted, QA evidence and reversible merge/deploy | GitHub Actions | User approval + exact released SHA verified live | NOT STARTED |

## Release gate
A stage is VERIFIED only with: file paths + commit SHA + test run URL + relevant screenshot/video + explicit limitations. If any evidence is missing, status stays IMPLEMENTED/UNVERIFIED. CI must not assert "visual passed" solely because unit tests succeeded.

## Implementation order
1. Baseline and independent TV visual proof. Audit manifests and current scene before changing any code.
2. Integrate PixiJS in a self-contained TV renderer adapter with graphics assets and DOM compatibility fallback; test board scale and token placement.
3. Integrate GSAP into cancellable presentation timeline; implement one full dice-to-event sequence and verify in a browser.
4. Decide on Three.js from real 3D quality/performance proof; build dice/pawns as needed.
5. Extend all 12+ game scene types; sound design, responsive TV layout and reduced motion.
6. Run staged 2–4 player authoritative game tests, reconnection, performance and security.
7. Build APK, test physical Android TV, gain user visual approval, then consider production release.

## Safeguards
- No force-push or edits to `main`.
- No new chargeable services, secrets changes, or production DB migrations.
- If WebGL context fails, user must still see a meaningful TV room and be able to return.
- If animation fails, game state must remain unchanged and resync from server snapshot.
- Make minimal focused commits and keep a rollback reference.

## 2026-11-03 TV renderer integration checkpoint
- Commits: `622563a` initial Pixi + GSAP scene, `50401d4` TV integration, `a676b43` Android packaging, `1d4af5c` Chromium actual canvas mount contract, `0fc92cb` Pixi dice drawing, `17abd2a` roll-before-travel integration, `515e198` dice contract tests.
- Verified earlier integration: [TV+phone browser QA run 41677074222](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41677074222) SUCCESS; [Android TV APK run 41676868212](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41676868212) SUCCESS. Those runs precede the new dice animation.
- Required latest validation: [TV+phone QA run 41677652576](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41677652576), [TV staging run 41677652750](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41677652750), [Android TV APK run 41677652579](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41677652579). Check their conclusions before marking any gate VERIFIED.
- No user physical TV acceptance has happened. DOM/CSS board remains present. This is a foundation, **not** finished high-fidelity 3D graphics.

## 2026-11-03 Three.js volumetric dice checkpoint
- Three.js version `0.187.0` pinned in isolated renderer dependencies; `tools/monopoly-tv-renderer/dice3d.mjs` creates real BoxGeometry meshes, six textured face materials, directional + ambient lights and an overlay WebGL canvas.
- The visible face is chosen only from `state.dice`, with quaternion orientation for each server-defined result. GSAP animates 3D cube rotations and bounces. No local random rolls or monetary actions.
- On WebGL/context initialization failure, renderer gracefully returns to the previous PixiJS dice path. Context is initialized lazily, with cleanup on scene destruction.
- `preview-v4/tools/monopoly-tv-qa.py` now requires a visible Three.js canvas in Chromium during an actual two-player simulated turn, and the contract test requires 3D geometry and server result mapping.
- Commits: `4cc0346` dependency, `63ed585` actual Three.js dice, `18f3817` wiring and fallback, `ee9b6de` contract, `fbc274b` browser check.
- **No physical cube simulation/rigid-body physics yet**; no approved high-fidelity complete game scene yet. The last build and visual QA conclusions must be checked before approval.
