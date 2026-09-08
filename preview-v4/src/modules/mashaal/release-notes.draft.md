# Mashaal KG3 — draft release notes

Mashaal KG3 is technically integrated on the family-platform feature branch. The open learner architecture, Family Hub, games integration, developmental parent report, generic backend contracts, exact append-only cloud session restore, authenticated cloud sync, local/legacy backup support, offline PWA shell, source-bound KG3 curriculum content, and tablet-oriented accessible UX are implemented and regression-tested.

Curriculum/content state:
- 25 KG3 skills are source-bound across the six Saudi KG domains.
- 24 activities are playable now.
- Quran listening/repetition is intentionally limited to Surat Al-Ikhlas (112).
- The approved source is King Fahd Glorious Quran Printing Complex, Ibrahim Al-Akhdar, Hafs from Asim.
- Quran recitation never falls back to synthetic speech.

This is not yet production-ready. Remaining release blockers are deliberately explicit:
1. import the single local Al-Ikhlas human-recitation asset and record its SHA-256;
2. complete manual visual QA on the target Galaxy Tab landscape and portrait viewports;
3. apply the reviewed D1 migrations only during the controlled production rollout.

PR #29 stays Draft until these blockers are cleared. No production merge or D1 migration is implied by technical CI success.
