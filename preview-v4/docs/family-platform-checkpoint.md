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

## Mashaal KG3 contract

Mashaal is a Saudi KG3 developmental track, not a copy of Yasser/Khaled.

- Six official Saudi KG domains remain the curriculum structure.
- Child UI is voice-first/image-first/play-oriented.
- Parent reporting uses developmental states, not school-style percentages.
- Quran recitation remains closed until approved human recitation media exists; TTS is not recitation audio.
- Specific content/outcomes stay source-bound to verified curriculum references.

## Compatibility contracts that must remain green

- Yasser multiplication behavior/progress/assets remain intact.
- Khaled Grade 1 behavior/progress/assets remain intact.
- Games/rewards/challenges remain composed with learner runtimes.
- Learner data stays isolated.
- Local backup and legacy restore stay functional.
- Cloud sync stays authenticated, learner-scoped, idempotent, and append-only.
- PWA/offline shell includes all required capability modules.
- Backend D1 immutability protections stay intact.

## Gate rule

Do not move to the next architectural layer until:

1. the current change is committed on the integration branch;
2. its CI is green;
3. this checkpoint/PR records the adopted contract;
4. no production merge or D1 migration is performed without Mohammed's explicit approval.

## Current verified gate

Latest integration head before this checkpoint: `32e2902099266b2b68019a38ba78cd375bc92843`.

`Preview V4 CI` run #1401 completed successfully for that head.

The family sync generalization is therefore accepted on the integration branch as the current source for PR #29. The next work must build on these registries/capabilities rather than reintroducing fixed learner-name branches.
