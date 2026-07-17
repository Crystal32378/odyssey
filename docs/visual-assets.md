# Odyssey visual asset manifest

This manifest is the source of truth for Odyssey's narrative visual assets.
Original source PNGs remain outside the repository; the application consumes optimized WebP derivatives.

## Rights and provenance

The following provenance statement is supplied and confirmed by Crystal Chang:

- The Odyssey maps, fourteen island scenes, and narrative supporting artwork were created under Crystal Chang's creative direction using GPT-5.6 Sol with Image 2.
- Crystal selected the compositions, prompts, variants, narrative purpose, and final production assets.
- Codex assisted with mechanical production work including background removal, alpha-channel repair, WebP conversion, asset mapping, and delivery validation.
- No third-party stock imagery, logos, or copyrighted music is intentionally included in the Odyssey narrative asset set.

Under the [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/), as between the user and OpenAI and to the extent permitted by applicable law, the user owns the output and OpenAI assigns any right, title, and interest it may have in that output. This manifest records Crystal Chang's project-specific provenance and rights declaration; it does not make a broader claim about copyrightability beyond applicable law.

Copyright and other applicable rights (c) 2026 Crystal Chang, to the extent permitted by applicable law. All rights reserved.

The MIT license at the repository root applies to source code only. It does **not** grant permission to reuse, redistribute, modify, sell, train on, or separately publish the Odyssey maps, island scenes, character art, crests, medallions, or their source files. Their inclusion in this public repository permits inspection and execution of the submitted project, not independent asset reuse.

Framework starter SVGs are not claimed as original Odyssey artwork and retain their applicable upstream terms.

## Provenance register

| Asset group | Repository paths | Creative source | Codex production work | Rights status |
|---|---|---|---|---|
| Homepage map and board | `/public/odyssey-map.png`, `/public/odyssey-board.png` | Crystal Chang direction; GPT-5.6 Sol with Image 2 | Web delivery integration and validation | Crystal Chang; all rights reserved |
| Fourteen island scenes | `/public/islands/*.webp` | Crystal Chang direction; GPT-5.6 Sol with Image 2 | Source selection mapping, WebP delivery, focal-point integration, and validation | Crystal Chang; all rights reserved |
| Ship token | `/public/assets/ship-token.webp` | Crystal Chang direction; GPT-5.6 Sol with Image 2 | Background removal, alpha repair, WebP conversion, and validation | Crystal Chang; all rights reserved |
| Journey Card crest | `/public/assets/journey-card-crest.webp` | Crystal Chang direction; GPT-5.6 Sol with Image 2 | Background removal, alpha repair, WebP conversion, and validation | Crystal Chang; all rights reserved |
| Homer medallion | `/public/assets/homer-medallion.webp` | Crystal Chang direction; GPT-5.6 Sol with Image 2 | Background removal, alpha repair, WebP conversion, and validation | Crystal Chang; all rights reserved |
| Six Divine Presence portraits | `/public/divine/v1/*.webp` | Crystal Chang direction; GPT-5.6 Sol with Image 2; source PNGs `Zeus.png`, `Poseidon.png`, `Athena.png`, `Hermes.png`, `Helios.png`, and `Ino.png` remain outside the repository | Versioned WebP optimization, mapping, and delivery validation | Crystal Chang; all rights reserved |
| Penelope Recognition portrait | `/public/characters/v1/penelope.webp` | Crystal Chang supplied and approved source PNG `Penelope.png`; generated in Crystal's 2026-07-16 ChatGPT session against the approved Odyssey visual canon; original remains outside the repository | Versioned WebP optimization and delivery validation | Crystal Chang; all rights reserved |
| Starter SVGs | `/public/favicon.svg`, `/public/file.svg`, `/public/globe.svg`, `/public/window.svg` | Project starter scaffold | None claimed as Odyssey creative work | Applicable upstream terms |

## Visual systems

- Mortal journey: dark classical narrative paintings, human choices, sea, fire, smoke, dusk, and weathered earth.
- Divine order: ivory marble, pale Aegean blue, mist, relief, and restrained gold. Used only for bounded Divine Presence encounters.
- Homepage: the threshold between both systems. Its locked map composition is not redesigned in this phase.

## Island mapping

| # | Island ID | Source selection | App asset | Desktop focus | Mobile focus |
|---|---|---|---|---|---|
| 01 | `troy` | `Troy-2png.png` | `/islands/troy.webp` | center 52% | center 48% |
| 02 | `cicones` | `Cicones.png` | `/islands/cicones.webp` | center 52% | center 50% |
| 03 | `lotus-eaters` | `Lotus-Eaters-1.png` | `/islands/lotus-eaters.webp` | center 55% | center 58% |
| 04 | `cyclops` | `Cyclops-2.png` | `/islands/cyclops.webp` | center 46% | center 42% |
| 05 | `aeolus` | `Aeolia-2.png` | `/islands/aeolus.webp` | center 48% | 66% center |
| 06 | `laestrygonians` | `Laestrygonians.png` | `/islands/laestrygonians.webp` | center 54% | 40% center |
| 07 | `circe` | `Circe.png` | `/islands/circe.webp` | center 54% | 70% center |
| 08 | `underworld` | `Underworld.png` | `/islands/underworld.webp` | center 52% | 40% center |
| 09 | `sirens` | `Sirens.png` | `/islands/sirens.webp` | center 52% | 38% center |
| 10 | `scylla-charybdis` | `Scylla & Charybdis.png` | `/islands/scylla-charybdis.webp` | center 52% | center 52% |
| 11 | `helios-cattle` | `Thrinacia.png` | `/islands/helios-cattle.webp` | center 54% | 38% center |
| 12 | `calypso` | `Calypso.png` | `/islands/calypso.webp` | center 50% | 38% center |
| 13 | `phaeacia` | `Phaeacia.png` | `/islands/phaeacia.webp` | center 53% | 62% center |
| 14 | `ithaca` | `Ithaca.png` | `/islands/ithaca.webp` | center 52% | 35% center |

## Delivery rules

- No island name, number, quotation, or UI copy is baked into an image.
- The app owns all labels and accessibility text.
- Island artwork uses a shared 4:3 source ratio and `object-fit: cover`.
- Desktop and mobile focal points are controlled in CSS through island-specific classes.
- A restrained dark overlay may be applied by the app for legibility.
- Engine, scoring, API payloads, prompts, game copy, and ending logic remain unchanged.

## Supporting assets

The supplied PNGs contained a baked checkerboard and no alpha channel. Non-destructive repair derivatives were created through a flat chroma-key extraction workflow and validated with real alpha channels:

| Asset | App path | Status |
|---|---|---|
| Ship token | `/assets/ship-token.webp` | Production-ready; reserved for a later map-motion pass so the locked homepage is not redesigned in this phase. |
| Journey Card crest | `/assets/journey-card-crest.webp` | Production-ready and used in the Journey Card. |
| Homer medallion | `/assets/homer-medallion.webp` | Production-ready and used as the restrained Homer audio marker. |

Original source files remain untouched outside the repository.

## Penelope Recognition derivative

The Gate 5A Penelope source was supplied and approved by Crystal Chang. It contains no external third-party asset. The original `1672 x 941` PNG remains outside the repository with SHA-256 `538214dbd2d169db44b47fda61f455355fdfb7206bea6d83f95ab7b9bfd4e2e1`.

| Character | App path | Dimensions | Bytes | SHA-256 |
|---|---|---:|---:|---|
| Penelope | `/characters/v1/penelope.webp` | `1440 x 810` | 56,142 | `508423e62dc72d27ef1269aad79c5f3a461e63f8cd30c074ad5173b4e1a8638c` |

## Divine Presence derivatives

All six Gate 4 portraits are VP8 WebP derivatives at `1122 x 1402`. Their combined delivery size is exactly `998,934` bytes (`0.953 MiB`), reduced from `15,087,140` bytes of source PNGs. Source basenames are recorded above without publishing private workstation paths.

| Deity | App path | Bytes | SHA-256 |
|---|---|---:|---|
| Athena | `/divine/v1/athena.webp` | 167,724 | `c13f0c5c1d86f092617b3cee0cb46d595c34a66597cd3bf17271d850c89da685` |
| Helios | `/divine/v1/helios.webp` | 183,284 | `f94f143c9a2184a19388d32fe7bcf5afe34d50203340771daba536acfeb760fd` |
| Hermes | `/divine/v1/hermes.webp` | 148,174 | `3d6230f1465327534b37d281d4baed5b765fdb4d88c48b1c8bc7aeff7ec8595b` |
| Ino / Leucothea | `/divine/v1/ino.webp` | 174,106 | `06681041c313b50567b1ad92aed6647006740ab1795f71bc4e585424ad589edd` |
| Poseidon | `/divine/v1/poseidon.webp` | 160,156 | `f64579cacb31fd96731dcbc0eccd22435fc4e0e65cb35fef8cd3d41104c599cf` |
| Zeus | `/divine/v1/zeus.webp` | 165,490 | `57982a27c895e32a450d18d62c18041bf915ae044ad1dbd04c3628ad078f48a8` |
