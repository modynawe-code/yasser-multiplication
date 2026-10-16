# PS1 browser integration spike

## Current state

- PS1 is a separate, lazy-loaded game entry in the shared catalog; Mario remains NES-only.
- `ps1-controller.js` loads EmulatorJS 4.2.3 with its PS1 core. The loader is fetched from the pinned official CDN on demand.
- The game and BIOS are selected as local files in the browser. The app does not bundle them or upload them to the GitHub repository.
- The dedicated PS1 screen has a 4:3 player area, native fullscreen when available, and a CSS immersive fallback.
- The EmulatorJS controller and touch controls are used for input. The separate standard Gamepad profile in this spike is test groundwork, not connected to the emulator runtime.

## Hosting and release gates

- A normal GitHub repository file is blocked above 100 MiB. Git LFS is not served by GitHub Pages, so a large PS1 disc image should not be added to the Pages source as an LFS file.
- GitHub Pages can publish a site up to 1 GB, but that is a site limit, not a recommendation to bundle large game images.
- Do not publish a commercial game image or console BIOS without confirmed redistribution rights. Age or online availability does not by itself establish permission.
- The catalog entry is enabled as a test launcher. Before calling it ready, verify legal test content, BIOS loading, touch/gamepad input, load/save persistence, and memory/performance on target devices.

## Spike status

The launch path, file selection, pinned emulator configuration, fullscreen shell, and catalog integration are implemented and statically tested. Actual BIOS/game boot, emulator exit behavior, touch/gamepad input, and real-device fullscreen/performance remain unverified until tested with PS1 files on the target devices.
