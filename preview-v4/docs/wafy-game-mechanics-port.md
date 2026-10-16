# Wafy games: source-derived port plan

This note records behavior confirmed in the decompiled Wafy screens and game engines. It is the acceptance checklist for the separate game section. Keep all game state local to a game session; do not write learner progress, attendance, or scores into child records.

## Games visible in the Wafy services screen

| Game | Wafy flow to preserve |
| --- | --- |
| Random student (النرد) | Draw one or more entries from the roster. A no-repeat run draws without replacement; when the remaining pool is too small, Wafy starts another run from the roster. The selected learner receives a question and the teacher judges the answer. |
| Lucky wheel (عجلة الحظ) | Spin against the current roster or group names. Wafy supports choosing learners or groups and tracks exclusions/no-repeat within the play session. Selection leads to the same question and answer-judgment flow. The independent section has its own local group-name list and does not load child or class records. |
| Complete the square (أكمل المربع) | 3×3 board, two teams, 9 squares, first team to 5 wins. A selected free edge leads to a bank question. Correct draws the edge for the current team and may close a square; closing a square can retain the turn. Wrong/no answer leaves the edge free and passes the turn. Wafy also caps a capture streak; preserve the engine's source constant when wiring this rule. |
| Letters challenge (تحدي الحروف) | Random 5×5 hex letter board. Correct answers claim a cell; wrong or no answer leaves it free. Teams win by forming the engine-defined connected path across their opposing sides. |
| Treasure map (خريطة الكنز) | 6–10 map stops, default 8. Correct advances and clears the current stop; wrong/no answer leaves the stop uncleared and sends the same question to another learner. The run ends after all stops are cleared. Wafy supports random or controlled question/player selection. |

## Shared interaction flow

The decompiled Wafy question store reads configured questions, keeps entries with a string `id`, `text`, and `createdAt`, and sorts them oldest first by `createdAt`. Each game run takes the first question whose ID has not been asked in that run. If no question remains, `nextQuestion` returns `null`; it does not reset the asked-ID set or begin another cycle. After a response, the judge records `correct`, `wrong`, or `none` into the game engine. The “play only” option disables score linkage; it does not replace the game rules. The independent section must keep the same question-and-judgment sequence while keeping its state out of learner records.

## Port progress

- The independent section stores participant names, wheel group names, and its question bank locally under separate game-only keys. None are linked to learner records. Curriculum questions display and run grouped by semester first, then grade, then subject; source order is retained within each subject, and a subject's group position follows its first appearance in that grade/semester's imported batch. Unscoped manual questions remain together after curriculum groups. Games consume the first unasked question in that ordered bank; when all configured questions have been asked in a run, no question is returned. Starting a new game screen clears that run's asked IDs, matching Wafy's per-run behavior.
- Dice selections now receive a question and teacher judgment one participant at a time, including multi-name draws. The existing participant cycle is without replacement and restarts when too few names remain.
- The wheel uses the same draw/question/teacher-judgment path for one selected participant or group, with the same no-repeat pool cycle.
- The square engine now uses the source constants, opening seed rules, `started` and selected-edge states, alternating participant rosters, per-team cursor, `correct`/`wrong`/`none` verdicts, box ownership, capture streak cap, majority, and full-board winner. Its question is taken from the independent bank.
- Original game tile and map assets are extracted from the provided APK and cached for offline use.
- Letters challenge uses Wafy's 5×5 shuffled letter board, odd-row hex neighbors, cell claims, and orange/green connected path test.
- Treasure map uses Wafy's configured stop count, random or controlled participant selection, question IDs, cleared stops, and the same question moving to another participant on a wrong or unanswered judgment.

The APK contains a Hermes bytecode bundle, not the original React Native source. The local APK also does not contain Wafy's configured class question data: the questions screen loads that data from its user question store and supports adding manual questions. The port uses that manual question route while keeping the game flow independent of child profiles. Group names are entered into the isolated local setup because the separate section has no Wafy class records to read.

## Decompiled source checkpoints

- Wafy Hermes bundle module 1533: `_loadGameQuestions` reads `game_questions.items`, filters valid entries, and sorts by ascending `createdAt`; module 1534 `nextQuestion` uses `find` for the first question whose ID is not in the run's `Set` and returns `null` when none is available.
- `RandomStudentScreen` and `LuckyWheelScreen`: `roll`/`spin`, no-repeat selection, and `judge` handlers.
- `BoxesGameScreen`: board setup, team roster, edge selection, question opening, and `judge` handler. Engine exports `newGame`, `start`, `pick`, `verdict`, `score`, `decided`, `lead`, and `winner`.
- `LettersChallengeScreen`: board setup, target selection, question and judge flow. Engine exports `newBoard`, `claim`, and `winningPath`.
- `TreasureMapScreen`: stop setup, question/player selection, answer flow, and completion state. Engine exports `stopsFor`, `newGame`, `start`, `setPlayer`, `verdict`, and `restart`.
