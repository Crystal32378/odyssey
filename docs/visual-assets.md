# Odyssey visual asset manifest

This manifest is the source of truth for the `feature/visual-polish` island artwork.
Original source PNGs remain outside the repository; the application consumes optimized WebP derivatives.

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
