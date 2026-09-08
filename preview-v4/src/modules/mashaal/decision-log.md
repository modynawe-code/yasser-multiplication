# Decision log

## 2026-09-08 — learner and pedagogy
- Treat Mashaal as Saudi KG3 / level three (ages 5–6), not as a copy of Grade 1 or multiplication flows.
- Make family learner capacity open-ended; no fixed numeric child cap.
- Separate learner identity, curriculum, activity engines, progress evidence, reports, sync, and rewards through registries/capabilities.
- Do not clone or modify Khaled/Yasser feature modules when adding another learner.
- Child experience remains voice-first, image-first, play-oriented, large-target, and low-reading.
- Parent assessment remains developmental (`لم تبدأ / تتطور / متقنة`) rather than raw child-facing percentages.

## 2026-09-08 — curriculum/content verification
- Adopt the six official Saudi KG3 domains as the curriculum structure.
- Keep 25 KG3 skills source-bound to verified standards/provenance.
- Release 24 authored non-recitation activities with qualitative developmental evidence and off-screen transfer prompts.
- Do not accelerate Mashaal into Grade 1 content merely to increase activity count.

## 2026-09-08 — Quran recitation
- Quran recitation must never use TTS/synthetic speech.
- Limit the first recitation activity to one surah only: Surat Al-Ikhlas (112).
- Approved source: King Fahd Glorious Quran Printing Complex; Ibrahim Al-Akhdar; Hafs from Asim.
- Keep the activity closed until the single local audio asset exists and passes manifest/SHA-256 integrity validation.

## 2026-09-08 — family-platform integration
- Preserve the complete games/rewards/challenges line while adding Mashaal; do not replace the games platform with a simplified family shell.
- Entertainment games may use all registered learners; educational games expose only learners with a stage-appropriate learning provider.
- Academic rewards are capability-driven. Mashaal remains developmental and is not forced into Yasser/Khaled percentage-based reward rules.
- Parent reports and cloud sync are learner-neutral registries/capabilities rather than learner-name branching.
- Exact cloud session records are restored idempotently and historical attempts/evidence/sessions remain append-only.
- Family backup namespace is `FamilyLearning`, while legacy `YasserKhaledLearning` backups remain restorable.

## 2026-09-08 — release discipline
- Draft PR #29 is the integration line.
- Production readiness is separate from technical CI readiness.
- Remaining production blockers are exactly: approved local Al-Ikhlas audio + SHA-256, manual Galaxy Tab visual QA, and controlled D1 migration rollout.
- No merge to `main`, production D1 migration, or production deployment without Mohammed's explicit approval.
