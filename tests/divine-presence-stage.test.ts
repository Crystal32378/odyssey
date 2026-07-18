import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/divine-presence-stage.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function cssColor(selector: string, property: string) {
  const start = styles.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `missing ${selector}`);
  const end = styles.indexOf("}", start);
  const declaration = styles.slice(start, end).match(new RegExp(`${property}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(declaration, `missing ${property} in ${selector}`);
  return declaration[1];
}

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrastRatio(foreground: string, background: string) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("Divine Presence shows one oracle only after the encounter reaches a terminal state", () => {
  assert.match(source, /const terminalEncounter = pending \? null : encounter/);
  assert.doesNotMatch(source, /registry\.fallback\.spokenLine/);
  assert.match(source, /THE SIGN GATHERS/);
  assert.match(source, /Authored fallback/);
  assert.match(source, /\{terminalEncounter \? \([\s\S]*<blockquote/);
  assert.match(source, /\{terminalEncounter \? \([\s\S]*<button type="button" onClick=\{\(\) => \{ soundscape\?\.stopDivineAccent\(\); onContinue\(\); \}\}>/);
  assert.match(source, /!terminalEncounter \|\| event\.key !== "Escape"/);
  assert.match(styles, /\.divine-oracle-frame \{ min-height:/);
  assert.match(styles, /\.divine-presence-actions \{[^}]*divine-actions-enter/);
});

test("Divine Presence is a focused full-page interstitial without unsupported modal semantics", () => {
  const mainStart = source.indexOf("<main");
  const mainOpening = source.slice(mainStart, source.indexOf(">", mainStart) + 1);
  assert.match(source, /stageRef\.current\?\.focus\(\)/);
  assert.match(source, /<main[\s\S]*aria-labelledby="divine-presence-name"/);
  assert.match(source, /: "divine-presence-status"/);
  assert.match(source, /id="divine-presence-status"[\s\S]*role="status"/);
  assert.doesNotMatch(source, /role="dialog"|aria-modal=/);
  assert.doesNotMatch(mainOpening, /aria-busy=/);
  assert.match(source, /className="divine-oracle-frame" role="status" aria-live="polite" aria-busy=\{!terminalEncounter\}/);
});

test("every small Divine label meets WCAG AA contrast", () => {
  const copyBackground = cssColor(".divine-copy", "background");
  const portraitBackground = cssColor(".divine-portrait", "background");
  const checks = [
    [cssColor(".divine-portrait figcaption span", "color"), portraitBackground],
    [cssColor(".divine-portrait figcaption", "color"), portraitBackground],
    [cssColor(".divine-kicker", "color"), copyBackground],
    [cssColor(".divine-heading p", "color"), copyBackground],
    [cssColor(".divine-provenance strong", "color"), copyBackground],
    [cssColor(".divine-provenance p", "color"), copyBackground],
    [cssColor(".divine-presence-actions small", "color"), copyBackground],
    [cssColor(".divine-presence-actions button", "color"), cssColor(".divine-presence-actions button", "background")],
  ];
  for (const [foreground, background] of checks) {
    assert.ok(contrastRatio(foreground, background) >= 4.5, `${foreground} on ${background} must meet 4.5:1`);
  }
});

test("Divine Presence fetches one async-decoded image only after the stage mounts", () => {
  assert.equal(source.match(/<img\b/g)?.length, 1);
  assert.match(source, /src=\{imageSrc\}/);
  assert.match(source, /decoding="async"/);
  assert.doesNotMatch(source, /rel="preload"|fetchPriority|new Image\(|<audio\b|new Audio\(/);
  assert.match(styles, /\.divine-portrait img \{[^}]*object-fit: contain;/);
});

test("Divine Presence remains complete on mobile and under reduced motion", () => {
  assert.match(styles, /@media \(min-width: 851px\) and \(max-height: 760px\)[\s\S]*\.divine-copy \{[^}]*overflow-y: auto;/);
  assert.match(styles, /@media \(min-width: 851px\) and \(max-height: 760px\)[\s\S]*\.divine-portrait \{[^}]*height: 100svh;[^}]*min-height: 100svh;/);
  assert.match(styles, /@media \(min-width: 851px\) and \(max-height: 760px\)[\s\S]*\.divine-presence-actions \{[^}]*padding-bottom: 24px;/);
  assert.match(styles, /\.divine-presence-actions button:focus-visible \{[^}]*outline:/);
  assert.match(styles, /grid-template-areas: "portrait" "copy";/);
  assert.match(styles, /\.divine-portrait \{ min-height: 55svh; height: 55svh; \}/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.divine-kicker/);
  assert.match(styles, /\.divine-portrait img \{ transition: none !important; \}/);
});

test("a settled Divine Presence owns one fail-open coastal accent for its mounted lifetime", () => {
  assert.match(source, /if \(!terminalEncounter\) return;[\s\S]*soundscape\?\.playDivineAccent\(\)/);
  assert.match(source, /return \(\) => soundscape\?\.stopDivineAccent\(\)/);
  assert.match(source, /soundscape\?\.stopDivineAccent\(\); onContinue\(\)/);
  assert.doesNotMatch(source, /new Audio|<audio/);
});

test("the shared one-shot accent is eligible for all six canonical Divine encounters", () => {
  const divine = readFileSync(new URL("../lib/divine.ts", import.meta.url), "utf8");
  for (const actor of ["poseidon", "athena", "hermes", "helios", "ino", "zeus"]) {
    assert.match(divine, new RegExp(`actorId: "${actor}"`));
  }
  assert.match(source, /if \(!terminalEncounter\) return;[\s\S]*soundscape\?\.playDivineAccent\(\)/);
});
