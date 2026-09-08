# Mashaal KG3 — current state

Technical integration and KG3 content verification are complete on `feature/family-games-mashaal-integration-v1` / Draft PR #29.

Mashaal is wired into the open Family Hub, games-capable family platform, developmental parent report, generic learner backend contracts, capability-driven authenticated cloud sync, exact cloud session restore, family backup, and offline PWA shell. Cloud session IDs are deterministic, exact stage-specific session records are preserved when available, duplicate restoration is rejected, and D1 session history is append-only alongside attempts and developmental evidence.

The learner/parent layouts are open-ended. Mashaal has tablet-oriented accessible UX and 25 source-bound KG3 skills across the six Saudi KG domains. Twenty-four activities are playable now.

The remaining curriculum media skill is Quran listening/repetition. It is intentionally limited to Surat Al-Ikhlas (112), using human recitation only from the approved King Fahd Glorious Quran Printing Complex source (Ibrahim Al-Akhdar, Hafs from Asim). The single local audio asset and its SHA-256 are still pending; synthetic Quran recitation remains forbidden.

Production readiness remains intentionally blocked by exactly three operational gates:
- local approved Al-Ikhlas audio asset + SHA-256;
- manual Galaxy Tab visual QA in landscape and portrait;
- controlled application of the reviewed D1 migrations.

No production D1 migration has been applied and PR #29 remains Draft/unmerged.
