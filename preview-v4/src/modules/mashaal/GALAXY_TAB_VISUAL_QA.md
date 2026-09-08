# Mashaal KG3 — Galaxy Tab visual QA

Status: required before production readiness can become true.

This checklist is intentionally manual. Automated layout contracts reduce regression risk but do not replace checking the real Samsung Galaxy Tab browser/PWA rendering.

## Target viewports

Run the checklist on the actual target Galaxy Tab in both orientations. Record the browser-reported CSS viewport if it differs from the representative sizes below.

- Landscape reference: approximately 1280 × 800 CSS px.
- Portrait reference: approximately 800 × 1280 CSS px.
- Also rotate once while an activity is open to verify the active learning state remains usable after orientation change.

## Pass criteria for every surface

- No horizontal scrolling.
- No clipped Arabic text, buttons, badges, symbols, or feedback.
- No overlap between navigation, prompt, stimulus, answers, and feedback.
- Primary child controls remain comfortably tappable; no target visually collapses below the intended 52–60 px control baseline.
- Selected choices are identifiable without color alone.
- Disabled/blocked skills remain visibly distinguishable and not tappable.
- Voice/listen buttons are visible and reachable without covering learning content.
- Feedback appears inside the visible activity flow and does not jump behind navigation.
- Arabic direction, alignment, line wrapping, and numerals remain coherent.
- Rotating the device does not require reloading or reset the current activity unexpectedly.
- Browser/PWA safe areas do not hide controls.

## QA matrix

### 1. Family Hub → Mashaal

Landscape and portrait:
- Mashaal learner card is visible and opens the Mashaal module.
- Returning to learner selection works.
- No learner card overlap or fixed three-child assumption is visible.

### 2. Mashaal home — six worlds

Landscape and portrait:
- Exactly six world cards are present.
- Cards are balanced with readable labels and symbols.
- Home listen button remains visible.
- Back-to-hub control remains separate from the child learning cards.
- No world card requires precision tapping.

### 3. Domain screen

Check at least:
- `حروفي وكلامي` (largest language skill set).
- `المسلم الصغير` (contains the blocked recitation path until approved audio is installed).

Landscape and portrait:
- Domain symbol/title/listen button fit without crowding.
- Skill cards wrap cleanly.
- Ready skills are tappable.
- Quran recitation remains visibly locked while approved local media is absent.
- Locked state uses more than reduced opacity alone (lock marker is visible).

### 4. Activity — ordinary single-choice

Open one cognitive/language single-choice activity.

Landscape and portrait:
- Prompt is readable without colliding with stimulus.
- Stimulus remains centered.
- All choices fit the width.
- A selected answer has a clear border/state beyond color.
- Correct/incorrect feedback remains readable.
- Off-screen transfer prompt is visible after completion.

### 5. Activity — ordered or multi-step

Open a sequencing activity.

Landscape and portrait:
- Sequence choices do not overflow.
- Selected order/state remains clear.
- Check/continue action remains reachable.
- Long Arabic labels wrap rather than shrink to illegible text.

### 6. Activity — completion-only

Open an activity such as oral expression, prewriting, gross motor, or fine motor.

Landscape and portrait:
- UI does not imply a fake right/wrong score.
- Completion action is clear.
- Transfer instruction is visible and understandable.

### 7. Orientation change while active

Start an activity in landscape, select an answer/state, then rotate to portrait and back.

Pass only if:
- Current view remains the activity view.
- Selected state remains understandable.
- No duplicated controls appear.
- No content becomes permanently off-screen or horizontally scrollable.

### 8. Parent report — Mashaal

Landscape and portrait:
- Parent area remains visually distinct from child UI.
- Mashaal shows developmental labels (`لم تبدأ / تتطور / متقنة`) without percentage scoring.
- The 25 documented skills / 24 ready activities / recitation blocker remain readable.
- Long skill lists do not break the tab/navigation layout.

### 9. Offline/PWA smoke check

After one successful online load/install:
- Open Mashaal home once.
- Disable network.
- Re-open the installed PWA or refresh the app shell.
- Confirm Mashaal home/domain/non-recitation activities still load.
- Do not mark recitation as passed until the approved local Al-Ikhlas asset is actually installed and precached.

## Evidence to record

For each orientation capture:
- Mashaal home.
- One dense domain screen.
- One single-choice activity.
- One ordered/multi-step activity.
- One completion-only activity.
- Mashaal parent report.

Record:
- Device model.
- Android version.
- Browser/PWA mode and browser version.
- CSS viewport width × height if available.
- Result: PASS / FAIL.
- Any failure with screenshot and exact screen/activity.

## Gate rule

Do not change `visualQaPassed` to true based only on automated tests or desktop emulation. It becomes true only after the actual Galaxy Tab manual matrix above passes in both orientations.
