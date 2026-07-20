# OpenAI Build Week Evidence Record

This document preserves the evidence chain and frozen compliance matrix for **Odyssey: The Journey Home**.

The project existed before OpenAI Build Week. Every submission claim must distinguish the submission-period baseline, boundary maintenance, and meaningful work completed during the official period.

Canonical tracking issue: [#9 — Build Week evidence chain and submission record](https://github.com/Crystal32378/odyssey/issues/9)

## 1. Time and commit anchors

**Submission Period start:** 2026-07-13 16:00 UTC / 2026-07-14 00:00 Asia/Taipei  
**Baseline branch:** `main`  
**Submission-period baseline:** `abb29656df7e3ddc08c4bdc6d8eb5edf34bfe5db`

At the opening instant, `abb2965` was the latest commit on `main`. It is the authoritative pre-Build Week baseline.

**Boundary maintenance PR:** [#8 — retry transient island image loads](https://github.com/Crystal32378/odyssey/pull/8)  
**Boundary maintenance merge commit:** `6f74f9fde53ba53e2483f2168fcd75751a380b7e`  
**Merged:** 2026-07-13 16:14:30 UTC, fourteen minutes after the Submission Period began

PR #8 may be recorded as Build Week Preview reliability and maintenance evidence. It must not be used to prove that Odyssey was meaningfully extended during Build Week.

## 2. Existing foundation at the start of the Submission Period

The following capabilities were available at `abb2965` and must be labeled:

> Existing foundation available at the start of the Submission Period.

- complete fourteen-island journey from Troy to Ithaca
- fixed island sequence
- deterministic Engine, stats, scoring, and ending logic
- structured Journey Memory foundation
- Homer text API and Structured Outputs
- optional Homer voice playback
- Journey Summary and Journey Card
- Ithaca and Calypso endings
- refresh and browser-session recovery
- fourteen-island visual artwork
- responsive presentation foundation
- Cloudflare Workers Preview
- API boundary hardening
- existing automated tests and build pipeline

A later PR may meaningfully extend one of these capabilities, but the underlying foundation must still be disclosed.

## 3. Approved Build Week product scope

Crystal approved three integrated product pillars. These are target scope until implementation evidence moves an item into completed-work claims.

### Pillar 1 — Homer powered by GPT-5.6

- switch Homer to an explicit, verifiable GPT-5.6 model configuration
- verify the Preview actually uses that configuration
- preserve strict Structured Outputs
- strengthen Journey Memory so Homer can cite concrete earlier choices across islands
- coordinate text, voice, loading, error, and fallback states
- keep the deterministic Engine in control of progress, scoring, and endings

**Minimum visible success:** Homer demonstrates, with specific journey evidence, that he remembers the traveler.

### Pillar 2 — Immersive motion

- move the ship along the existing map route as journey state advances
- stage island arrival with a restrained full-bleed visual entrance
- present island name, number, epithet, narrative, and question progressively
- let Homer’s text and voice feel witnessed rather than dumped onto the screen
- provide reduced-motion alternatives
- avoid particles, RPG effects, cinematic camera shake, and unrelated spectacle

**Minimum visible success:** progression, arrival, and Homer’s presence are legible through motion without delaying or confusing the player.

### Pillar 3 — Visual-first interaction

- make the existing map and island art the primary interactive stage
- layer narrative and controls over the visual world with readable contrast
- reduce simultaneous text and control overload through progressive disclosure
- clarify loading, ready, speaking, completed, and next-action states
- preserve usability on the main desktop and mobile path
- improve the interface without changing the core Engine, scoring, endings, island count, or game mode

**Minimum visible success:** a player understands where they are, what Homer is doing, and what to do next while the artwork remains the dominant experience.

### Cross-cutting delivery requirements

These are required for shipping but are not separate product pillars:

- Preview reliability
- mobile and reduced-motion QA
- README and setup instructions
- evidence chain and claim audit
- demo recording and gallery media
- security and eligibility checks
- final submission readiness

## 4. Frozen compliance matrix

**Official source:** [OpenAI Build Week Rules](https://openai.devpost.com/rules)  
**Matrix last consolidated:** 2026-07-14  
**Operating rule:** Do not rebuild a second compliance document. Re-check only official Updates or rule changes and record any change here.

| Requirement | Locked decision | Required evidence | Status |
|---|---|---|---|
| Working project | Public Preview; no payment, special permission, or judge API key | Preview URL, smoke tests, deployment version | Verified judging Preview; final monitoring remains |
| Category | Apps for Your Life | Devpost field and final copy | Locked |
| Project description | Separate inspiration, problem, operation, build, challenges, learning, baseline, Build Week additions, and next steps | Devpost copy checked against repo | Verified against the merged repository and final Devpost copy |
| Demo video | Public YouTube, no more than 3 minutes, audible English narration or complete English translation | URL, duration, transcript, timestamps | Public at <https://youtu.be/14uw02cCzM0>; accepted V3.2 runtime 2:41.167 |
| Demo content | Show the working project and specifically explain Codex and GPT-5.6 use | Shot list and timestamp map | Verified in the accepted V3.2 cut |
| Repository | Public with an appropriate license, or private with designated judge access | Repo visibility and license | Public; MIT source license and separate artwork-rights boundary recorded |
| README | Setup, environment, run, test, architecture, GPT-5.6, Codex, decisions, baseline, additions, limitations, and demo path | README audit | Updated through Gate 5B, Soundscape, P0, merge, and final demo URL |
| Codex evidence | Submit `/feedback` Session ID from the principal implementation thread | Session ID and representative work links | Recorded: `019f5fbf-c01b-7211-8d17-c7556d6f0d6f` |
| Project media | Thumbnail and a small gallery that explains the product | Final image list and source rights check | Final 8-page Deck, 15-image Gallery, and V3.2 Demo accepted by Crystal |
| Truthful claims | Pre-existing work cannot be presented as Build Week work | This ledger plus PR and commit timestamps | In force |
| Judging availability | Keep the public judging build working through the judging period ending 2026-08-10 | Deployment monitoring record | Pending |
| Additional information | Submitter, residence, representative, team, track, URLs, testing instructions | Final submission checklist | Pending |
| Team eligibility | Crystal is the representative; Kim contributed usability testing and P0 clarity feedback | Team decision and contribution record | Kim joined the Devpost team |
| Support disclosure | General-purpose API credits or subscription access not provided specifically for Odyssey are not project support under the cited clause | Official Build Week Discord confirmation and preserved Devpost discussion, 2026-07-14 | Closed |

## 5. Change evidence log

Add one row for every meaningful competition-period change.

| UTC date | Change | PR | Commit | Codex thread / Session ID | Verification | Preview / demo evidence |
|---|---|---|---|---|---|---|
| 2026-07-13 | PR #8 boundary Preview maintenance | [#8](https://github.com/Crystal32378/odyssey/pull/8) | `6f74f9f` | Separate maintenance thread | 16 tests, build, asset checks recorded in PR | Preview verification pending after `main` deployment |
| 2026-07-14 | Evidence record initialized and corrected | [#10](https://github.com/Crystal32378/odyssey/pull/10) | `6514dd8` | Evidence-planning thread; not primary `/feedback` candidate | Documentation-only review | Merged to `main` before the Build Week implementation branch |
| 2026-07-14 | Gate 2: explicit Sol model, complete island art, cover correction, and Ending Ritual | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `5ef1975` through `7d62b51` | Principal implementation thread | 20 tests, lint, production build | Public Preview Gate 2; evidence in PR #12 |
| 2026-07-15 | Gate 3.2: compositor voyage camera and six-beat arrival ritual | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `8d63e4f`, `e92e321` | Principal implementation thread | 34 tests; Firefox, Chrome, Safari, mobile, reduced motion, recovery, fourteen shores | Version `690f7ed3-8c9f-460f-a883-58af7fce2d99`; Crystal PASS |
| 2026-07-16 | Gate 4: D1-backed Terra Divine Presence Layer | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `a967a38` through `b4fac14` | Principal implementation thread | 77 tests, lint, build, D1 concurrency, six-trigger route, public browser QA | Version `045777b3-ba8c-4ca6-9f14-5b0b23e1e53a`; tag `gate4-divine-b4fac14`; reading-pace HOLD superseded by accepted Gate 4.1 |
| 2026-07-17 | Gate 4.1: terminal-only Divine oracle reveal | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `0c84789` | Principal implementation thread `019f5fbf-c01b-7211-8d17-c7556d6f0d6f` | 90 tests, lint, build, receipt-deadline and late-result tests, short-desktop/mobile runtime QA | Version `3be77b47-9bda-4eae-b946-c0eec9c85eb3`; tag `gate4-1-0c84789`; Crystal reading-pace acceptance PASS |
| 2026-07-17 | Gate 5A: authored Penelope Recognition Ritual | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `ae0aa9e`, `9141d3d` | Isolated Codex CLI implementation office | 94 tests, lint, build, Ithaca/Calypso, ordering, image-failure, desktop/mobile/reduced-motion runtime QA | Version `955cdb06-217f-408f-b29d-999e5e734e61`; tag `gate5a-penelope-9141d3d`; superseded visually by the accepted full-bleed refinement |
| 2026-07-18 | Gate 5A visual refinement: full-bleed frameless Penelope | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `fab78ad` | Isolated Codex CLI implementation office | 94 tests, lint, build, local/public full-bleed, fallback, desktop/mobile/reduced-motion QA | Version `8f36be04-4f4b-43d5-a8a9-c9e23fce3dc4`; tag `gate5a-frameless-fab78ad`; Crystal Acceptance PASS |
| 2026-07-18 | Gate 5B: generated Luna threshold encounters | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `02fddd2` through `ac8293e` | Isolated Codex CLI implementation and principal acceptance | 130 tests, lint, build, D1 receipt/idempotency/recovery, three thresholds, Calypso/Ithaca regressions, Chrome/Firefox/Safari, mobile/reduced motion | Tag `gate5-luna-ac8293e`; generated Luna and authored Penelope provenance separated; Crystal Acceptance PASS |
| 2026-07-18 | Submission-safe authored Soundscape | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `14b271d` through `114cbf1` | Isolated Codex CLI implementation and Crystal listening review | 144 tests, lint, build, fail-open/mute/ducking/non-stacking/rights, Chrome/Firefox/Safari, desktop/mobile/reduced motion | Tag `soundscape-mvp-114cbf1`; current Preview serves byte-complete retained derivatives |
| 2026-07-18 | P0 entry and action clarity | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `ba90bc9` | Isolated Codex CLI implementation after team-member usability feedback | 148 tests, lint, build, focus order, 44px targets, Chrome desktop/mobile, zero overflow/console/network errors | Tag `submission-p0-ba90bc9`; current judging Preview version `a0dca440-0f23-45c8-a85d-8760d724a30a` verified 2026-07-19 |

## 6. Codex evidence

### Primary implementation thread

- **Thread:** Desktop Codex principal task `BuildWeekJul.14/15/16/17`
- **`/feedback` Session ID:** `019f5fbf-c01b-7211-8d17-c7556d6f0d6f`
- **Recorded:** 2026-07-17 after the Gate 4.1 checkpoint and independent CLI credential separation
- **Why this thread is representative:** It contains the majority of Odyssey's Build Week planning, core implementation, testing, debugging, Cloudflare Preview deployment, evidence maintenance, and the Gate 4.1 handoff. The isolated Cursor CLI session was not used as the primary record because it had not yet performed Luna or other paid engineering work when this ID was captured.

### Supporting implementation session

- **Cursor Codex CLI Session ID:** `019f7079-441b-7be1-a750-280ee9e37c87`
- **Scope:** Gate 5B Luna threshold implementation, Soundscape engineering, tests, and browser verification
- **Submission use:** Supporting evidence only. The Devpost required `/feedback` field remains the principal Desktop Session ID above.

Do not use a scope-only, checklist-only, read-only review, or isolated maintenance session as the primary `/feedback` evidence.

| Area | What Codex did | Product or engineering decision | Supporting PR or commit |
|---|---|---|---|
| Planning | Audited the opening baseline, converted product intent into bounded gates, and maintained stop-loss and provenance rules | Preserve the deterministic Engine and distinguish existing foundation, authored content, generated layers, and future work | PR #12; `536bbf0`, `9f04c14` |
| Core implementation | Built Sol, voyage/arrival, Terra, authored Penelope, generated Luna, and optional Soundscape layers | Give each narrative layer fixed authority; reuse one D1 receipt ledger; never let model or audio own progress or endings | PR #12; `5ef1975` through `114cbf1` |
| Testing and debugging | Added model, schema, receipt, concurrency, recovery, ending, accessibility, audio, and presentation coverage; corrected visual and focus defects | Prefer fail-open behavior, one stable encounter outcome, natural keyboard order, and protected Calypso/Ithaca paths | PR #12; `a92168f`, `ac8293e`, `114cbf1`, `ba90bc9` |
| Deployment and verification | Ran builds and public Preview deployments; reviewed desktop, mobile, reduced motion, Chrome, Firefox, Safari, D1, console, network, and asset delivery | Stop at Preview for Crystal acceptance; keep `main`, production, and merge under explicit human control | PR #12; checkpoint tags and deployment versions in this record |
| Submission preparation | Maintained README/evidence truth, asset rights, QA records, P0 usability copy, and submission media production | Claims must name the pre-existing foundation and keep authored Penelope separate from generated Luna | `14b271d`, `ba90bc9`; `docs/audio-assets.md`; this record |

### Approved submission narrative draft

Codex served as Odyssey's principal engineering steward. It preserved the authority of a deterministic Game Engine while integrating model-specific narrative layers, durable receipts, authored fallbacks, recovery, cross-browser verification, deployment, and auditable evidence.

Odyssey feels effortless because Codex carries the operational weight behind the experience.

Sol remembers. Terra bears witness. Luna tests the threshold. Penelope recognizes the return. The traveler chooses. The Engine keeps the law. Codex keeps the voyage seaworthy.

Here Luna refers only to the three generated Gate 5B encounters. Penelope remains authored, non-generated product copy. The optional Soundscape is authored presentation, not model output or Journey authority.

## 7. GPT-5.6 evidence

Every claim must be supported by code and a testable product path.

| Evidence | Location or link | Status |
|---|---|---|
| exact model configuration | Homer route/config, `lib/server/divine-handler.ts`, `lib/server/luna-handler.ts`, `.env.local.example`, `scripts/check-homer-model.mjs` | Sol, Terra, and Luna explicit; model-set preflight and drift rejection tested |
| API call site | `app/api/homer/route.ts`, `lib/server/divine-handler.ts`, `lib/server/luna-handler.ts` | Implemented and tested; browser cannot choose a model or server persona/schema |
| structured input and output contract | Homer phase schemas plus Divine and Luna registries/handlers | Strict JSON Schema plus independent server validation |
| Journey Memory grounding | Bounded Homer payload, eligible Divine references, and at most one supplied Luna memory reference | Implemented and tested without a cross-journey profile |
| failure and fallback behavior | Homer client retry paths; authored per-deity Divine and per-character Luna fallbacks | Implemented, idempotent, late-response safe, and fail-open |
| actual Preview model verification | Sol verification, generated Terra receipts, and generated Luna threshold paths | Verified during gate-specific public Preview QA |
| visible demo behavior | Homer cross-island witness, voyage/arrival ritual, generated Divine and Luna stages, authored Penelope return | Public Preview and accepted V3.2 demo verified |

## 8. Gate 4 Divine Presence verification

**Branch head at deployment:** `b4fac14`

**Public Preview Version:** `045777b3-ba8c-4ca6-9f14-5b0b23e1e53a`

**Cloudflare deployment tag:** `gate4-divine-b4fac14`

- The full Ithaca route generated exactly six Terra encounters: Poseidon, Hermes, Helios, Zeus, Ino / Leucothea, and Athena.
- The Calypso ending is contract-tested to show only the four gods actually reached; it does not manufacture Ino or Athena after the route ends.
- Twenty simultaneous public requests for one receipt produced one `200` winner, nineteen `202` pending responses, and exactly one Terra completion; the cached retry returned the same generated result.
- Reusing the same receipt key with a different payload hash returned `409 DIVINE_RECEIPT_CONFLICT`.
- Public D1 inspection recorded one receipt for the concurrency proof and six distinct generated receipts for the full-route proof.
- Public browser review confirmed a generated Poseidon stage, complete AI disclosure, zero console errors, identical text after refresh, and a clean continuation to Aeolia without replay.
- Desktop and mobile Divine layouts passed visual review. Reduced-motion content and semantics are covered by automated presentation tests; no browser media-emulation screenshot is claimed for this gate.
- Gate 3.2's four-second voyage and six-beat arrival contracts, `lib/journey.ts`, and `lib/voyage.ts` remain unchanged.
- Divine audio and sound cues were intentionally deferred at Gate 4. The later independent Soundscape adds only a sparse authored bird accent and does not revise Gate 4's model, receipt, or presentation authority.

### Gate 4.1 reading-rhythm checkpoint

**Branch head at deployment:** `0c84789`

**Public Preview Version:** `3be77b47-9bda-4eae-b946-c0eec9c85eb3`

**Git and Cloudflare tag:** `gate4-1-0c84789`

- Waiting now shows only the deity portrait, deity name, and `THE SIGN GATHERS`; it does not render a provisional oracle, provenance claim, or Continue control.
- A generated oracle appears only after a valid Terra result. Authored fallback appears only after a terminal server failure or the shared ten-second presentation deadline.
- The client and receipt ledger share bounded deadlines. Response body parsing, reservation time, rate limiting, stale pending recovery, D1 races, and late model completion cannot create a second visible oracle.
- One canonical public Poseidon request returned `generated` in 4.49 seconds with the correct actor and trigger and no successful OpenAI request ID exposed to the browser.
- Local runtime review covered the real Troy-to-Poseidon path, authored fallback, continuation to Aeolia, a `1366 x 640` short desktop viewport, a `390 x 844` mobile viewport, and zero browser console warnings or errors.
- Automated reduced-motion coverage remains green. No browser media-emulation screenshot is claimed for Gate 4.1.
- `lib/journey.ts`, `lib/voyage.ts`, all six Divine triggers, Gate 3.2 timing, Luna, and audio were not changed.
- Crystal confirmed on 2026-07-17 that the oracle is readable and no longer feels like a jump-page transition. Gate 4.1 Crystal Acceptance is PASS.

## 9. Gate 5A Penelope Recognition verification

**Deployed branch head:** `fab78ad`

**Public Preview Version:** `8f36be04-4f4b-43d5-a8a9-c9e23fce3dc4`

**Git tag:** `gate5a-frameless-fab78ad`

- Penelope appears automatically only after the completed Ithaca Journey Card and before Restart. She never appears on the Calypso ending.
- The ritual uses Crystal's approved canonical mark and text. It is authored, stable from first render, and has no Luna request, receipt, or AI-generated provenance label. Gate 5A itself was silent.
- The approved source PNG remains outside the repository. The versioned `1440 x 810` WebP derivative is 56,142 bytes, has recorded provenance and rights, and was served byte-complete from the public Preview.
- Image failure removes only the portrait. The canonical text and enabled Restart path remain complete.
- Four Gate 5A regression tests bring the full suite to 94 passing tests. Lint completed with no errors and the production build passed.
- Local and public Chrome runtime checks covered `1366 x 768` desktop, `390 x 844` mobile, reduced motion, Ithaca ordering, Calypso exclusion, blocked-image fallback, no horizontal overflow, and zero console errors.
- The isolated `fab78ad` visual refinement removes the outer frame and card treatment, expands the image to a full-bleed ritual environment, and makes Restart visually secondary without changing DOM order, copy, semantics, state, or behavior.
- `lib/journey.ts`, `lib/voyage.ts`, Journey Memory, Homer, Divine Presence, all Engine outcomes, Luna server work, voice, and soundscape were not changed by Gate 5A.
- Crystal accepted the full-bleed recognition on 2026-07-18. The later independent Soundscape plays an authored loom texture at the Ithaca reveal transition; this does not turn Penelope into generated Luna output or alter the Gate 5A copy, ordering, failure behavior, or Calypso exclusion.

## 10. Gate 5B Luna Threshold verification

**Accepted checkpoint:** `ac8293e`

**Git tag:** `gate5-luna-ac8293e`

- Circe, the Sirens, and Calypso each have one server-owned threshold entry using the fixed `gpt-5.6-luna` model.
- Browser input contains only the bounded journey context. It cannot override the model, trigger, actor, persona, lore, prompt, request contract, output schema, or fallback.
- Luna uses the existing Gate 4 D1 encounter ledger with `layer = luna`; no new D1 migration, remote profile, inventory, token system, score, or Engine authority was added.
- One receipt can resolve to one generated encounter or one authored character fallback. Payload conflicts, refresh/retry races, stale pending receipts, incomplete output, and late responses cannot create a second visible outcome.
- Calypso's existing stay choice ends immediately, does not force continuation or replay Luna, and never mounts Penelope. Ithaca still orders Journey Card, authored Penelope, and Restart.
- Gate 5B introduced no voice or Soundscape work. The generated Luna passages and authored Penelope recognition are labeled and evidenced separately.
- The accepted presentation and accessibility checkpoint passed 130 tests, lint with zero errors, production build, and Chrome/Firefox/Safari desktop/mobile QA, including reduced motion, refresh, retry, fallback, keyboard order, overflow, and zero console errors.

## 11. Optional authored Soundscape verification

**Accepted checkpoint:** `114cbf1`

**Git tag:** `soundscape-mvp-114cbf1`

**Rights and processing record:** [Audio asset record](audio-assets.md)

- The Soundscape is optional, gesture-gated, muted on request, remembered locally, and fail-open. Missing, blocked, slow, or corrupt audio cannot delay or control the Journey.
- The retained sea loop remains low-presence; the four-second ship layer cannot stack; Homer voice ducks the sea; each Divine encounter can play one sparse authored bird accent; Ithaca fades the sea before the final reveal and plays one non-looping loom passage.
- Refresh does not replay the completed Ithaca loom. Restart clears the presentation guard and waits for a new genuine user gesture. The Calypso stay ending never mounts or plays the loom.
- Asset sources, rights pages, download dates, originals, derivatives, processing, sizes, and SHA-256 hashes are recorded. Source masters remain outside `public/`.
- The final Soundscape checkpoint passed 144 tests, lint with zero errors, production build, and Chrome/Firefox/Safari desktop/mobile and reduced-motion verification with zero unexpected console or network errors.
- On 2026-07-19 the public Preview served the sea, bird, and loom derivatives byte-complete with SHA-256 hashes matching `docs/audio-assets.md`.

## 12. P0 clarity and judging Preview verification

**Product checkpoint:** `ba90bc9`

**Git tag:** `submission-p0-ba90bc9`

**Public Preview Version verified 2026-07-19:** `a0dca440-0f23-45c8-a85d-8760d724a30a`

- Team-member usability feedback identified two new-player ambiguities: the meaning of Ithaca and competition between the continuation and Restart controls.
- The P0 pass explains Ithaca with concrete examples, replaces metaphorical action labels with `BEGIN THE JOURNEY`, `CONTINUE THE JOURNEY`, and `COMPLETE THE RETURN`, and visually demotes `Restart journey`.
- Questions, generated content, Journey Memory, Engine state, models, routes, schemas, animations, Soundscape gains, Penelope, and both endings remain unchanged.
- Natural focus order and 44px targets remain intact. The checkpoint passed 148 tests, lint with zero errors and six pre-existing image warnings, the production build, and Chrome desktop/mobile QA with zero horizontal overflow, console errors, or unexpected failed requests.
- The public Preview returned HTTP 200 and served the final P0 entry copy during the 2026-07-19 principal audit.

## 13. Verification record

For every implementation PR, preserve:

- exact branch and commit SHA
- pull request description or comment
- tests and results
- lint, type check, and production build results
- desktop and mobile acceptance checks
- reduced-motion checks
- Preview deployment version and smoke-test result
- known limitations
- before and after visual evidence
- corresponding judging criterion
- Codex thread

## 14. Submission claim audit

Before final submission, classify every statement as one of:

- **Existing foundation:** present at `abb2965`
- **Boundary maintenance:** PR #8 reliability work during the opening boundary
- **Built during Build Week:** supported by timestamped commits, PRs, Codex evidence, tests, and visible behavior
- **Future direction:** not implemented and clearly described as future work

No target-scope or future item may be written as a current capability.

## 15. Final submission checklist

- [x] working public Preview
- [x] category confirmed: Apps for Your Life
- [x] public repository with an appropriate license and separate artwork-rights boundary
- [x] complete setup, environment, run, test, and architecture instructions
- [x] baseline, boundary maintenance, and Build Week work clearly separated
- [x] Codex acceleration explained with concrete examples
- [x] key product, design, and engineering decisions documented
- [x] GPT-5.6 integration meaningful and verifiable
- [x] principal `/feedback` Session ID recorded: `019f5fbf-c01b-7211-8d17-c7556d6f0d6f`
- [x] public YouTube demo is no more than 3 minutes: <https://youtu.be/14uw02cCzM0>
- [x] audible English narration explains the product, Codex, and GPT-5.6
- [x] demo, README, repository, gallery, and Devpost copy make consistent claims
- [ ] final submission completed during Taipei daytime on July 21
- [ ] Preview maintained through the judging period

## 16. Evidence standard

A final claim is acceptable only when supported by at least one primary artifact:

- source code
- timestamped commit
- pull request
- Codex session or `/feedback` Session ID
- automated test output
- deployment verification
- screenshot, GIF, or video
- public demo timestamp

When evidence is incomplete, describe the capability as a limitation or future direction instead of overstating it.
