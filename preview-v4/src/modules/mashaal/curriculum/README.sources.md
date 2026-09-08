# Mashaal KG3 curriculum provenance

## Current structure
The Saudi Ministry of Education Curriculum Guide - Fifth Edition (2025) is the authority for Mashaal's current KG3 structure: age 5-6 and the six learning domains used by the app.

## Developmental indicators
Detailed implementation skills are audited against **Saudi Early Learning Standards: Children 3 to 6 Years Old** (Ministry of Education / Tatweer / NAEYC, 2015). The current Ministry of Education Early Childhood page confirms that developmental early-learning standards for ages 3-6 remain an official reference for what children should know and be able to do.

Every implementation skill must have an entry in `kg3-skill-provenance.js`. Evidence is classified as:
- `direct-indicator`: explicit KG2/KG3 SELS indicator identified.
- `standards-strand`: directly within a named SELS strand, but the exact indicator still needs final extraction before activity authoring.
- `adult-strategy`: supported by SELS implementation guidance, not by itself a child outcome.
- `pending-indicator`: plausible implementation decomposition that must not be released until matched to an explicit SELS indicator.

Current audit: **25/25 skills have provenance records; 6 direct indicators, 11 standards-strand, 3 adult-strategy, 5 pending-indicator.**

`contentVerified` must remain `false` while any `pending-indicator` remains or while an activity relies only on `adult-strategy` evidence.
