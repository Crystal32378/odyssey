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
| Working project | Public Preview; no payment, special permission, or judge API key | Preview URL, smoke tests, deployment version | Pending final judging build |
| Category | Apps for Your Life | Devpost field and final copy | Locked |
| Project description | Separate inspiration, problem, operation, build, challenges, learning, baseline, Build Week additions, and next steps | Devpost copy checked against repo | Pending |
| Demo video | Public YouTube, no more than 3 minutes, audible English narration or complete English translation | URL, duration, transcript, timestamps | Pending |
| Demo content | Show the working project and specifically explain Codex and GPT-5.6 use | Shot list and timestamp map | Pending |
| Repository | Public with an appropriate license, or private with designated judge access | Repo visibility and license | License pending |
| README | Setup, environment, run, test, architecture, GPT-5.6, Codex, decisions, baseline, additions, limitations, and demo path | README audit | Pending |
| Codex evidence | Submit `/feedback` Session ID from the principal implementation thread | Session ID and representative work links | Recorded: `019f5bfb-c01b-7211-8d17-c7556d6f0d6f` |
| Project media | Thumbnail and a small gallery that explains the product | Final image list and source rights check | Pending |
| Truthful claims | Pre-existing work cannot be presented as Build Week work | This ledger plus PR and commit timestamps | In force |
| Judging availability | Keep the public judging build working through 2026-08-05 | Deployment monitoring record | Pending |
| Additional information | Submitter, residence, representative, team, track, URLs, testing instructions | Final submission checklist | Pending |
| Team eligibility | Crystal is expected representative; Kim requires real documented contribution if she joins | Team decision and contribution record | Pending |
| Support disclosure | General-purpose API credits or subscription access not provided specifically for Odyssey are not project support under the cited clause | Official Build Week Discord confirmation and preserved Devpost discussion, 2026-07-14 | Closed |

## 5. Change evidence log

Add one row for every meaningful competition-period change.

| UTC date | Change | PR | Commit | Codex thread / Session ID | Verification | Preview / demo evidence |
|---|---|---|---|---|---|---|
| 2026-07-13 | PR #8 boundary Preview maintenance | [#8](https://github.com/Crystal32378/odyssey/pull/8) | `6f74f9f` | Separate maintenance thread | 16 tests, build, asset checks recorded in PR | Preview verification pending after `main` deployment |
| 2026-07-14 | Evidence record initialized and corrected | [#10](https://github.com/Crystal32378/odyssey/pull/10) | Pending merge | Evidence-planning thread; not primary `/feedback` candidate | Documentation-only review | N/A |
| 2026-07-14 | Gate 2: explicit Sol model, complete island art, cover correction, and Ending Ritual | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `5ef1975` through `7d62b51` | Principal implementation thread | 20 tests, lint, production build | Public Preview Gate 2; evidence in PR #12 |
| 2026-07-15 | Gate 3.2: compositor voyage camera and six-beat arrival ritual | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `8d63e4f`, `e92e321` | Principal implementation thread | 34 tests; Firefox, Chrome, Safari, mobile, reduced motion, recovery, fourteen shores | Version `690f7ed3-8c9f-460f-a883-58af7fce2d99`; Crystal PASS |
| 2026-07-16 | Gate 4: D1-backed Terra Divine Presence Layer | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `a967a38` through `b4fac14` | Principal implementation thread | 77 tests, lint, build, D1 concurrency, six-trigger route, public browser QA | Version `045777b3-ba8c-4ca6-9f14-5b0b23e1e53a`; tag `gate4-divine-b4fac14`; Crystal acceptance pending |
| 2026-07-17 | Gate 4.1: terminal-only Divine oracle reveal | [#12](https://github.com/Crystal32378/odyssey/pull/12) | `0c84789` | Principal implementation thread | 90 tests, lint, build, receipt-deadline and late-result tests, short-desktop/mobile runtime QA | Version `3be77b47-9bda-4eae-b946-c0eec9c85eb3`; tag `gate4-1-0c84789`; Crystal reading-pace acceptance pending |

## 6. Codex evidence

### Primary implementation thread

- **Thread:** Desktop Codex principal task `BuildWeekJul.14/15/16/17`
- **`/feedback` Session ID:** `019f5bfb-c01b-7211-8d17-c7556d6f0d6f`
- **Recorded:** 2026-07-17 after the Gate 4.1 checkpoint and independent CLI credential separation
- **Why this thread is representative:** It contains the majority of Odyssey's Build Week planning, core implementation, testing, debugging, Cloudflare Preview deployment, evidence maintenance, and the Gate 4.1 handoff. The isolated Cursor CLI session was not used as the primary record because it had not yet performed Luna or other paid engineering work when this ID was captured.

Do not use a scope-only, checklist-only, read-only review, or isolated maintenance session as the primary `/feedback` evidence.

| Area | What Codex did | Product or engineering decision | Supporting PR or commit |
|---|---|---|---|
| Planning | Pending | Pending | Pending |
| Core implementation | Pending | Pending | Pending |
| Testing and debugging | Pending | Pending | Pending |
| Deployment and verification | Pending | Pending | Pending |
| Submission preparation | Pending | Pending | Pending |

### Approved submission narrative draft

Codex served as Odyssey's principal engineering steward. It preserved the authority of a deterministic Game Engine while integrating model-specific narrative layers, durable receipts, authored fallbacks, recovery, cross-browser verification, deployment, and auditable evidence.

Odyssey feels effortless because Codex carries the operational weight behind the experience.

Sol remembers. Terra bears witness. Luna beckons. The traveler chooses. The Engine keeps the law. Codex keeps the voyage seaworthy.

The Luna sentence is an approved submission-language draft, not a completed-work claim. It becomes publishable as current capability only after Gate 5 implementation and Crystal acceptance.

## 7. GPT-5.6 evidence

Every claim must be supported by code and a testable product path.

| Evidence | Location or link | Status |
|---|---|---|
| exact model configuration | `lib/server/divine-handler.ts`, `.env.local.example` | Sol and Terra explicit; model-set preflight verified |
| API call site | `app/api/homer/route.ts`, `lib/server/divine-handler.ts` | Implemented and tested |
| structured input and output contract | Homer phase schemas plus `lib/divine.ts` and `lib/server/divine-handler.ts` | Strict schema plus manual server validation |
| Journey Memory grounding | Bounded Homer payload plus last four eligible Divine memory references | Implemented and tested |
| failure and fallback behavior | Homer client retry paths; authored per-deity Divine fallbacks | Implemented and tested |
| actual Preview model verification | Gate 1 Sol verification and Gate 4 generated Terra receipts | Verified on public Preview |
| visible demo behavior | Homer cross-island witness, voyage/arrival ritual, generated Poseidon stage | Public Preview verified; final demo capture pending |

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
- Divine audio and sound cues were intentionally deferred so audio QA could not weaken the text, visual, fallback, D1, or Firefox performance gate.

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
- Gate 4.1 remains a Preview candidate until Crystal confirms that the oracle can now be read without a jump-page effect.

## 9. Verification record

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

## 10. Submission claim audit

Before final submission, classify every statement as one of:

- **Existing foundation:** present at `abb2965`
- **Boundary maintenance:** PR #8 reliability work during the opening boundary
- **Built during Build Week:** supported by timestamped commits, PRs, Codex evidence, tests, and visible behavior
- **Future direction:** not implemented and clearly described as future work

No target-scope or future item may be written as a current capability.

## 11. Final submission checklist

- [ ] working public Preview
- [ ] category confirmed: Apps for Your Life
- [ ] public repository with an appropriate license
- [ ] complete setup, environment, run, test, and architecture instructions
- [ ] baseline, boundary maintenance, and Build Week work clearly separated
- [ ] Codex acceleration explained with concrete examples
- [ ] key product, design, and engineering decisions documented
- [ ] GPT-5.6 integration meaningful and verifiable
- [x] principal `/feedback` Session ID recorded: `019f5bfb-c01b-7211-8d17-c7556d6f0d6f`
- [ ] public YouTube demo is no more than 3 minutes
- [ ] audible English narration explains the product, Codex, and GPT-5.6
- [ ] demo, README, repository, gallery, and Devpost copy make consistent claims
- [ ] final submission completed during Taipei daytime on July 21
- [ ] Preview maintained through the judging period

## 12. Evidence standard

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