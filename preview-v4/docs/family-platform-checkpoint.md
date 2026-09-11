# Family Learning Platform — Architecture Checkpoint

Status: adopted on `feature/family-games-mashaal-integration-v1` (PR #29). This document is the durable checkpoint for the family-platform generalization work. Do not replace these contracts with learner-name branching.

## Adopted invariant

Adding a new learner must not require editing Yasser, Khaled, or Mashaal feature files. A learner is composed through registries/capabilities and linked curricula/modules.

## Current family model

- Learner Registry: open-ended learner profiles; current learners are Yasser, Khaled, Mashaal.
- Learner Runtime Registry: activation/leave is learner-neutral.
- Curriculum Registry: curricula are linked to learners instead of encoded into family shell logic.
- Reward Capability Registry: academic reward presentation is capability-driven. Developmental learners are not forced into academic percentages/rewards.
- Parent Report Capability Registry: parent tabs, summaries, sessions, export, and learner reports are composed from registered capabilities.
- Family Sync Capability Registry: upload/restore behavior is registered per learner; the shared sync service must not branch on learner names.
- Family backup: `FamilyLearning` namespace is open-ended. Legacy `YasserKhaledLearning` backup remains restorable.
- Historical learning records remain append-only/idempotent; child-facing flows do not delete history.
- Cloud sessions use deterministic IDs independent of array position, preserve the exact curriculum-specific session record, restore through learner capabilities, and de-duplicate against baseline/local sessions.
- D1 learning sessions are append-only through migration `0005_learning_session_payload.sql`; legacy session uploads without `session_json` remain accepted for compatibility.

## Mashaal KG3 contract

Mashaal is a Saudi KG3 developmental track, not a copy of Yasser/Khaled.

- Six official Saudi KG domains remain the curriculum structure.
- Child UI is voice-first/image-first/play-oriented.
- Parent reporting uses developmental states, not school-style percentages.
- Specific content/outcomes stay source-bound to verified curriculum references.
- Quran recitation is human-only; TTS is not recitation audio.
- The approved recitation source is King Fahd Glorious Quran Printing Complex, Ibrahim Al-Akhdar, Hafs from Asim, limited to Surat Al-Ikhlas (112).
- The verified local recitation asset is `assets/recitation/ibrahim-al-akhdar-hafs-112-al-ikhlas.mp3`, size `238696` bytes, SHA-256 `102112a78148e14a568679599d856b06ce830ac63e6e59fa2d6a5a423d8c9bd1`.
- Source provenance remains the official KFGQPC `akhdar-sura.zip`; transport provenance is recorded in `recitation-media-data.js` against the pinned quran-ws KFGQPC extracted mirror metadata.
- Mashaal content readiness is now 25/25 skills.
- `GALAXY_TAB_VISUAL_QA.md` plus the tablet QA contract test define the required landscape/portrait device matrix. Automated QA preparation is tracked separately from the real-device result: `visualQaContractReady:true` does not satisfy the manual device pass.

## Compatibility contracts that must remain green

- Yasser multiplication behavior/progress/assets remain intact.
- Khaled Grade 1 behavior/progress/assets remain intact.
- Games/rewards/challenges remain composed with learner runtimes.
- Learner data stays isolated.
- Local backup and legacy restore stay functional.
- Cloud sync stays authenticated, learner-scoped, idempotent, append-only, and restores attempts, evidence, and exact session history.
- PWA/offline shell includes all required capability and session-sync modules.
- Backend D1 immutability protections stay intact.

## Production readiness contract

Technical integration success is not the same as production readiness. The Al-Ikhlas media blocker is closed. Mashaal release readiness must remain false until both remaining operational blockers are cleared:

1. manual Galaxy Tab visual QA passes on the actual target device in landscape and portrait and PASS evidence is recorded;
2. reviewed D1 migrations are applied during the controlled production rollout with the required backup/bookmark/row-count/trigger evidence.

`release-gate.js`, `release-status.js`, and the release-evidence validator encode these blockers and must not silently weaken them.

## Gate rule

Do not move to the next architectural layer until:

1. the current change is committed on the integration branch;
2. its CI is green;
3. this checkpoint/PR records the adopted contract;
4. no production merge or D1 migration is performed without Mohammed's explicit approval.

## Current verified gate

Latest verified implementation head: `dfb0c02a5ec78dab13a14889cbee46359227fc2d`.

`Preview V4 CI` run #1530 completed successfully for that head. Learning-app tests, recitation runtime/media contracts, human-voice inventory, and family-backend tests are green with the committed Al-Ikhlas asset present.

Current Mashaal content state: 25/25 skills ready. The audio blocker is closed. Production remains blocked only by real Galaxy Tab visual QA and the controlled production D1 rollout.

The integration branch is the current source for PR #29. Future work must build on these registries/capabilities, exact cloud session restore, human-only Quran media, explicit evidence-backed release blockers, and separate visual-QA preparation/manual-evidence gates rather than reintroducing fixed learner-name branches or claiming readiness prematurely.
