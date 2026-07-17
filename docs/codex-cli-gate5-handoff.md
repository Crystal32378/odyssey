# Codex CLI Handoff: Gate 5 Luna and Soundscape

## Ownership

- **Principal acceptance and submission thread:** Desktop Codex session `019f5fbf-c01b-7211-8d17-c7556d6f0d6f`
- **Implementation office:** Cursor terminal with `CODEX_HOME=/Users/crystalchang/.codex-odyssey-build`
- **Billing owner:** OpenAI Platform project `Odyssey`
- **Secret boundary:** the Codex CLI credential stays in its private `CODEX_HOME`. It must never be copied into this repository or `.env.local`.
- **Final authority:** Crystal performs product acceptance. Desktop Codex preserves the canonical evidence chain and final submission record.

## Authoritative Baseline

- Repository: `Crystal32378/odyssey`
- Worktree: `/Users/crystalchang/Documents/奧德賽 2`
- Branch: `codex/build-week-core`
- Draft PR: [#12](https://github.com/Crystal32378/odyssey/pull/12)
- `main`: `6514dd88f895082d298a2217493b02c5da146018` and must remain unchanged
- Accepted Gate 3.2 tag: `gate3-2-e92e321`
- Accepted Gate 4.1 code: `0c84789`
- Accepted Gate 4.1 tag: `gate4-1-0c84789`
- Public Preview Version: `3be77b47-9bda-4eae-b946-c0eec9c85eb3`
- Gate 4.1 verification: 90 tests, lint with no errors, production build, desktop/mobile runtime review, generated public Terra receipt
- Crystal Acceptance: PASS on 2026-07-17. The oracle is readable and no longer feels like a jump-page transition.

Do not redesign or reopen Gate 3.2, Gate 4, or Gate 4.1 while implementing Gate 5.

## First CLI Action

From the Cursor terminal, verify the isolated login and repository state before editing:

```bash
export CODEX_HOME=/Users/crystalchang/.codex-odyssey-build
codex login status
cd "/Users/crystalchang/Documents/奧德賽 2"
git status --short --branch
git fetch origin
```

Stop if the isolated login is absent, the branch is not `codex/build-week-core`, the worktree is dirty for unexplained reasons, the remote has diverged, or `gpt-5.6-luna` access cannot be verified. Never print or inspect the API key.

## Gate 5 Product Contract

The approved reveal order is:

```text
PLACE -> NAME -> MEMORY -> WITNESS (Homer) -> LUNA THRESHOLD ->
LUNA CHARACTER -> CHOICE -> RESPONSE
```

- Place, name, memory, and Homer must finish and remain stable before the Luna threshold appears.
- The player actively clicks the threshold token before the character speaks.
- The threshold is not an option, action tag, collectible, item system, score, or route decision.
- Luna does not replace Homer and does not become a chat interface.
- The Luna utterance must settle before the existing choice and response controls appear.
- Each encounter renders exactly one generated utterance or one authored fallback. Late responses cannot overwrite a settled result.
- The browser cannot choose the actor, model, persona, prompt, voice, or cue.
- The product model is `gpt-5.6-luna`; do not silently substitute Sol or Terra.
- Gate 5 core contains no voice or soundscape work.

## Shared Visual Grammar

Use one engineering skeleton with three distinct character moods.

- Existing Circe, Sirens, and Calypso island art remains the full visual stage.
- Wine, Tail, and Veil are small interactive threshold tokens over those existing stages. They do not replace the character art and do not create new full-page character stages.
- Generated text may show `WORDS SHAPED BY GPT-5.6 LUNA`.
- Authored fallback must never be labeled as model-generated.
- Reduced motion removes object movement while preserving material, meaning, click target, text, and order.
- Luna uses ivory, mother-of-pearl, moonstone, opal, restrained gold, refraction, water, wine, and fabric breath.
- Do not use chrome, RPG effects, badges, coins, sparkles, or the Homer token language.

Character differences:

- **Circe:** a restrained ripple on the wine surface; terms, transformation, and self-boundary.
- **Sirens:** a pearl tail passing through water; plural knowledge and the temptation to stop moving.
- **Calypso:** a veil breathing at the edge of mist; tenderness, rest, paused time, and the cost of staying.

## Approved Assets

Source files supplied and approved by Crystal:

- Circe threshold: `/Users/crystalchang/Desktop/Personal Files/讀書會/奧德賽/Wine.png`
- Sirens threshold: `/Users/crystalchang/Desktop/Personal Files/讀書會/奧德賽/Tail.png`
- Calypso threshold: `/Users/crystalchang/Desktop/Personal Files/讀書會/奧德賽/Veil.png`
- Combined reference only: `/Users/crystalchang/Desktop/Personal Files/讀書會/奧德賽/Luna Icon.png`
- Penelope ending art: `/Users/crystalchang/Desktop/Personal Files/讀書會/奧德賽/Penelope.png`

The three threshold images were generated in Crystal's 2026-07-16 ChatGPT session against the approved Odyssey visual canon. Crystal approved the art. There are no external third-party assets. Preserve the source and rights record, create versioned optimized derivatives, and do not regenerate or redesign the objects without Crystal approval.

## Character Contracts

### Circe

- Core: terms, hospitality, transformation, and sovereignty over thresholds.
- Mark: `THE SHAPE YOU KEEP`
- Fallback: `Drink, and the shape you guard will answer before your name does. Cross my threshold only if you know what in you must not be surrendered.`
- Never make her a generic seductive witch, mother, therapist, or prophet. She cannot decide the player's route.

### Sirens

- Core: plural chorus, promised complete knowledge, and the temptation to be fully understood rather than continue.
- Mark: `WE KNOW THE ANSWER`
- Fallback: `We know the answer your own memory cannot finish. Listen, and we will give every loss a meaning, every question an end.`
- Never reduce them to one woman, a horror scream, a generic mermaid, or true omniscience. They cannot invent private facts.

### Calypso

- Core: genuine tenderness, rest, suspended time, and the cost of staying.
- Mark: `THE SHORE WITHOUT TOMORROW`
- Fallback: `Rest here, and departure will slowly begin to feel like harm. I offer no chain-only a shore gentle enough to make the road seem unnecessary.`
- Never make her a jealous ex, a villainous jailer, or an emotional coercer. She cannot alter the Calypso ending.

### Penelope

- Core: equal intelligence, weaving and unweaving, mutual change, recognition, and testing.
- Mark: `THE THREAD REMEMBERS`
- Fallback: `I did not remain unchanged while you crossed the sea. Do not ask whether I waited; show me what in you has truly returned.`
- Never make her a passive waiting wife, a return-home prize, or unconditional forgiveness.
- She appears only on the Ithaca ending, after the Journey Card and before Restart.
- Her image and text appear automatically. She is not a fifteenth island or an easter egg.
- Gate 5 keeps her silent. The later audio gate may make her voice click-to-play; that click never controls whether she is visible.

## Immutable Boundaries

- Do not change fourteen-island order, Game Engine decisions, scoring, stats, action tags, or endings.
- Do not change `lib/journey.ts` progression or `lib/voyage.ts` four-second voyage and six-beat reveal contracts.
- Do not change Homer `gpt-5.6-sol`, Onyx, prompts, request count, or Journey Memory contract.
- Do not change Divine `gpt-5.6-terra`, its six triggers, receipt behavior, or Gate 4.1 presentation.
- Do not expose an OpenAI key, internal prompt, successful request ID, or remote player profile to the browser.
- AI or asset failure must not block choice, response, Calypso ending, or return to Ithaca.
- Keep PR #12 Draft. Do not merge or touch the production domain.

## Reversible Delivery Shape

Keep the exact implementation architecture sympathetic to the repository, but preserve these rollback boundaries:

1. Luna server registry, strict schema, authored fallbacks, preflight, and bounded receipt behavior.
2. Three threshold tokens, presentation state, recovery, reduced motion, and stable reveal order.
3. Penelope Ithaca ending ritual.
4. Gate 5 tests and evidence documentation.
5. Soundscape and voice in later independent commits only after Gate 5 Crystal Acceptance.

Do not mix generated derivatives, product behavior, and evidence into one irreversible commit.

## Gate 5 Verification

Before Preview deployment, verify:

- all prior 90 tests remain green
- exact actor and trigger registry for Circe, Sirens, Calypso, and Penelope
- strict Luna output validation and authored fallback provenance
- generated, fallback, timeout, conflict, pending, refresh, dismiss, reset, and late-response behavior
- one invocation per eligible journey and trigger under concurrent requests
- no Luna request before the player clicks a stable threshold
- browser cannot override actor, model, persona, prompt, voice, or cue
- Calypso ending remains unchanged and contains no Penelope
- Ithaca ending shows Penelope after Journey Card and before Restart
- desktop, mobile, Firefox, Chrome, Safari, and reduced-motion QA
- no Luna asset fetch or decode during the four-second voyage
- no console errors, layout overlap, or Gate 3.2 performance regression
- lint, production build, public Preview smoke test, exact deployment Version, tag, and branch SHA

Stop at public Preview for Crystal visual and narrative acceptance. Do not merge.

## Crystal Acceptance Sentences

- **Circe:** I feel that change carries terms, and I must recognize what cannot be surrendered.
- **Sirens:** I feel the temptation of being fully understood and knowing everything, so that I no longer need to continue.
- **Calypso:** I feel that staying is genuinely gentle, but comfort can make departure begin to feel like harm.
- **Penelope:** I am not receiving a reward for returning; I am being recognized and tested by someone who also changed.

## Later Soundscape Gate

Soundscape begins only after Gate 5 Crystal Acceptance.

- Keep inference text generation separate from speech rendering.
- Do not autoplay without a player gesture.
- Preserve written text and clear AI voice disclosure.
- Use fixed, versioned, cacheable cues selected from an approved enum.
- Add a cue only when its authorship or license is recorded; silence is an acceptable fallback.
- Voice and ambience failures must never block the journey.
- Validate Safari gesture rules, mobile, mute, captions, ducking, Firefox cold decode, cache size, and voyage performance.
- Deliver voice and soundscape as independent, reversible commits and a separate Preview gate.

## Evidence Rule

Every checkpoint must preserve commit SHA, tests, lint, build, Preview Version, deployment tag, browser evidence, OpenAI model evidence without exposing secrets, and Crystal acceptance status in Draft PR #12, Issue #11, Issue #9, and `docs/build-week-evidence.md`.
