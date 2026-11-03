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
| CAMERA-01 | Idle overview > dice throw > step-by-step follow > landing focus > event > smooth overview | GSAP timeline | Recorded multi-turn video; no competing animations, precise camera follow | IMPLEMENTED/UNVERIFIED (bounded XY tracking, timed overview, live visual signoff pending) |
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

## 2026-11-03 camera and tabletop checkpoint
- Verified root cause of CI regression: contract test incorrectly expected `function rollDice(values)` after it changed to `async function rollDice(values,previousState=null)`; previous runs failed before browser QA, obscuring real visual status. Corrected in commit `8132b43` without weakening authorization or geometry assertions.
- TV camera now uses GSAP's real x/y translations and clamped scale around fixed center; stepping uses short transitions, landing uses longer easing; end of arrival schedules wide overview and cancels stale callbacks on new snapshots or disconnect. See `tools/monopoly-tv-renderer/scene.mjs` and `preview-v4/monopoly-party/tv/tv.js`.
- TV CSS gives the main board a larger 88vh target (previously 82vh), reduces HUD rail width and QR footprint on large viewports, and gives the table frame a distinct wood/brass-like appearance. It does not yet prove AAA quality or actual 50-inch readability.
- New regression test asserts bounded XY follow and reset. Latest CI runs for `2bae9844`: [TV QA 41680263791](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680263791), [preview 41680263844](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680263844), [isolated staging 41680263816](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680263816), [TV APK 41680263770](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680263770). Their conclusions must be verified before marking any gate VERIFIED.

## 2026-11-03 event-card presentation checkpoint
- A prior combined QA run 41680263791 reported Chromium timeout awaiting the Three.js canvas, while WebKit passed the full gameplay scenario. This is a **real unverified Three.js browser-gate failure**, not grounds for declaring 3D accepted. The source-only tests and general app CI passed.
- Modified Chromium QA runner to opt into software WebGL2 with SwiftShader and to report context support plus TV console errors when browser acceptance fails. Conditional fallback is explicitly identified rather than mislabeled as working 3D. Commit `dea30fd`.
- Added GSAP controlled cinematic event-card reveal for property, auction, chance/community, trade and finished events, with reduced-motion and cancellation on leave. Commits `35cfdae`, `8b6dd29`, `d91c657`.
- Preview V4 CI for commit `d91c657` passed: [run 41680901936](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680901936). Full [TV/Phone QA 41680901862](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680901862), [staging 41680901635](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680901635), and [APK 41680901732](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680901732) have no final verified result at this checkpoint.
- The card reveal is presentation only. No cinematic visual approval or live Android TV acceptance has been given.

## 2026-11-03 durable resume checkpoint (before next code edit)
- **Known branch head**: `b460c94acc397cf8bdd686d0c679f1f614a8bdab`. Work only on `feature/monopoly-tv-multiscreen-v1`; do not merge or change production `main`.
- **Last tested gate**: [QA run 41680901862](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680901862) FAILED in Chromium waiting for `#partyBoard canvas.tv-three-dice-canvas` after first roll; WebKit played the full game scenario successfully. Chromium reported WebGL2 supported and no page console errors. This failure is **unresolved** and 3D browser acceptance is NOT VERIFIED.
- **Positive evidence**: [Preview CI run 41680901936](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680901936) SUCCESS, [Android TV APK run 41680901732](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41680901732) SUCCESS. APK build success does not establish physical TV performance.
- **Probable failure path to investigate**: TV viewer polls authoritative snapshots every ~1250ms. If the viewer sees `waiting` then jumps directly to the post-roll `playing/property` state, the `renderRoom` guard `old.status==='waiting'` suppresses travel/dice on the first roll. If old phase was not `roll`, the existing dice condition also suppresses playback. Confirm with a reproducible test; do not assume this diagnosis is proven until Chromium QA passes.
- Next actions: preserve the prior waiting player coordinates, detect server `presentation.action==='roll'` even if an intermediate phase snapshot is skipped, animate only genuine changed player positions, leave reconnect initial snapshots unanimated, and assert a real Three canvas/pawn count in browser QA.
- Pending: cinematic board materials, true rigid-body collisions, remaining event scenes, 50-inch Android TV visual/performance and user sign-off.

## 2026-11-03 first-roll replay guard checkpoint
- Persistent save checkpoint: `fa8670678c63a72119f1b3996bb3bdc094153119` before code changes.
- Fixed spectator polling skip: `renderRoom` now treats previous `waiting` snapshot as eligible for an authoritative `playing` movement when player positions differ, and triggers dice when `state.presentation.action==='roll'` even if the intermediate `phase==='roll'` was not observed. This changes presentation only and leaves server rules, dice results and permissions untouched. Code commit `21c70668`.
- Added regression contract test for skipped-phase fallback, commit `218a7b39`.
- Validation currently pending at latest commit: [Preview CI run 41681636120](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41681636120), [TV+Phone QA run 41681635795](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41681635795). Do not mark the Chromium Three.js gate passed without a successful real browser QA run and screenshot review.

## 2026-11-03 event-specific visual QA checkpoint
- Confirmed recovery after polling fix: [TV + phone QA 41681635795](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41681635795) SUCCESS with Chromium `supportsWebGL2=true`, `threeDice=3D WebGL canvas active with server-provided dice`, gameplay actions `start, roll, buy, build, trade, trade-accept, end, roll`. WebKit also passed its gameplay test. [Preview V4 CI 41681636120](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41681636120) SUCCESS, 35 tests passed in the targeted TV QA job.
- Added server-driven presentation themes for purchase, construction, mortgage/redeem, sale, jail, trade/auction, and finished/card scenes. Events use existing `state.presentation.action` and `state.log`; no new financial logic in the TV viewer. Changes: `preview-v4/monopoly-party/tv/tv.js`, `preview-v4/monopoly-party/party.css`, `tools/monopoly-tv-renderer/scene.mjs`.
- Added Playwright TV screenshots for purchase and building events in Chromium and WebKit `preview-v4/tools/monopoly-tv-qa.py` (commit `b15426278de1436a4f1159015f4e8da02ece3fef`). **Do not mark event scenes visually VERIFIED until this test passes and screenshots are reviewed.**
- This remains isolated TV staging development, not the production family learning site. Physical 50-inch device and premium material-quality approval remain pending.

## 2026-11-03 expanded event scenes / current resume checkpoint
- Verified Three.js browser acceptance: [QA run 41681635795](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41681635795) SUCCESS (Chromium Three canvas and dice/pawns; WebKit controller flow). This is NOT a physical TV visual signoff.
- Implemented distinct TV presentation treatment for authoritative actions: purchase, build, mortgage, unmortgage, sale, jail, trade-accept/reject, auction; existing chance/community, property and victory scenes retained. Display labels use the action kind; state.log supplies the authoritative outcome text. No new server rules or monetary changes.
- Linked new CSS `data-event` styling and GSAP reveal, implemented in `preview-v4/monopoly-party/tv/tv.js`, `preview-v4/monopoly-party/party.css`, `tools/monopoly-tv-renderer/scene.mjs`. The special case of `build` during `roll` phase is handled in commit `d8f18018689b0ca3a5339cf333a29709b616d1c6`.
- New Playwright video-stage screenshots for purchase and construction at `preview-v4/tools/monopoly-tv-qa.py` (commit `b15426278de1436a4f1159015f4e8da02ece3fef`). Latest implementation checks: [CI 41682744647](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41682744647), [TV/Phone QA 41682744581](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41682744581), [Staging 41682744756](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41682744756), [APK 41682744798](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41682744798). These were queued at last inspection, so status remains IMPLEMENTED/UNVERIFIED until conclusions and screenshots checked.
- No production `main` modifications, no claim of complete cinematic world or physically simulated collisions. Remaining priorities: inspect real event screenshots, refine event choreography and type safety, test device performance/50-inch readability and gain visual approval.

## TV-first visual redesign checkpoint — 2026-11-03
- Reviewed actual user screenshot at 1536×960: 760-ish square board confined by oversized side panels, huge baked center branding during waiting, long clickable URL, and one pawn drawn visually beyond the expected tile. This screenshot is a **failed visual acceptance**, even though previous Pixi/Three/GSAP integration CI was green.
- Strict visual scope: maximize legible square board within 16:9 view, compact sidebar info and QR, remove visible baked center logo with an opaque center overlay without touching the 40 property tile art, and clamp 2D pawn centers using transformed board-local coordinates.
- Edited only TV-scoped DOM/CSS/renderer: `preview-v4/monopoly-party/tv/index.html`, `tv.js`, `preview-v4/monopoly-party/party.css`, `tools/monopoly-tv-renderer/scene.mjs`. Phone controller layout and rules unchanged; Three.js dice/pawns and GSAP camera preserved.
- Added an actual-browser TV visual baseline assertion in `preview-v4/tools/monopoly-tv-qa.py` checking square board dimensions, stage height and opaque center overlay, alongside existing real Pixi and Three canvas assertions. [TV QA run 41684878396](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41684878396) pending at checkpoint; visual acceptance remains **IMPLEMENTED/UNVERIFIED** until screenshots reviewed.
- Follow-up must compare lobby and active-game screenshots at 1280x720 and 1920x1080, confirm all pawns lie within real source tile cells, ensure neither event cards nor panels obstruct the board, and verify output on the target 50-inch Android TV device. No production merge.

## TV visual design V2 checkpoint — 2026-11-03
- Prior observed Chromium/WebKit QA at 1280×720 yielded only 598px board width even though functional QA passed (run 41684878396). This was treated as a failed visual baseline, not visual acceptance.
- Implemented TV-only immersive table-first layout in `preview-v4/monopoly-party/party.css`. The board now has viewport-height-based sizing `min(calc(100dvh - 74px),calc(100vw - 350px),1120px)`, while side HUD, code and player rail remain compact. On active game, the QR and join hyperlink collapse, leaving the room code available.
- Eliminated competing CSS transform transitions for the GSAP-controlled `.tv-board.cinematic-ready` camera. Retained the existing Three.js dice/pawns and PixiJS fallback. Added premium wood/brass tabletop frame styling with restrained felt-green surround and calm state-specific center visuals. No new network dependency, subscription or production data changes.
- Introduced Playwright screenshots `chromium-tv-final-720p.png`, `chromium-tv-final-1080p.png` and their WebKit equivalents. Acceptance gates explicitly demand board width >=610px at 1280×720 and >=900px at 1920×1080; check that the table fits viewport and join QR is hidden in active play. **These gates are targets, not verified results**.
- New source commits: `b358474c9ee59604a5952e6cfbdd92ead6c07ae6` (TV hierarchy), `beda06f3f38acbc30014180905df4e6bdc7c6140` (viewport math), `69a2df4408d3e6ff59aa36c0d242947e799eeca3` (browser visual gates), `abe00b4eec581895e4cfdc320ada52ab831e7fa6` (Playwright viewport call fix).
- Critical open gate: latest Chromium+WebKit visual QA with final commit and successful isolated staging deploy; an earlier Cloudflare staging build failed due remote `ECONNRESET` despite successful local tests. Do not present the old staging URL as confirmed upgraded until the deploy run passes.

## Genuine Three.js board rendering — 2026-11-03
- User explicitly rejected CSS-only upgrades and required an actual new visual layer, with the existing online/phone controller and server-owned logic preserved.
- Built a mesh-backed **3D table surface** inside the existing shared Three.js WebGL scene: wooden slab (`BoxGeometry`), dark felt base, metallic rim geometry, two directional lights, and a `PlaneGeometry` carrying a locally sourced `CanvasTexture` from the original forty-tile board image.
- The oversized printed center logo is overpainted in the **texture bitmap**, preserving the peripheral tiles, and replaced by a softly shaded inlay. This is a shader-lit mesh plane, not another opaque CSS rectangle. No third-party resources.
- Added `createThreeDice().setBoardArt(dataURL)`; the scene is initialized on room entry **before the first roll**, and `tv.js` forwards the pre-existing checked board image when either artwork or scene is ready. The existing PixiJS+DOM path remains the fallback when WebGL fails.
- The DOM retains server-controlled ownership/built property indicators, speech/screen-reader semantics and controls; presentation logic does not change dice/turns/money.
- Web QA now explicitly waits for `.tv-3d-board-ready` and `canvas.tv-three-dice-canvas[data-table="3d"]` in Chromium *before any roll*, capturing `chromium-tv-3d-table-lobby.png` to prove the tabletop is displayed.
- Implementation commits: `d5fa503d625dcd5b47c9ad1771e1b9eeaaac946a`, `04ce51c84f53757494cbedab66e69476a9011f83`, `f78bbb4ef8f44f39dd2509693a0fe97ec9a5b933`, `e34aece4e6e833c42c6c77dfba1052b35d5135e5`, `a804ac7fba3300b8e701c80fa5f5daa74513fcc8`, `f405c8c01766643c6dddcf257630169aceb862e8`, `bef28ae37a5a1d55d108a3ff3a101d258f1c9900`.
- The latest screenshot QA [41687888956](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41687888956) and isolated Cloudflare staging deployment [41687888906](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41687888906) are not declared successful unless their final result confirms success. The Chromium screenshot must be reviewed to approve visual quality. **This is the initial 3D presentation replacement, not a fully tilted cinematic camera or final physical-TV certification.**

## Visual screenshot audit and geometry fixes — 2026-11-03
- Inspected actual **Chromium QA screenshot** from failed run [41687888956](https://github.com/modynawe-code/yasser-multiplication/actions/runs/41687888956) (not just CI status). It showed true Three-rendered 3D pawn/board at lobby but also a ~25–30px outward pawn offset on start corner, washed-out near-yellow board colors, dark/black margin outside the printed tiles, and a pale featureless inner playing field.
- **Root cause of pawn offset:** `worldPoint()` used perspective world height at camera z=10 while pawns render at z=1; resulting ~11% magnification relative to intended tile coordinates. Fixed calculation using z-distance 9. Changes in commit `3f67451ec6e2eb417cd10d93d3dd2c86edf0c85d`.
- **Color integrity:** board print is now rendered as `MeshBasicMaterial` so it preserves authentic tile colors without the excessive PBR light amplification. The actual wooden slab and gold rims still use `MeshStandardMaterial` and true lights.
- **Center and border:** fill source-image transparency with warm ivory rather than exposing dark slab, and draw a textured deep-green felt center with subtle gold geometry (only inside the interior, preserving property cells).
- **New measurable visual regression gate:** `syncPawns` publishes maximum projected pawn center deviation in pixels (not authentication data) and Playwright asserts at most **4px** in Chromium before start, with real two-player lobby. Commits `3e0b43fc` and `091c2018`.
- Previous QA initially failed an obsolete requirement that the old CSS gradient be present; as the 3D canvas replaces it, that test was updated to require a real WebGL table or retain the CSS fallback `6b858af5`. Screenshot-based checks on the updated geometry/color remain pending final run conclusion.
- **Do not claim visual approval or live staging publication until the corrected screenshots and staging job succeed.**
