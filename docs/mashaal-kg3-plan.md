# Mashaal KG3 implementation plan

## Source of truth
Saudi Ministry of Education / National Curriculum Center, Curriculum Guide Fifth Edition (2025): KG3 is level three, ages 5–6, with six learning domains.

## Architecture
- Learner identity is data, not branching logic.
- Curriculum is independently registered and can be shared by multiple learners.
- Activity engines are reusable across curricula.
- Progress is learner-scoped and append-only for historical attempts.
- Parent analytics are separate from child-facing feedback.

## Delivery order
1. Generalize learner persistence/backend constraints.
2. Drive Family Hub and parent navigation from learner registry.
3. Add Mashaal profile and KG3 home shell.
4. Add KG3 curriculum registry and skill map.
5. Add reusable early-learning activity engines.
6. Release language/communication and cognitive foundation activities first.
7. Add social-emotional, health/physical, Quran/Islamic, and national/social modules only with verified content.
8. Add parent observations and off-screen activity evidence.
9. Add Mashaal character assets after the learning shell is structurally stable.
10. Run regression tests for Yasser and Khaled before merge.

## Expansion invariant
Adding a new child must not require editing Yasser, Khaled, or Mashaal feature code. A new child should be registered as a learner profile and linked to one or more registered curricula.
