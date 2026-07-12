# Odyssey visual-polish design QA

- Source visual truth: supplied `Troy-2png.png` reference plus the locked homepage and visual constitution in the project handoff.
- Rendered implementation: `http://localhost:3000/` on `feature/visual-polish`.
- Browser evidence: `docs/qa/`.
- Primary desktop viewport: 1440 × 1000.
- Primary mobile viewport: 390 × 844.
- States exercised: homepage, Troy, Underworld, Calypso, Calypso ending, Ithaca ending, Summary, Journey Card.
- Primary interactions exercised: start journey, answer shores, advance deterministic sequence, choose Calypso ending, continue from Calypso, complete Ithaca, reveal Summary and Journey Card, restart journey.
- Console result: no warnings or errors reported by the browser.

## Full-view comparison evidence

- `docs/qa/troy-source-vs-implementation.png` places the source Troy painting and the 1440 × 1000 rendered Troy screen in one comparison image.
- `docs/qa/home-desktop.png` confirms that the locked map-first homepage composition is unchanged.
- `docs/qa/troy-mobile.png` confirms that the shore painting remains visible above the narrative at 390 × 844.
- `docs/qa/underworld-desktop.png` confirms that a later island is visually distinct while retaining the common editorial layout.
- `docs/qa/calypso-mobile.png` confirms mobile focal-point behavior on a lighter island.
- `docs/qa/ithaca-card-mobile.png` confirms the compact single-column Journey Card treatment.

## Focused comparison evidence

Focused checks were performed on:

- Island painting crops and overlays at desktop and mobile sizes.
- Homer medallion and audio control at mobile size.
- Journey Card crest, title, field hierarchy, quote, and shore count at mobile size.
- Transparent asset edges on dark preview backgrounds.

## Required fidelity surfaces

### Fonts and typography

- The established Georgia / Times editorial system is preserved.
- Island names retain strong classical display scale without clipping.
- Narrative, question, field labels, and controls preserve the existing hierarchy.
- Mobile Summary and Card use readable single-column line lengths and wrapping.

### Spacing and layout rhythm

- Desktop retains the established painting / narrative split.
- Mobile now presents a compact shore painting before narrative content.
- Primary and restart actions have separate visual roles and sufficient spacing.
- No horizontal overflow was measured at 390 px.

### Colors and visual tokens

- Existing deep navy, muted ivory, bronze, and amber tokens are preserved.
- Island paintings remain the dark mortal system; the locked pale marble map remains the threshold.
- Overlays are restrained and preserve image detail while supporting labels.

### Image quality and asset fidelity

- Fourteen supplied 4:3 paintings are mapped to fourteen islands.
- Optimized WebP derivatives retain sufficient detail at 1440 px source width.
- Island-specific focal positions prevent key subjects from being lost on mobile.
- Ship, crest, and Homer assets now have validated alpha channels and clean visible edges.
- The ship is intentionally reserved rather than placed onto the locked homepage in this phase.

### Copy and content

- Engine, scoring, API behavior, prompts, island copy, generated narrative contracts, and ending logic were not changed.
- Existing ending and Journey Memory language is preserved.

## Findings

No actionable P0, P1, or P2 visual mismatch remains.

## Comparison history

### Iteration 1

- Earlier P2: all islands used the same board image and were visually indistinguishable.
- Fix: added the fourteen-image mapping, optimized derivatives, and island-specific focal positions.
- Post-fix evidence: `docs/qa/troy-source-vs-implementation.png`, `docs/qa/underworld-desktop.png`.

- Earlier P2: mobile island screens hid the shore artwork below the input flow.
- Fix: moved a compact 4:3-derived shore context above the mobile narrative.
- Post-fix evidence: `docs/qa/troy-mobile.png`, `docs/qa/calypso-mobile.png`.

- Earlier P2: Journey Card was visually dense and used a cramped two-column mobile layout.
- Fix: changed mobile fields to a single column, tightened the card frame, and added the supplied crest.
- Post-fix evidence: `docs/qa/ithaca-card-mobile.png`.

### Iteration 2

- Earlier P2: supplied ship, crest, and Homer PNG files contained baked checkerboards and no alpha channel.
- Fix: created non-destructive chroma-key derivatives, removed the key locally, verified alpha, and optimized final WebP assets.
- Post-fix evidence: final assets under `public/assets/`; browser-rendered Homer and Journey Card checks showed no halo or console errors.

## Follow-up polish

- P3: the ship token can be introduced in a future map-motion pass after an explicit homepage-animation approval.
- P3: divine interludes can later use the supplied ivory-marble deity system without changing island paintings.

## Implementation checklist

- [x] Fourteen island mapping and optimized images.
- [x] Desktop and mobile focal points.
- [x] Mobile shore context.
- [x] Restrained island and ending motion.
- [x] Reduced-motion fallback.
- [x] Summary and Journey Card hierarchy.
- [x] Alpha-safe supporting assets.
- [x] Calypso and Ithaca browser paths.
- [x] Console check.

final result: passed
