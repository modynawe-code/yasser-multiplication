# V4.2 Visual System

## Purpose
The visual layer is presentation only. Training, mastery, storage, reporting and future backend integrations must not depend on character image files.

## Character roles
- Yasser is the primary learning character.
- Calculator is the secondary helper.
- Student UI state may select an asset; assets never determine application state.
- Exam mode and the parent dashboard stay visually quiet.

## Semantic states
Yasser: `welcome`, `thinking`, `encourage`, `success`, `mastery`.

Assistant: `welcome`, `thinking`, `success`.

## Asset policy
- Transparent WebP for runtime delivery.
- Semantic filenames live under `assets/characters` and `assets/assistant`.
- Replacing artwork must not require changes to domain/application layers.
- Source-generation filenames never appear in UI logic.

## Motion policy
Motion is optional and respects `prefers-reduced-motion`. No continuous distracting animation during an exam.

## Performance
Only assets needed for the active student surface are loaded. Parent reports do not load mascots.
