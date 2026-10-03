# V4.2 Scene State Machine

Visuals are driven by semantic scene states, not by direct image paths in feature code.

## Rules
- Every scene has an explicit default state.
- Temporary feedback states always return to a defined fallback state.
- Parent reporting stays character-free.
- Exam mode stays visually quiet: no character animation or coaching feedback.
- UI logic raises semantic events only; `scene-controller.js` decides which asset variant to show.

## Semantic states
- `home`: Yasser welcome + assistant idle.
- `learn`: Yasser thinking + assistant thinking.
- `question`: Yasser hidden + assistant thinking.
- `correct`: Yasser encourage + assistant celebrate, then return to `question`.
- `wrong`: Yasser thinking + assistant thinking, then return to `question`.
- `result-good`: Yasser mastered + assistant idle.
- `result-excellent`: Yasser celebrate + assistant celebrate.
- `parent`: both hidden.

Asset variants are replaceable independently from these semantic states, so new art can be introduced without changing training logic.
