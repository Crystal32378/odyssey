# Odyssey visual asset manifest

This manifest is the source of truth for the `feature/visual-polish` island artwork.
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
| Ino source artwork | Not yet shipped in the repository | Crystal Chang direction; GPT-5.6 Sol with Image 2 | No production derivative shipped yet | Crystal Chang; all rights reserved |
| Starter SVGs | `/public/favicon.svg`, `/public/file.svg`, `/public/globe.svg`, `/public/window.svg` | Project starter scaffold | None claimed as Odyssey creative work | Applicable upstream terms |

## Visual systems

- Mortal journey: dark classical narrative paintings, human choices, sea, fire, smoke, dusk, and weathered earth.
- Divine order: ivory marble, pale Aegean blue, mist, relief, and restrained gold. Reserved for a later phase.
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
