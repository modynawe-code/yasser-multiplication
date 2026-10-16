# Family UI Redesign Specification v1

Status: design specification only. No production migration, merge, or deployment is authorized by this document.

## 1. Goal

Redesign the family learning presentation layer without weakening the existing open-family architecture. The redesign must keep one shared family platform while giving each learner an age-appropriate experience.

Target learner bands:
- Yasser: Grade 6 / older child — focused, energetic, compact, progress-aware.
- Khaled: Grade 1 / early reader — concrete, visual, playful, low-text.
- Mashaal: KG3 / pre-reader — image-first, voice-first, character-led, play-first.

The family shell, navigation primitives, safe-area handling, accessibility rules, storage contracts, registries, and backend contracts remain shared.

## 2. Non-negotiable constraints

1. Do not hardcode future learners into the family shell.
2. Do not create one-off CSS patches for Yasser, Khaled, or Mashaal when a shared primitive can solve the problem.
3. Do not expose parent analytics as the primary child home experience.
4. Do not use percentage mastery as a primary progress model for Khaled or Mashaal.
5. Do not use synthetic TTS for Quran recitation.
6. Quran recitation must be human, locally packaged for offline use when approved, and source-pinned.
7. Android system bars/taskbar must never cover primary controls.
8. Portrait and landscape are separate compositions, not simple scaled copies.
9. Rotation must preserve the active learner, route, activity, answer state, and media state where applicable.
10. Production D1 remains untouched until the controlled rollout gate is explicitly approved.

## 3. Root design problem

The current platform architecture is strong, but the presentation layer still treats learners mainly as generic cards and dashboards. This creates three problems:

- Family Hub uses oversized content cards for a simple launch task.
- Child homes mix child actions with adult analytics.
- Mashaal inherits a generic symbol fallback (`أ ١`) instead of a true visual identity.

The redesign therefore changes presentation composition and presentation contracts, not curriculum ownership or learner runtime architecture.

## 4. Family Hub

### 4.1 Purpose

One task only: choose who is learning now.

### 4.2 Content hierarchy

1. Parent access control: small separate button, visually adult-oriented.
2. Page title: `مين بيتعلم اليوم؟`
3. Learner launch cards.
4. Games entry as a separate shared family action.

Remove from launch cards:
- long curriculum summaries;
- long lists such as `أعداد • عمليات • قياس • أشكال • نقود`;
- parent analytics;
- secondary explanatory copy.

### 4.3 Learner launch card contract

Each card must support:
- learner id;
- display name;
- stage label;
- avatar/character asset;
- theme id;
- optional short resume label such as `نكمل من آخر مرة`;
- accessible label;
- generic fallback only when no visual asset exists.

Proposed learner presentation shape:

```js
presentation: Object.freeze({
  subtitle: '...',
  summary: '...',
  symbol: '...',
  avatar: 'assets/...',
  avatarAlt: '',
  stageLabel: '...',
  homeVariant: 'older-child | early-reader | preschool'
})
```

`avatar` is optional so future learners remain addable without shell edits. Generic fallback remains a resilience path, not the preferred final visual.

### 4.4 Portrait composition

On the target Galaxy Tab, all three learner choices should be visible in the first viewport whenever practical.

Preferred composition:
- compact title zone;
- three equal launch cards in one row when width permits;
- otherwise a 2+1 balanced grid, not one oversized card per row;
- no mandatory vertical scroll solely to reach Mashaal;
- parent button separated from child cards.

### 4.5 Landscape composition

- three launch cards in one row;
- centered max-width container;
- larger character art than portrait;
- do not stretch cards edge-to-edge;
- games entry remains visible without overlapping system UI.

### 4.6 Family Hub acceptance criteria

PASS only if:
- Yasser, Khaled, and Mashaal are reachable in one tap;
- no child is visually demoted because they use the generic registry path;
- no primary launch control is hidden by Samsung taskbar/system bars;
- portrait and landscape both preserve clear hierarchy;
- adding a fourth learner does not require editing Yasser/Khaled/Mashaal-specific feature files.

## 5. Yasser Home — Grade 6

### 5.1 Design intent

Focused, energetic, mature enough for an older primary-school learner. It may show more progress information than younger learners, but it must not look like the parent dashboard.

### 5.2 Primary hierarchy

1. Back/switch learner.
2. Yasser identity + character.
3. Today focus.
4. Primary CTA: `ابدأ تدريب اليوم`.
5. Secondary CTA: quick/intensive test.
6. Compact learner-facing progress.
7. Table selector.
8. Learning/review/challenges entry points.

### 5.3 Keep on child home

Allowed compact indicators:
- today activity count;
- streak;
- learner-facing mastery status;
- current selected tables;
- weak facts in simple form.

### 5.4 Move to parent report

Do not make these dominant on Yasser Home:
- historical error totals;
- full table analytics;
- long session history;
- parent interpretation copy;
- backup/export controls.

### 5.5 Yasser progress language

Percentages may be used selectively because Yasser is an older learner, but the primary CTA must remain action-oriented, not metric-oriented.

### 5.6 Acceptance criteria

- Primary next action is obvious within 2 seconds.
- Parent analytics do not compete visually with training.
- Character supports the experience without making the UI look preschool-oriented.
- Table choice is directly reachable.
- Landscape uses available width without creating sparse empty columns.

## 6. Khaled Home — Grade 1

### 6.1 Design intent

Concrete, image-led, playful, easy for an early reader.

### 6.2 Primary hierarchy

1. Back/switch learner.
2. Audio instruction button.
3. Khaled character hero.
4. Resume/start CTA: `يلا نبدأ`.
5. Visual skill worlds.
6. Simple achievement/reward state.
7. Games/challenges entry.

### 6.3 Remove from primary child presentation

- `الإتقان العام 73%` style labels;
- dense numerical analytics;
- long skill descriptions;
- parent-facing terminology.

### 6.4 Replace percentage mastery with child-readable states

Examples:
- `ابدأ`
- `نتدرب`
- `أحسنت`
- stars/checks only when their meaning is consistent.

Exact percentages remain available in the parent report.

### 6.5 Skill card design

Each skill card should prioritize:
- recognizable visual/illustration;
- very short Arabic title;
- optional audio prompt;
- simple state badge;
- minimum large touch target.

### 6.6 Acceptance criteria

- A child who reads slowly can identify the main choices visually.
- No percentage is required to understand progress.
- Audio guidance is reachable without entering a nested menu.
- The screen remains usable with system taskbar visible.

## 7. Mashaal Home — KG3

### 7.1 Design intent

Image-first, voice-first, character-led, low reading dependency.

### 7.2 Primary hierarchy

1. Switch learner/back.
2. `اسمعي` control.
3. Mashaal character hero.
4. Friendly start/resume CTA.
5. Six official Saudi KG3 domains represented as visual worlds.

### 7.3 Domain world presentation

Keep the six curriculum domains exactly as curriculum ownership defines them. Change only presentation.

Each world should contain:
- one clear illustration representing the domain;
- short title;
- distinct but coherent accent;
- large tap target;
- optional spoken label.

Do not rely on abstract text glyphs such as `أ`, `123`, or a generic sparkle as the final visual representation.

### 7.4 Mashaal identity

The final product should use a real Mashaal presentation asset or an explicitly approved non-likeness character. Until an approved asset exists, the generic fallback remains functional but is not considered visually complete.

### 7.5 Acceptance criteria

- A pre-reader can navigate by image and voice.
- All six worlds remain visible and recognizable.
- Text is secondary to imagery.
- Primary touch targets remain comfortably larger than standard minimums.
- No adult analytics appear on the child screen.

## 8. Quran Surah Player

This is a reusable Quran component, not an Al-Ikhlas-specific screen.

### 8.1 Data-driven surah record

Each approved surah record should provide at minimum:
- surah number;
- Arabic name;
- image/page asset reference;
- recitation asset reference;
- reciter;
- riwayah;
- source authority;
- file size/hash provenance when required;
- offline availability state.

### 8.2 Required controls

- Play.
- Pause.
- Restart from beginning.
- Visible playback state.
- Optional progress indication that does not distract from the Quran image.

### 8.3 Quran image requirement

The displayed Quran image must be from an approved, verified source and must preserve the exact Arabic text. It must not be synthesized or redrawn by generative AI.

### 8.4 Audio rules

- Human Quran recitation only.
- Synthetic TTS must never be used as Quran recitation fallback.
- Current Al-Ikhlas approved local asset remains valid.
- Offline playback must be verified on actual Galaxy Tab.

### 8.5 Reuse rule

Adding another surah should be primarily a data/media addition, not a new bespoke UI implementation.

## 9. Parent Report

### 9.1 Audience

Adult only. It may be denser than child screens.

### 9.2 Family overview

Show per-learner summaries using each learner's correct assessment model:
- Yasser: accuracy/mastery/session data as appropriate.
- Khaled: learning/mastery data suitable for Grade 1.
- Mashaal: developmental states, not school-like success percentages.

### 9.3 Mashaal wording

Avoid unexplained standalone numbers such as `التقدم العام 9`.

Use semantically explicit wording such as:
- `9 مهارات بدأت فيها`;
- `6 مهارات تتطور`;
- `10 لم تبدأ بعد`;

Only use wording that exactly matches the underlying data meaning.

### 9.4 Readability

Landscape should use the available space to improve text size and information grouping, not simply shrink everything to fit.

## 10. Games and Safe Area

Actual Galaxy Tab evidence showed a primary game control entering the Samsung taskbar area. This is a release bug.

### 10.1 Root-level fix required

Do not patch individual buttons.

Introduce shared layout tokens/utilities that account for:
- `env(safe-area-inset-top)`;
- `env(safe-area-inset-right)`;
- `env(safe-area-inset-bottom)`;
- `env(safe-area-inset-left)`;
- Android taskbar/navigation bar behavior;
- dynamic viewport units.

### 10.2 Shared bottom safety rule

Primary fixed/sticky/bottom actions must include a shared bottom system inset plus application spacing.

### 10.3 Acceptance criteria

- No actionable control can be visually or physically covered by the Samsung taskbar.
- Same rule works in portrait and landscape.
- Games do not each define their own arbitrary bottom padding.

## 11. Shared Design System

Create a family design layer with shared primitives rather than scattered learner-specific overrides.

Required token groups:
- color roles;
- surfaces;
- text hierarchy;
- spacing scale;
- radii;
- elevation;
- touch sizes;
- content max-widths;
- system safe-area insets;
- portrait/landscape breakpoints;
- motion duration/easing;
- reduced-motion behavior.

Required shared components/primitives:
- FamilyPageHeader;
- LearnerLaunchCard;
- LearnerHero;
- PrimaryAction;
- SecondaryAction;
- ChildProgressState;
- VisualWorldCard;
- ParentMetricCard;
- SafeBottomActions;
- QuranSurahPlayer.

Implementation may remain framework-free DOM/CSS modules, but contracts should be reusable.

## 12. Adaptive layout policy

### Portrait

- prioritize vertical scanning;
- keep primary actions above the fold when practical;
- avoid one enormous learner card per viewport;
- use balanced two-column grids where touch size remains strong.

### Landscape

- use wider compositions;
- preserve max content width;
- use two-pane/hero+content arrangements when they reduce scrolling;
- never stretch typography or cards merely to fill width.

### Rotation

Rotation is a state-preservation event, not a navigation event.

The following must remain stable where applicable:
- active learner;
- active route/view;
- selected skill/table;
- current question;
- selected answer before submission;
- session progress;
- Quran playback position/state unless Android media interruption semantics require pause.

## 13. Implementation order

1. Shared design tokens + safe-area primitives.
2. Extend learner presentation contract to support visual assets without hardcoding learners.
3. Family Hub redesign.
4. Yasser Home redesign.
5. Khaled Home redesign.
6. Mashaal Home redesign.
7. QuranSurahPlayer generalized implementation starting with Al-Ikhlas.
8. Parent report readability/semantic wording.
9. Games shared safe-area repair.
10. Portrait/landscape/rotation/offline QA.

## 14. Change safety

Before each implementation slice:
- preserve existing business logic and storage contracts;
- add or update tests for the specific contract being changed;
- avoid unrelated refactors;
- run Preview V4 tests;
- keep PR #29 Draft;
- do not touch production D1.

## 15. Release evidence required after redesign

Actual Galaxy Tab evidence must cover:
- Family Hub portrait/landscape;
- Yasser Home portrait/landscape;
- Khaled Home portrait/landscape;
- Mashaal Home portrait/landscape;
- activity rotation state retention;
- games safe-area;
- Mashaal Quran screen;
- Al-Ikhlas play/pause/restart;
- Al-Ikhlas offline playback;
- Mashaal parent report;
- no clipped controls or horizontal overflow.

Only after those checks pass may the real-device visual QA gate be recorded as PASS. Production D1 remains a separate explicit gate.
