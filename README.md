# Odyssey — Your AI Journey Home

> **The map never changes. The traveler always does.**

Odyssey is an AI-native interactive journey inspired by Homer’s *Odyssey*. Every traveler moves through the same fourteen mythological stations, but Homer reshapes the narration around the traveler’s stated home goal and the choices recorded along the way.

GPT is not the hero. **GPT is Homer. The player is the hero.**

## Product idea

- The map is the interface, not an illustration.
- The fourteen-island sequence remains fixed.
- Narrative changes according to the player’s Journey Memory.
- AI interprets language and narrates; deterministic engine logic owns progress and scoring.
- Homer mirrors evidence from the journey and never diagnoses, coaches, or predicts.
- Optional voice lets the player actively choose to hear Homer recite the current passage.

## Fourteen stations

1. Troy
2. Cicones
3. Lotus-Eaters
4. Cyclops
5. Aeolus
6. Laestrygonians
7. Circe
8. Underworld
9. Sirens
10. Scylla & Charybdis
11. Helios’ Cattle
12. Calypso
13. Phaeacia
14. Ithaca

## Build Week direction

The submission will demonstrate thoughtful use of GPT and Codex through:

- Structured narrative outputs
- Journey Memory and cross-island continuity
- Classical-first mythological guardrails
- Deterministic state transitions
- Safe retry and recovery flows
- Optional AI-generated Homer voice

## Current implementation status

A Troy vertical slice has been implemented locally and is awaiting final checkpoint upload into this repository. The slice includes:

- Home Goal → Troy → player answer → Journey Memory → Cicones
- Restricted Troy action tags
- Deterministic engine scoring
- Structured Output validation
- Optional `HEAR HOMER`
- Retry-safe text and audio failures
- Browser-session recovery

## Security

Never commit API keys or local environment files. Keep `.env.local` and all secrets outside version control.

## Product constitution

When implementation choices conflict with the spirit of Homer’s *Odyssey*, preserve the spirit of the epic before adding mechanics.
