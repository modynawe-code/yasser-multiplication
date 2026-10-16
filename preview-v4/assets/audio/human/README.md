# Human voice assets

This directory is the source of truth for recorded human narration used by dynamic learning content.

## Rules

- Child-facing release audio must be recorded by a real human speaker.
- Do not place neural/TTS-generated files in this directory.
- Keep one complete spoken prompt per file whenever practical; do not assemble ordinary questions from synthetic speech.
- Dynamic files use the deterministic filename emitted by `npm run voice:inventory`.
- Fixed game lines may keep semantic filenames declared in `src/shared/audio/voice-manifest.js` (for example the RPS clips under `assets/audio/rps/`).
- Missing recordings are reported by `npm run voice:check`.
- `npm run voice:release-check` is the strict human-only release gate and must fail while any required recording is missing.

## Recommended recording delivery

- Record clean, dry speech with no background music.
- Keep a short natural lead-in and tail so words are not clipped.
- Deliver lossless WAV masters when possible; keep masters outside generated/compressed derivatives.
- Runtime MP3 files should use the exact path emitted by the recording inventory.

Generated inventories are written to `build/voice/` and are not runtime source files.
