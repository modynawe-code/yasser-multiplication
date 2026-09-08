# Mashaal KG3 — draft release notes

Mashaal KG3 is technically integrated on the family-platform feature branch. The open learner architecture, Family Hub, games integration, developmental parent report, generic backend contracts, exact append-only cloud session restore, authenticated cloud sync, local/legacy backup support, offline PWA shell, source-bound KG3 curriculum content, and tablet-oriented accessible UX are implemented and regression-tested.

Curriculum/content state:
- 25 KG3 skills are source-bound across the six Saudi KG domains.
- All 25 skills now have playable/available content.
- Quran listening/repetition is intentionally limited to Surat Al-Ikhlas (112).
- The approved source is King Fahd Glorious Quran Printing Complex, Ibrahim Al-Akhdar, Hafs from Asim.
- The verified local asset is `assets/recitation/ibrahim-al-akhdar-hafs-112-al-ikhlas.mp3`, size 238696 bytes, SHA-256 `102112a78148e14a568679599d856b06ce830ac63e6e59fa2d6a5a423d8c9bd1`.
- Quran recitation never falls back to synthetic speech.

The Al-Ikhlas media blocker is closed. This is not yet production-ready. Remaining release blockers are deliberately explicit:
1. complete manual visual QA on the actual target Galaxy Tab in landscape and portrait and record PASS evidence;
2. apply the reviewed D1 migrations only during the controlled production rollout.

PR #29 stays Draft until these blockers are cleared and Mohammed explicitly approves merge/deployment. No production merge or D1 migration is implied by technical CI success.
