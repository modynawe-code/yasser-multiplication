# Games Platform V1 decisions

## Product goals

The app must support many games without coupling them to Yasser or Khaled learning controllers.

Supported directions:
- solo and multiplayer
- offline and online
- educational, fun, and hybrid games
- competitive and cooperative play
- different learner levels without forcing both children to answer the same curriculum

## Architecture rules

1. Games live under `preview-v4/src/modules/games/`.
2. Game engines are pure state/rules modules and do not access the DOM, learner repositories, or network directly.
3. Learner-specific questions are accessed only through `games/core/learning-adapter.js`.
4. Online room/network services will be shared by all games; individual games must not create their own backend protocol.
5. Game progress and academic mastery remain separate. Only verified learning attempts may flow back to the learner progress model.
6. Game discovery is registry-driven so adding a new game does not require hardcoding the games home screen.
7. Heavy game assets must be loaded on demand.

## First architecture-driving games

- XO: turn-based + adaptive learning gate.
- Rock Paper Scissors: simultaneous + fun-first.
- Number Race: realtime + educational progression.

These three cover the main synchronization patterns before the catalog grows.

## Mobile sound decision

Android APK builds must use the native Capacitor Text-to-Speech path first, with browser SpeechSynthesis as the web fallback. Do not regress the APK to Web Speech only.

## App icon decision

Selected direction: the first generated icon concept showing both Yasser and Khaled prominently with the calculator mascot, split orange/blue identity, no text. The master artwork must be kept high resolution and later wired into Android adaptive launcher icons and web/PWA icons without modifying the approved character source PNGs.
