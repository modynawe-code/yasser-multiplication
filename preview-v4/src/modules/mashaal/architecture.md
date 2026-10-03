# Mashaal architecture

Primary discipline: software architecture / early-learning product engineering.

Boundaries:
- shared/learners: identity and family composition
- shared/curricula: curriculum registration
- shared/activities: reusable interaction primitives
- shared/progress: generic developmental evidence semantics
- modules/mashaal/curriculum: KG3 curriculum metadata
- modules/mashaal/domain: Mashaal KG3 progress state
- modules/mashaal/application: adaptive/session/progress composition
- modules/mashaal/infrastructure: learner-scoped persistence
- modules/mashaal/ui: audio-first touch UI contracts

The existing Yasser and Khaled modules remain untouched until shared migration paths are validated by regression tests.
