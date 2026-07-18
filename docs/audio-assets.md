# Odyssey authored audio assets

Frozen record date: **2026-07-18**. These files support an optional authored Soundscape. They are not AI-generated audio and have no authority over Journey state, timing, scoring, receipts, or endings.

## Retained assets

### Close sea waves loop — Mixkit

- Decision: **KEEP**, replacing the supplied bird-bearing candidate under the approved stop-loss rule.
- Displayed title: `Close sea waves loop`.
- Creator/uploader: not listed on the Mixkit asset catalogue.
- Exact catalogue page: <https://mixkit.co/free-sound-effects/sea/> (the named asset is listed at 0:28).
- License pages: <https://mixkit.co/license/> and <https://mixkit.co/free-sound-effects/>. Mixkit identifies Sound Effects as Free License content and states that sound effects may be used in commercial and personal projects without required attribution.
- Download date: `2026-07-18`.
- Preserved source master: `assets/audio-sources/mixkit-close-sea-waves-loop-1195.mp3`.
- Source retrieval: Mixkit asset 1195 preview endpoint; the catalogue does not expose a separate stable item-detail URL.
- Source SHA-256: `07df3082a1845885fb106ea7987e790b64ea88a8a165cc6073d8c8ac9fbc140f`.
- Source: 909,759 bytes; 29.048163 seconds; stereo MP3; 44.1 kHz; approximately 250 kbps.
- Runtime derivative: `public/audio/aegean-sea-ambience.mp3`.
- Derivative SHA-256: `07df3082a1845885fb106ea7987e790b64ea88a8a165cc6073d8c8ac9fbc140f`.
- Derivative: 909,759 bytes; 29.048163 seconds; stereo MP3; 44.1 kHz.
- Processing: bit-identical copy with a runtime-specific filename. No trim, EQ, compression, denoising, channel, resampling, pitch, time, reverb, or synthetic processing. Runtime gain and ducking are non-destructive browser playback controls.

### Wooden ship on the sea — Mixkit

- Decision: **KEEP**, sailing passage only.
- Displayed title: `Wooden ship on the sea`.
- Creator/uploader: not listed on the Mixkit asset catalogue.
- Exact catalogue page: <https://mixkit.co/free-sound-effects/sea/> (the named asset is listed at 0:33).
- License pages: <https://mixkit.co/license/> and <https://mixkit.co/free-sound-effects/>.
- Download date: `2026-07-18`.
- Original filename: `mixkit-wooden-ship-on-the-sea-1187.wav`.
- Preserved source master: `assets/audio-sources/mixkit-wooden-ship-on-the-sea-1187.wav`.
- Source SHA-256: `eaed0d225a85db2dcc580c31fdf6b9d763c05bef9ac94506f0e18b86cb95e0ae`.
- Source: 5,882,904 bytes; 33.349546 seconds; stereo PCM WAV; 44.1 kHz; 16-bit.
- Runtime derivative: `public/audio/wooden-ship-sailing.wav`.
- Derivative SHA-256: `a4168c65bd64b64a539d09aa4d711f42545c5590bcd3c4f6c2eafa82e00af64f`.
- Derivative: 705,644 bytes; exactly 4.000000 seconds; stereo PCM WAV; 44.1 kHz; 16-bit.
- Processing: selected source seconds 8.000–12.000; linear gain `0.25` (`-12.04 dB`); 350 ms linear fade-in and fade-out; no EQ, dynamics, channel, resampling, pitch, time, reverb, denoising, or synthetic processing. Reproducible with `node scripts/prepare-soundscape.mjs`.

## Rejected or deferred candidates

### Divine coastal bird accent — derived from Sea waves with birds loop, Mixkit

- Decision: **KEEP only as one sparse, non-looping Divine accent**. The complete bird-bearing sea loop remains rejected.
- Original filename: `mixkit-sea-waves-with-birds-loop-1185.wav`.
- Preserved source master: `assets/audio-sources/mixkit-sea-waves-with-birds-loop-1185.wav`.
- Original SHA-256: `1be7aa7dcd7d8dd8fec5a30dc27c5acd9d6279a89fd98a31123d90db4035b900`.
- Original size/format: 6,710,558 bytes; 38.041451 seconds; stereo PCM WAV; 44.1 kHz; 16-bit.
- Runtime derivative: `public/audio/divine-coastal-bird.wav`.
- Derivative SHA-256: `613555391136062c0f6e09630350fb57b7c206ef2b5c119c9d6e5da31a54cebd`.
- Derivative: 264,644 bytes; 1.500000 seconds; stereo PCM WAV; 44.1 kHz; 16-bit.
- Processing: selected source seconds 31.700–33.200 around one isolated bird-dominant transient; linear gain `0.08` (`-21.94 dB`); 180 ms linear fade-in and fade-out; no EQ, denoising, channel, resampling, compression, pitch, time, reverb, or synthetic processing. The residual surf is reduced to a subordinate level rather than layered as a second ambience.
- Catalogue and license: the Mixkit sea catalogue and Sound Effects Free License pages above.

### Wind cold interior — Mixkit

- Decision: **REJECT** under the explicit stop-loss rule.
- Reason: its catalogue title and indoor/cold character conflict with the required open-air Aegean environment. It is not retained merely to form a third layer.
- Original filename: `mixkit-wind-cold-interior-1172.wav`.
- Original SHA-256: `8314049a2c1dbea623395ec1e5d5cd87b93c518645295a5883547a2dee310a48`.
- Original size/format: 6,944,240 bytes; 26.243991 seconds; stereo PCM WAV; 44.1 kHz; 24-bit.
- Catalogue page: <https://mixkit.co/free-sound-effects/wind/>.

### navette de métier à tisser.wav — Naïma / Freesound

- Decision: **KEEP** as the later optional Penelope-only loom texture; this does not revise the authored Gate 5A ritual or claim that Gate 5A originally contained audio.
- Creator: Naïma.
- Exact asset page: <https://freesound.org/people/Na%C3%AFma/sounds/510266/>.
- License: CC0 1.0 Universal, <https://creativecommons.org/publicdomain/zero/1.0/>.
- Download date: `2026-07-18`.
- Original filename: `510266__naima__navette-de-metier-a-tisser(1).wav` (downloaded file); displayed title `navette de métier à tisser.wav`.
- Preserved source master: `assets/audio-sources/510266__naima__navette-de-metier-a-tisser.wav`.
- Original SHA-256: `9e0386371b70aecd63c786333bf3572d001bdc1b708eb602544a1534fb869ef3`.
- Original size/format: 10,241,008 bytes; 58.051429 seconds; stereo PCM WAV; 44.1 kHz; 16-bit.
- Runtime derivative: `public/audio/penelope-loom.wav`.
- Derivative SHA-256: `5fba2f7e7585efdbcb73e68b60896f156f0418104f8a93d403ea8e9deb28ef33`.
- Derivative: 740,924 bytes; 4.200000 seconds; stereo PCM WAV; 44.1 kHz; 16-bit.
- Processing: selected source seconds 2.000–6.200, containing two principal shuttle movements and a restrained frame response; linear gain `0.6` (`-4.44 dB`); 250 ms linear fade-in and fade-out; no EQ, compression, denoising, channel, resampling, pitch, time, reverb, or synthetic processing.

## Evidence and runtime boundary

- Dated catalogue/license screenshots are stored under `docs/qa/soundscape-rights/`.
- Source masters are under `assets/audio-sources/` and are outside `public/`; they are never fetched by the application.
- Runtime derivatives are under `public/audio/` and are created only after a genuine user gesture.
- The initial page does not preload audio. Missing, blocked, slow, or corrupt media remains an ordinary silent state.
