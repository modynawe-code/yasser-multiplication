# أشكال الحروف وكتابتها

Entry: خالد ← لغتي ← أشكال الحروف وكتابتها. Work branch: feature/product-ui-reference-v1.

User reference: supplied 222.53-second video demonstrating ص, connection hands and writing boards.
Scope: all 28 Arabic letters; contextual forms and joining; ordered writing demonstration; finger/stylus tracing; independent writing and local Khaled-only progress. Existing videos remain available.

## Content and assets

- `letter-data.js`: curated example words, joining rules and form selection. Position is descriptive; actual neighbours determine connections.
- `writing-paths.js`: original monoline SVG teaching paths, baseline y=210; dots are separate pen lifts. These are instructional diagrams, not generated letter bitmaps. No external font dependency for tracing.
- Original Khaled character reused. No other child's identity is introduced.
- `connection-hands.png`: original image generated with built-in ImageGen. Transparent two-column sheet, open hand then fist. CSS selects a column and mirrors the opposite side. Meaning is explicitly labelled: open = joined in this form, fist = disconnected.
- Generation prompt: “Create one professional children's educational asset sprite sheet, transparent background. Two columns, one row, ample transparent gutter. LEFT: a single isolated friendly cartoon right hand with all five fingers extended, palm facing viewer, short horizontal wrist coming from right, fingers fanning toward left, warm tan skin, subtle polished 3D storybook rendering, no sleeve. RIGHT: the SAME right hand in a closed fist pose, same warm tan skin, wrist coming from right, knuckles pointing left. Consistent scale, softly rounded, anatomically correct. These will be cropped individually for an Arabic letter joining lesson. No letters, no text, no symbols, no labels, no other objects. 1536x1024 landscape composition.”
- Store reference: https://7orroof.com/تأسيس-الحروف-العربية/p503514556 . No purchased graphics copied. Exact identity with the video's product has not been established.
- Joining reference: Open University, Introduction to Arabic, Week 2 / Joining letters: https://www.open.edu/openlearn/mod/oucontent/view.php?id=144237&section=3 .

## Evaluation and persistence

- Ordered sampled checkpoints prevent end-point taps or scribbles from completing a letter. Guided completion is labelled “أكمل التتبع”, never handwriting mastery.
- Independent writing is ungraded and can be compared against the model.
- Progress, lesson position and bounded vector drafts use `family.khaled.letter-forms.v1` on this device. No claim of cloud sync.
- Storage failure is visible. No destructive reset or migration of existing learning data.
- New dependencies included in app-shell cache; cache revision incremented.

## Review limits

Original writing paths require pedagogical review of pen ductus before claiming certified handwriting instruction. Browser touch emulation is not a physical Galaxy Tab/iPad test. No automated assessment of free handwriting, phonics module, or new synthetic speech is included.

## Validation executed

- 832 Node tests passed, including joining edge cases, all 28 letters and paths, checkpoint anti-skipping, storage recovery and video regressions.
- Chromium browser QA: 390×844, 800×1280 and 1280×800. Real pointer tracing, correct/assisted answer records, preserved SVG text shaping, reopening and restoring the active writing form/drawing, returning to all 8 existing videos. No page errors or horizontal overflow.
- All letter path shapes rendered as four overview sheets and inspected. Mobile and tablet screenshots inspected; corrected sprite-cell bleed, mobile header wrapping and letterboxed SVG coordinate mapping.
- `node tools/build-web-preview.mjs` passed.

## Rollback

Revert the feature commit on the same branch. Existing video assets and other learning modules were not replaced; feature storage is isolated.
