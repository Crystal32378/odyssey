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
| Codex evidence | Submit `/feedback` Session ID from the principal implementation thread | Session ID and representative work links | Pending |
| Project media | Thumbnail and a small gallery that explains the product | Final image list and source rights check | Pending |
| Truthful claims | Pre-existing work cannot be presented as Build Week work | This ledger plus PR and commit timestamps | In force |
| Judging availability | Keep the public judging build working through 2026-08-05 | Deployment monitoring record | Pending |
| Additional information | Submitter, residence, representative, team, track, URLs, testing instructions | Final submission checklist | Pending |
| Team eligibility | Crystal is expected representative; Kim requires real documented contribution if she joins | Team decision and contribution record | Pending |
| Support disclosure | Determine whether prior API credits affect the support clause | Rules-based eligibility note | Pending |

## 5. Change evidence log

Add one row for every meaningful competition-period change.

| UTC date | Change | PR | Commit | Codex thread / Session ID | Verification | Preview / demo evidence |
|---|---|---|---|---|---|---|
| 2026-07-13 | PR #8 boundary Preview maintenance | [#8](https://github.com/Crystal32378/odyssey/pull/8) | `6f74f9f` | Separate maintenance thread | 16 tests, build, asset checks recorded in PR | Preview verification pending after `main` deployment |
| 2026-07-14 | Evidence record initialized and corrected | [#10](https://github.com/Crystal32378/odyssey/pull/10) | Pending merge | Evidence-planning thread; not primary `/feedback` candidate | Documentation-only review | N/A |

## 6. Codex evidence

### Primary implementation thread

- **Thread:** Pending
- **`/feedback` Session ID:** Pending
- **Why this thread is representative:** It must contain the majority of core Build Week implementation, testing, and Preview verification.

Do not use a scope-only, checklist-only, read-only review, or isolated maintenance session as the primary `/feedback` evidence.

| Area | What Codex did | Product or engineering decision | Supporting PR or commit |
|---|---|---|---|
| Planning | Pending | Pending | Pending |
| Core implementation | Pending | Pending | Pending |
| Testing and debugging | Pending | Pending | Pending |
| Deployment and verification | Pending | Pending | Pending |
| Submission preparation | Pending | Pending | Pending |

## 7. GPT-5.6 evidence

Every claim must be supported by code and a testable product path.

| Evidence | Location or link | Status |
|---|---|---|
| exact model configuration | Pending | Pending |
| API call site | Pending | Pending |
| structured input and output contract | Pending | Pending |
| Journey Memory grounding | Pending | Pending |
| failure and fallback behavior | Pending | Pending |
| actual Preview model verification | Pending | Pending |
| visible demo behavior | Pending | Pending |

## 8. Verification record

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

## 9. Submission claim audit

Before final submission, classify every statement as one of:

- **Existing foundation:** present at `abb2965`
- **Boundary maintenance:** PR #8 reliability work during the opening boundary
- **Built during Build Week:** supported by timestamped commits, PRs, Codex evidence, tests, and visible behavior
- **Future direction:** not implemented and clearly described as future work

No target-scope or future item may be written as a current capability.

## 10. Final submission checklist

- [ ] working public Preview
- [ ] category confirmed: Apps for Your Life
- [ ] public repository with an appropriate license
- [ ] complete setup, environment, run, test, and architecture instructions
- [ ] baseline, boundary maintenance, and Build Week work clearly separated
- [ ] Codex acceleration explained with concrete examples
- [ ] key product, design, and engineering decisions documented
- [ ] GPT-5.6 integration meaningful and verifiable
- [ ] principal `/feedback` Session ID recorded
- [ ] public YouTube demo is no more than 3 minutes
- [ ] audible English narration explains the product, Codex, and GPT-5.6
- [ ] demo, README, repository, gallery, and Devpost copy make consistent claims
- [ ] final submission completed during Taipei daytime on July 21
- [ ] Preview maintained through the judging period

## 11. Evidence standard

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
