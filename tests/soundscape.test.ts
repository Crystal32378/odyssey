import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  AMBIENCE_VOLUME,
  DIVINE_BIRD_SOURCE,
  DIVINE_BIRD_VOLUME,
  DUCKED_VOLUME,
  SAILING_DURATION_MS,
  SEA_AMBIENCE_SOURCE,
  SAILING_SOURCE,
  SOUNDSCAPE_PREFERENCE_KEY,
  SoundscapeController,
  SHIP_VOLUME,
  SOUNDSCAPE_FADE_MS,
} from "../lib/soundscape.ts";

class MockAudio {
  currentTime = 0;
  loop = false;
  muted = false;
  preload = "auto";
  volume = 1;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  playCount = 0;
  pauseCount = 0;
  rejectPlayback = false;
  async play() { this.playCount += 1; if (this.rejectPlayback) throw new Error("blocked"); }
  pause() { this.pauseCount += 1; }
}

function setup(initialMuted = false) {
  const layers = new Map<string, MockAudio>();
  const preferences = new Map<string, string>();
  if (initialMuted) preferences.set(SOUNDSCAPE_PREFERENCE_KEY, "true");
  const controller = new SoundscapeController(
    (source) => { const layer = new MockAudio(); layers.set(source, layer); return layer; },
    { getItem: (key) => preferences.get(key) || null, setItem: (key, value) => { preferences.set(key, value); } },
  );
  return { controller, layers, preferences };
}

const settleFade = () => new Promise((resolve) => setTimeout(resolve, 330));

test("initial load is silent and the first journey gesture starts one restrained loop", async () => {
  const { controller, layers } = setup();
  assert.deepEqual(controller.snapshot(), { muted: false, active: false, voiceActive: false, sailing: false });
  assert.equal(layers.size, 0);
  controller.enterJourney();
  await settleFade();
  const sea = layers.get(SEA_AMBIENCE_SOURCE)!;
  assert.equal(sea.playCount, 1);
  assert.equal(sea.loop, true);
  assert.equal(sea.preload, "none");
  assert.equal(sea.volume, AMBIENCE_VOLUME);
  controller.enterJourney();
  assert.equal(layers.size, 1, "repeated gestures reuse the ambience instance");
});

test("mute is persistent, controls every layer, and Restart never creates duplicates", async () => {
  const { controller, layers, preferences } = setup();
  controller.enterJourney();
  controller.startSailing();
  controller.toggleMute();
  assert.equal(controller.snapshot().muted, true);
  assert.equal(preferences.get(SOUNDSCAPE_PREFERENCE_KEY), "true");
  assert.equal(controller.snapshot().sailing, false);
  assert.ok(layers.get(SEA_AMBIENCE_SOURCE)!.pauseCount >= 1);
  assert.ok(layers.get(SAILING_SOURCE)!.pauseCount >= 1);
  controller.leaveJourney();
  controller.enterJourney();
  assert.equal(layers.get(SEA_AMBIENCE_SOURCE)!.playCount, 1, "muted Restart remains silent");
  const restored = setup(true).controller;
  assert.equal(restored.snapshot().muted, true);
});

test("Homer voice ducking restores after pause, completion, interruption, or failure", async () => {
  const { controller, layers } = setup();
  controller.enterJourney();
  await settleFade();
  const sea = layers.get(SEA_AMBIENCE_SOURCE)!;
  const full = sea.volume;
  controller.setVoiceActive(true);
  await settleFade();
  assert.ok(sea.volume < full);
  assert.equal(sea.volume, DUCKED_VOLUME);
  controller.setVoiceActive(false);
  await settleFade();
  assert.equal(sea.volume, full);
  controller.setVoiceActive(true);
  controller.leaveJourney();
  assert.equal(controller.snapshot().voiceActive, false);
  assert.ok(sea.pauseCount >= 1);
});

test("sailing texture is one non-looping four-second layer and rapid replay cannot stack", () => {
  const { controller, layers } = setup();
  controller.enterJourney();
  controller.startSailing();
  const ship = layers.get(SAILING_SOURCE)!;
  assert.equal(ship.loop, false);
  assert.equal(ship.volume, SHIP_VOLUME);
  assert.equal(controller.snapshot().sailing, true);
  controller.startSailing();
  assert.equal(layers.size, 2, "one sea and one ship instance are reused");
  assert.equal(ship.playCount, 2);
  assert.ok(ship.pauseCount >= 1);
  controller.stopSailing();
  assert.equal(controller.snapshot().sailing, false);
  assert.equal(ship.currentTime, 0);
  assert.equal(SAILING_DURATION_MS, 4_000);
});

test("the accepted corrective mix keeps voice first and uses a smooth short fade", () => {
  assert.equal(AMBIENCE_VOLUME, 0.095);
  assert.equal(SHIP_VOLUME, 0.075);
  assert.equal(DUCKED_VOLUME, 0.015);
  assert.equal(SOUNDSCAPE_FADE_MS, 280);
  assert.ok(DUCKED_VOLUME < AMBIENCE_VOLUME * 0.2);
  assert.ok(SHIP_VOLUME < AMBIENCE_VOLUME);
});

test("Divine accent is sparse, non-looping, non-stacking, muted, and fail-open", () => {
  const { controller, layers } = setup();
  controller.enterJourney();
  controller.playDivineAccent();
  const bird = layers.get(DIVINE_BIRD_SOURCE)!;
  assert.equal(bird.loop, false);
  assert.equal(bird.volume, DIVINE_BIRD_VOLUME);
  controller.playDivineAccent();
  assert.equal(layers.size, 2, "one ambience and one bird instance are reused");
  assert.ok(bird.pauseCount >= 1);
  controller.toggleMute();
  assert.ok(bird.pauseCount >= 2);
  assert.equal(bird.currentTime, 0);
});

test("blocked and failed assets fail open without changing product state", async () => {
  const layers: MockAudio[] = [];
  const controller = new SoundscapeController(() => { const layer = new MockAudio(); layer.rejectPlayback = true; layers.push(layer); return layer; });
  controller.enterJourney();
  controller.startSailing();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(controller.snapshot().active, true);
  assert.equal(controller.snapshot().sailing, false);
  assert.ok(layers.every((layer) => layer.pauseCount >= 1));
});

test("wiring keeps Soundscape outside Journey authority and preserves labelled accessibility", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const control = readFileSync(new URL("../app/soundscape-control.tsx", import.meta.url), "utf8");
  const controller = readFileSync(new URL("../lib/soundscape.ts", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(page, /if \(!reducedMotion\) soundscape\?\.startSailing\(\)/);
  assert.match(page, /soundscape\?\.setVoiceActive\(true\)/);
  assert.match(page, /soundscape\?\.leaveJourney\(\)/);
  assert.doesNotMatch(controller, /from ["']\.\/journey|setMemory|setPhase|resolveIsland|generateEnding/);
  assert.match(control, /aria-pressed=\{snapshot\.muted\}/);
  assert.match(control, /aria-label=\{snapshot\.muted \? "Unmute journey soundscape" : "Mute journey soundscape"\}/);
  assert.match(control, />\{snapshot\.muted \? "UNMUTE" : "MUTE"\}<\/button>/);
  assert.doesNotMatch(control, /prefers-reduced-motion/);
  assert.match(styles, /\.soundscape-control \{[^}]*min-width: 68px;[^}]*min-height: 44px;/);
});
