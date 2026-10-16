# Rollback

This branch adds new shared registries and a new Mashaal module without rewriting Yasser/Khaled persisted state. Rollback is therefore branch/commit removal before merge. Backend schema changes must be additive migrations only; never edit the applied 0001 migration in production.
