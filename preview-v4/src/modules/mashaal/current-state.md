# Mashaal KG3 — current state

Technical integration and KG3 content verification are complete on `feature/family-games-mashaal-integration-v1` / Draft PR #29.

Mashaal is wired into the open Family Hub, games-capable family platform, developmental parent report, generic learner backend contracts, capability-driven authenticated cloud sync, exact cloud session restore, family backup, and offline PWA shell. Cloud session IDs are deterministic, exact stage-specific session records are preserved when available, duplicate restoration is rejected, and D1 session history is append-only alongside attempts and developmental evidence.

The learner/parent layouts are open-ended. Mashaal has tablet-oriented accessible UX and 25 source-bound KG3 skills across the six Saudi KG domains. All 25 skills now have playable/available content.

Quran listening/repetition is limited to Surat Al-Ikhlas (112) and uses human recitation only from the approved King Fahd Glorious Quran Printing Complex source: Ibrahim Al-Akhdar, Hafs from Asim. The verified local asset is `assets/recitation/ibrahim-al-akhdar-hafs-112-al-ikhlas.mp3`, size 238696 bytes, SHA-256 `102112a78148e14a568679599d856b06ce830ac63e6e59fa2d6a5a423d8c9bd1`. Synthetic Quran recitation remains forbidden.

Production readiness is now blocked by exactly two operational gates:
- manual Galaxy Tab visual QA in landscape and portrait with recorded evidence;
- controlled application of the reviewed D1 migrations.

No production D1 migration has been applied and PR #29 remains Draft/unmerged.
