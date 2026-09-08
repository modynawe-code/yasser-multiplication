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
- Quran recitation remains closed until approved human recitation media exists; TTS is not recitation audio.
- Specific content/outcomes stay source-bound to verified curriculum references.
- 25 skills are verified; 24 activities are playable until the single Al-Ikhlas human-recitation asset is installed.

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

Technical integration success is not the same as production readiness. Mashaal release readiness must remain false until all three operational blockers are cleared:

1. approved local Surat Al-Ikhlas human-recitation asset is present and SHA-256 verified;
2. manual Galaxy Tab visual QA passes in landscape and portrait;
3. reviewed D1 migrations are applied during the controlled production rollout.

`release-gate.js` and `release-status.js` encode these blockers and must not silently weaken them.

## Gate rule

Do not move to the next architectural layer until:

1. the current change is committed on the integration branch;
2. its CI is green;
3. this checkpoint/PR records the adopted contract;
4. no production merge or D1 migration is performed without Mohammed's explicit approval.

## Current verified gate

Latest verified implementation head: `ccf7c45e31b98cd7656370c7ea077be1f500b727`.

`Preview V4 CI` run #1450 completed successfully for that head. The release-readiness tests confirm that technical/content integration is accepted while production readiness remains false for exactly the three blockers above.

The integration branch is the current source for PR #29. Future work must build on these registries/capabilities, exact cloud session restore, and explicit release blockers rather than reintroducing fixed learner-name branches or claiming readiness prematurely.
