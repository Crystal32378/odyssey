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

The submission will demonstrate thoughtful use of GPT-5.6 and Codex through:

- Structured narrative outputs
- Journey Memory and cross-island continuity
- Classical-first mythological guardrails
- Deterministic state transitions
- Safe retry and recovery flows
- Optional AI-generated Homer voice

## Build Week evidence

Odyssey existed before OpenAI Build Week. The repository therefore maintains a timestamped record that separates the verified baseline from meaningful work completed during the official submission period.

- [Build Week evidence record](docs/build-week-evidence.md)
- [Canonical evidence tracking issue](https://github.com/Crystal32378/odyssey/issues/9)

Final submission claims must be supported by code, commits, pull requests, Codex session evidence, tests, deployment verification, or demo footage.

## Current implementation status

The verified baseline at commit `6f74f9f` includes:

- a complete fourteen-island journey from Troy to Ithaca
- deterministic engine-owned progress, action tags, scoring, and endings
- structured Journey Memory using the player’s exact words
- strict structured Homer text outputs
- optional Homer voice playback
- retry-safe text, audio, and island-image recovery
- browser-session recovery
- Ithaca and Calypso endings with Journey Summary and Journey Card
- responsive desktop and mobile presentation
- Cloudflare Workers preview deployment
- 16 automated tests and a passing production build

GPT-5.6 integration, competition-period improvements, and final submission evidence are tracked separately so planned work is not confused with completed functionality.

## Security

Never commit API keys or local environment files. Keep `.env.local` and all secrets outside version control.

## Product constitution

When implementation choices conflict with the spirit of Homer’s *Odyssey*, preserve the spirit of the epic before adding mechanics.
