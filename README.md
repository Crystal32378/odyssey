# Odyssey — Your AI Journey Home

> **The map never changes. The traveler always does.**

Odyssey is an AI-native interactive journey inspired by Homer’s *Odyssey*. Every traveler moves through the same fourteen mythological stations, but Homer reshapes the narration around the traveler’s stated home goal and the choices recorded along the way.

GPT is not the hero. **GPT is Homer. The player is the hero.**

## The problem

Classical literature too often appears only in university classrooms: read once, analyzed for an assignment, and then left behind. Yet works such as *The Odyssey* contain enduring questions about home, temptation, loyalty, grief, identity, endurance, and return—questions that can reveal different meanings at different stages of life.

The barrier is not only access. The names, places, and episodes are difficult to remember, and most readers do not have a simple way to return to the text, reconnect its fragments, and reflect on what they mean now.

## The response

Odyssey condenses the essential arc of the epic into a simple, replayable fourteen-station journey. Its visual interface helps players remember key characters, places, and dilemmas, while their own choices make each return a new act of interpretation.

AI does not replace the classic, summarize it into trivia, or tell the player what to believe. It helps the text meet the traveler where they are.

> **Odyssey does not turn a classic into trivia. It makes the classic returnable.**

## Product idea

- The map is the interface, not an illustration.
- The fourteen-island sequence remains fixed.
- Narrative changes according to the player’s Journey Memory.
- AI interprets language and narrates; deterministic engine logic owns progress and scoring.
- Homer mirrors evidence from the journey and never diagnoses, coaches, or predicts.
- Optional voice lets the player actively choose to hear Homer recite the current passage.

## Public Preview

The current judging Preview is available at:

https://odyssey-preview.crystalys-chang.workers.dev

The judging Preview is deployed from the reviewed Build Week checkpoint identified below. PR [#12](https://github.com/Crystal32378/odyssey/pull/12), immutable tags, and the evidence record preserve the exact implementation and merge history.

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
DIVINE_MODEL=gpt-5.6-terra
LUNA_MODEL=gpt-5.6-luna
```

Start the development server:

```bash
npm run dev
```

The terminal prints the local URL when the server is ready.

### Verification commands

| Command | Purpose |
|---|---|
| `npm test` | Run the deterministic Engine, Homer, Divine Presence, Luna, D1 ledger, Soundscape, recovery, accessibility, and asset tests |
| `npm run lint` | Run ESLint across the application |
| `npm run build` | Run the configured model-set preflight, including Sol/Terra/Luna, and create the production Cloudflare build |
| `npm run deploy:preview` | Build and deploy the Preview-only Worker with authenticated Wrangler credentials |

The checked-in `wrangler.jsonc` names only the Preview Worker. Production and any formal domain require a separate review.

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | none | Server-side credential for Homer text and voice requests |
| `HOMER_MODEL` | No | `gpt-5.6-sol` | Responses API model used for Homer scenes, transitions, summaries, and Journey Cards |
| `HOMER_AUDIO_MODEL` | No | `gpt-4o-mini-tts` | Speech model used with the locked Onyx voice direction |
| `DIVINE_MODEL` | No | `gpt-5.6-terra` | Responses API model used for bounded Divine Presence text; it never replaces Homer or the Engine |
| `LUNA_MODEL` | No | `gpt-5.6-luna` | Fixed Responses API model for Circe, Sirens, and Calypso threshold encounters; browser input cannot select or override it |

Secrets stay server-side. Browser code never receives the OpenAI API key.

## Architecture

Odyssey keeps narrative interpretation separate from deterministic journey authority:

| Area | Responsibility |
|---|---|
| `app/page.tsx` | Map, fourteen-shore interaction, ending ritual, Journey Card presentation, and session recovery |
| `app/divine-presence-stage.tsx` | Dismissible Divine Presence presentation between a resolved voyage and the destination arrival |
| `lib/journey.ts` | Fixed island order, allowed action tags, stat changes, progression, and endings |
| `lib/homer-client.ts` | Browser-to-server Homer requests, timeouts, and safe retry behavior |
| `app/api/homer/route.ts` | GPT-5.6 Responses API calls, strict JSON Schemas, server-side output validation, and safe errors |
| `app/api/homer/audio/route.ts` | Optional Homer speech using Onyx and the locked recitation prompt |
| `app/api/divine/route.ts` | Shared encounter endpoint that dispatches only the server-owned `divine` and `luna` layers to their dedicated handlers |
| `lib/server/divine-handler.ts` | Terra requests, canonical trigger validation, strict Structured Outputs, and authored fallback behavior |
| `lib/divine.ts` and `lib/divine-session.ts` | Server-owned deity registry plus tab-local presentation, recovery, and dismissal state |
| `lib/server/luna-handler.ts` | Luna requests, server-owned character prompts, strict Structured Outputs, bounded retries, and authored fallback behavior |
| `lib/luna.ts` and `lib/luna-session.ts` | Three canonical threshold entries plus tab-local presentation, recovery, deduplication, and late-response protection |
| `lib/server/encounters/*` and `db/schema.ts` | Atomic, expiring D1 encounter receipts that prevent duplicate paid generation |
| `lib/soundscape.ts` and `app/soundscape-control.tsx` | Optional fail-open sea, sailing, Divine bird, and Ithaca loom presentation with persistent Mute / Unmute |
| `lib/api-boundary.ts` and `lib/homer-payload.ts` | Request size limits, rate limits, and sanitized Journey Memory payloads |
| `worker/index.ts` | Cloudflare Worker entry point and image delivery |

Journey Memory remains in browser `sessionStorage`; Odyssey does not create a remote player profile. The server receives only the bounded journey fields needed for the current Homer, Divine Presence, or Luna request. GPT interprets and narrates; `lib/journey.ts` alone decides progress, stats, action tags, and endings.

Divine Presence and Luna reuse one minimal Cloudflare D1 encounter-receipt ledger. Separate `layer` values make each `journeyId + layer + triggerId` idempotent without adding a second migration or player-profile system. A receipt stores an opaque journey UUID, layer, trigger, payload hash, status, final oracle/source, timestamps, and expiry. It does **not** store the full prompt, full player timeline, or a remote player profile. Receipts have a 24-hour logical expiry and an hourly best-effort physical cleanup job; the project does not claim immediate or strict physical deletion at the expiry instant.

## OpenAI integration

- Homer text uses the Responses API with the explicit default model `gpt-5.6-sol`.
- Six canonical Divine Presence encounters use the separate `gpt-5.6-terra` model; the server fixes the deity, lore, persona, trigger, image, voice family, and fallback.
- Circe, the Sirens, and Calypso each have one bounded threshold encounter using the fixed `gpt-5.6-luna` model; the server fixes the actor, trigger, persona, lore, request contract, output schema, and fallback.
- Every phase uses a strict JSON Schema and a second server-side validator.
- Runtime requests do not silently fall back to another text model.
- Terra requests use `store: false`; a Terra or D1 failure returns an authored deity fallback without blocking the journey or switching to Sol.
- Luna requests use `store: false` and the existing D1 receipt authority; failure returns the character-specific authored fallback without changing the route, choice, score, history, statistics, or ending.
- The player timeline preserves exact statements for grounded cross-island Journey Memory.
- Homer voice remains an optional `gpt-4o-mini-tts` request using Onyx and the established recitation prompt.
- The authored Penelope recognition remains separate from generated Luna output. Its canonical words are not a model fallback.
- The optional authored Soundscape is removable and fail-open; audio never controls or delays Journey progression.
- If generated text, voice, or authored audio fails, the deterministic journey record remains intact.

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

The Build Week work is organized as three integrated product pillars. Completion claims are supported by the checkpoint and evidence record below.

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
- built the D1-backed, at-most-once Divine Presence receipt flow, server-owned Terra registry, six canonical triggers, authored fallbacks, and marble encounter stage
- separated Divine waiting, generated, and authored-fallback states so one encounter can reveal only one stable oracle
- integrated three generated `gpt-5.6-luna` threshold encounters through the existing D1 receipt authority while preserving every Engine and ending boundary
- kept the authored Penelope recognition distinct from Luna, then added the optional Soundscape as an independent, reversible, fail-open presentation layer
- clarified entry and continuation actions without changing questions, Journey Memory, or state authority
- ran independent canonical-route, client-wiring, accessibility, asset, and D1 concurrency audits before deployment
- ran automated tests, lint, production builds, Cloudflare Preview deployments, and desktop/mobile runtime verification

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

**Current Build Week product checkpoint:** `ba90bc9`, tagged `submission-p0-ba90bc9`, on PR #12.

- Gate 4.1 at `0c84789` reveals exactly one generated Terra oracle or authored deity fallback. Crystal accepted its reading pace on 2026-07-17.
- Gate 5A at `9141d3d`, refined at `fab78ad`, adds the authored, non-generated Penelope recognition only after an Ithaca Journey Card and never on the Calypso ending. Crystal accepted the full-bleed ritual on 2026-07-18. Gate 5A itself introduced no Luna call or audio; the later optional Soundscape does not change that provenance.
- Gate 5B through `ac8293e`, tagged `gate5-luna-ac8293e`, adds generated `gpt-5.6-luna` threshold encounters for Circe, the Sirens, and Calypso. It reuses the Gate 4 D1 receipt ledger without migration, fixes every prompt and schema server-side, preserves the Calypso stay ending, and leaves `lib/journey.ts` unchanged.
- The independent Soundscape through `114cbf1`, tagged `soundscape-mvp-114cbf1`, adds optional authored sea, four-second sailing, sparse Divine bird, and Ithaca loom layers with accessible persistent mute, Homer ducking, recorded rights, and fail-open behavior.
- The P0 clarity pass at `ba90bc9` explains Ithaca at entry, makes continuation the unambiguous primary action, and demotes Restart without changing Journey logic, questions, generated content, models, audio, or endings.

The checkpoint passed **148 automated tests**, lint with zero errors (six pre-existing image warnings), the production build, and Chrome desktop/mobile runtime review with zero unexpected console errors, network failures, or horizontal overflow. Gate-specific evidence also covers Firefox, Safari, reduced motion, refresh/retry recovery, receipt deduplication, late responses, asset failure, Calypso exclusion, and Ithaca ordering.

On 2026-07-19 the public Preview returned HTTP 200 with deployment version `a0dca440-0f23-45c8-a85d-8760d724a30a`, served the final P0 entry copy, and served byte-complete Soundscape assets matching the recorded SHA-256 hashes. These are branch-and-Preview claims until PR #12 is approved and merged.

## Future directions

The following ideas are product directions, not claims about the current public Preview or the Build Week submission build.

### Relational gods

Future journeys could turn divine encounters into relationships that accumulate over time. A traveler might choose to honor, worship, resist, or defy a god. Repeated devotion could allow that god to become a protecting presence later in the route, while repeated defiance could make the journey longer, more difficult, or more exposed to that god’s power.

This should not become a generic favor meter or a simple reward-and-punishment system. Each divine relationship should reflect the values, temperament, and authority of that particular god. Protection should carry a cost, and resistance should remain a meaningful choice rather than an error.

### Embodied Luna characters

Circe, the Sirens, and Calypso could gain greater physical presence through restrained animation. Breath, gaze, a small turn of the head, or subtle movement in hair and fabric could make these women feel present at the threshold rather than illustrated beside the text.

The aim would not be cinematic spectacle or game-character performance. Movement should deepen recognition and tension while preserving the quiet visual language of Odyssey.

### Live Conversation Mode

A future optional live mode could allow travelers to speak with Sol, Terra, and Luna instead of typing. The traveler could answer a dilemma aloud, hear a character respond in real time, and continue a bounded spoken exchange.

Each voice would remain limited by its narrative role:

- **Sol** could guide the journey, clarify Journey Memory, and speak through Homer’s narrative presence.
- **Terra** could let a god question, warn, challenge, or respond during a divine encounter, informed by the traveler’s accumulated history with that god.
- **Luna** could support more intimate threshold conversations with Circe, the Sirens, and Calypso, responding to what the traveler actually says.

Live conversation should not turn the characters into general-purpose companions available at every moment. It should open only where each character has literary authority, remain bounded in time or turns, and write meaningful outcomes back into Journey Memory.

Together, these directions would allow Odyssey to evolve from an interactive reading experience into a living oral journey without surrendering literary structure.

## Security

Never commit API keys or local environment files. Keep `.env.local` and all secrets outside version control.

## Licensing

Source code is released under the [MIT License](LICENSE).

Odyssey artwork, maps, image derivatives, crests, medallions, and other narrative visual assets are **not** licensed under MIT. They remain copyright Crystal Chang and are documented in [the visual asset and rights manifest](docs/visual-assets.md). Framework starter assets retain their applicable upstream terms.

## Product constitution

When implementation choices conflict with the spirit of Homer’s *Odyssey*, preserve the spirit of the epic before adding mechanics.
