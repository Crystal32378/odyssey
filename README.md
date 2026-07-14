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

## Approved Build Week product scope

The Build Week work is organized as three integrated product pillars. These are approved targets, not completed-work claims.

### 1. Homer powered by GPT-5.6

- explicit, verifiable GPT-5.6 model configuration
- strict structured narrative outputs
- stronger Journey Memory and observable cross-island continuity
- coordinated text, voice, loading, error, and fallback behavior
- deterministic engine ownership of progress, scoring, and endings

### 2. Immersive motion

- ship movement along the existing map route
- staged, full-bleed island arrivals
- restrained Homer text and voice presentation
- meaningful motion tied to journey state
- reduced-motion alternatives

### 3. Visual-first interaction

- existing island artwork becomes the primary stage
- narrative and controls are layered onto the visual world
- progressive disclosure reduces simultaneous text and control overload
- interaction hierarchy remains clear on desktop and mobile
- the experience is refined without rebuilding the core Engine

Submission readiness, Preview reliability, testing, evidence, and final media are cross-cutting delivery requirements rather than separate product pillars.

## Build Week evidence

Odyssey existed before OpenAI Build Week. The repository therefore maintains a timestamped record that separates the submission-period baseline, boundary maintenance, and meaningful Build Week extensions.

- [Build Week evidence record](docs/build-week-evidence.md)
- [Canonical evidence tracking issue](https://github.com/Crystal32378/odyssey/issues/9)

Final submission claims must be supported by code, commits, pull requests, Codex session evidence, tests, deployment verification, or demo footage.

## Verified foundation and boundary maintenance

The submission period began at 2026-07-13 16:00 UTC / 2026-07-14 00:00 Asia/Taipei.

**Submission-period baseline:** `abb29656df7e3ddc08c4bdc6d8eb5edf34bfe5db`

The foundation available at that moment included:

- a complete fourteen-island journey from Troy to Ithaca
- deterministic engine-owned progress, action tags, scoring, and endings
- structured Journey Memory using the player’s exact words
- strict structured Homer text outputs
- optional Homer voice playback
- retry-safe text and audio flows
- browser-session recovery
- Ithaca and Calypso endings with Journey Summary and Journey Card
- fourteen-island visual artwork
- responsive presentation foundation
- Cloudflare Workers Preview
- API boundary hardening
- existing automated tests and production build pipeline

**Boundary maintenance:** PR #8 was merged at `6f74f9fde53ba53e2483f2168fcd75751a380b7e`, fourteen minutes after the submission period began. It adds transient island-image retry and recovery behavior. It may be cited as Build Week Preview reliability evidence, but not as evidence that Odyssey was meaningfully extended.

GPT-5.6 integration and all three approved product pillars remain target scope until supported by competition-period implementation evidence.

## Security

Never commit API keys or local environment files. Keep `.env.local` and all secrets outside version control.

## Product constitution

When implementation choices conflict with the spirit of Homer’s *Odyssey*, preserve the spirit of the epic before adding mechanics.
