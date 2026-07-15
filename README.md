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

## OpenAI-native origin

Odyssey is an OpenAI-native product co-created by Crystal Chang and OpenAI across its full life cycle. Its first interactive prototype was made in March 2026 through a ChatGPT-guided Figma workflow. In July 2026, GPT-5.6 Sol and Codex helped turn that concept into a complete fourteen-station journey; during OpenAI Build Week, Codex became the principal implementation, testing, and Preview-deployment environment for the judging build.

> **From its first Figma prototype to its fourteen-island journey and Build Week judging build, Odyssey has been shaped through sustained human–OpenAI collaboration.**

Origin artifacts: [Figma Make prototype](https://www.figma.com/make/onEumi3vr6LPnKqOUfhTht/Language-Support-Inquiry?node-id=0-4&t=b4QZa0isC2H9AUwE-1) · [published March prototype](https://dress-vector-61986483.figma.site/)

This lineage is not a claim that the entire product was created during Build Week. The pre-existing foundation and the submission-period additions remain explicitly separated in the [Build Week evidence record](docs/build-week-evidence.md) and [Issue #9](https://github.com/Crystal32378/odyssey/issues/9).

## Classical and educational context

Homer's *Odyssey* is studied in Literature Humanities, part of Columbia College's Core Curriculum. Crystal Chang also studied the epic in a Western Literature course at National Taiwan University.

Traditional literary study asks readers to interpret Odysseus after his choices have already been made. Odyssey reverses that sequence: the modern traveler chooses first, then looks back as Homer uses the ancient text to reflect the traveler's encounters with temptation, responsibility, and home.

This lineage gives the project educational relevance, but Odyssey is not limited to classrooms or positioned as a school-only tool. Its Build Week category remains **Apps for Your Life**.

## Public Preview

The current judging Preview is available at:

https://odyssey-preview.crystalys-chang.workers.dev

The Preview is deployed from the active Build Week branch while the Draft PR remains under review. The default `main` branch is not treated as the final judging build until the approved Build Week work is merged.

## Run locally

### Prerequisites

- Node.js 22.13 or newer
- npm
- an OpenAI API key with access to the configured text and speech models

### Setup

```bash
git clone https://github.com/Crystal32378/odyssey.git
cd odyssey
npm install
cp .env.local.example .env.local
```

Add the local API key to `.env.local`. Never commit that file.

```dotenv
OPENAI_API_KEY=your_api_key
HOMER_MODEL=gpt-5.6-sol
HOMER_AUDIO_MODEL=gpt-4o-mini-tts
```

Start the development server:

```bash
npm run dev
```

The terminal prints the local URL when the server is ready.

### Verification commands

| Command | Purpose |
|---|---|
| `npm test` | Run the deterministic Engine, API boundary, API route, Homer client, timeout, and asset-mapping tests |
| `npm run lint` | Run ESLint across the application |
| `npm run build` | Run the Homer model preflight and create the production Cloudflare build |
| `npm run deploy:preview` | Build and deploy the Preview-only Worker with authenticated Wrangler credentials |

The checked-in `wrangler.jsonc` names only the Preview Worker. Production and any formal domain require a separate review.

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | none | Server-side credential for Homer text and voice requests |
| `HOMER_MODEL` | No | `gpt-5.6-sol` | Responses API model used for Homer scenes, transitions, summaries, and Journey Cards |
| `HOMER_AUDIO_MODEL` | No | `gpt-4o-mini-tts` | Speech model used with the locked Onyx voice direction |

Secrets stay server-side. Browser code never receives the OpenAI API key.

## Architecture

Odyssey keeps narrative interpretation separate from deterministic journey authority:

| Area | Responsibility |
|---|---|
| `app/page.tsx` | Map, fourteen-shore interaction, ending ritual, Journey Card presentation, and session recovery |
| `lib/journey.ts` | Fixed island order, allowed action tags, stat changes, progression, and endings |
| `lib/homer-client.ts` | Browser-to-server Homer requests, timeouts, and safe retry behavior |
| `app/api/homer/route.ts` | GPT-5.6 Responses API calls, strict JSON Schemas, server-side output validation, and safe errors |
| `app/api/homer/audio/route.ts` | Optional Homer speech using Onyx and the locked recitation prompt |
| `lib/api-boundary.ts` and `lib/homer-payload.ts` | Request size limits, rate limits, and sanitized Journey Memory payloads |
| `worker/index.ts` | Cloudflare Worker entry point and image delivery |

Journey Memory is stored in browser `sessionStorage` so refresh recovery does not create a remote player profile. The server receives only the bounded journey fields needed for the current Homer request. GPT interprets and narrates; `lib/journey.ts` alone decides progress, stats, action tags, and endings.

## OpenAI integration

- Homer text uses the Responses API with the explicit default model `gpt-5.6-sol`.
- Every phase uses a strict JSON Schema and a second server-side validator.
- Runtime requests do not silently fall back to another text model.
- The player timeline preserves exact statements for grounded cross-island Journey Memory.
- Homer voice remains an optional `gpt-4o-mini-tts` request using Onyx and the established recitation prompt.
- If text or voice fails, the deterministic journey record remains intact.

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

## How Codex contributed

Codex is used as the principal implementation, testing, and deployment environment rather than only as a code-completion tool. During Build Week it has:

- audited the pre-existing repository and established the timestamped baseline
- promoted Homer to the explicit `gpt-5.6-sol` model while preserving strict Structured Outputs
- added assertions that prevent silent model drift and invalid structured responses
- diagnosed four canonical island-ID-to-artwork mismatches and added full fourteen-island asset coverage
- implemented and tested the landing-page cover correction and the local-memory Ending Ritual
- added bounded ending timeouts and a Summary-preserving Card-only retry path
- run automated tests, lint, production builds, Cloudflare Preview deployments, and desktop/mobile runtime verification

Crystal Chang retains product and art-direction authority, approves scope and merge decisions, and performs the final human journey review. Independent Codex review is recorded after deployment. The detailed division of pre-existing work, Build Week additions, implementation commits, Preview versions, known limitations, and the final `/feedback` Session ID is maintained in the [Build Week evidence record](docs/build-week-evidence.md) and [Issue #9](https://github.com/Crystal32378/odyssey/issues/9).

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

**Current Build Week checkpoint:** Draft PR #12 records the explicit `gpt-5.6-sol` integration, complete island-art mapping, landing cover correction, and Ending Ritual through commit `7d62b51`. Gate 2 passed 20 automated tests, production build, and public desktop/mobile Preview verification. Reduced-motion visual capture, timeout/retry failure capture, and the final ritual art direction remain open acceptance evidence. These are branch-and-Preview claims until the PR is approved and merged.

## Security

Never commit API keys or local environment files. Keep `.env.local` and all secrets outside version control.

## Licensing

Source code is released under the [MIT License](LICENSE).

Odyssey artwork, maps, image derivatives, crests, medallions, and other narrative visual assets are **not** licensed under MIT. They remain copyright Crystal Chang and are documented in [the visual asset and rights manifest](docs/visual-assets.md). Framework starter assets retain their applicable upstream terms.

## Product constitution

When implementation choices conflict with the spirit of Homer’s *Odyssey*, preserve the spirit of the epic before adding mechanics.
