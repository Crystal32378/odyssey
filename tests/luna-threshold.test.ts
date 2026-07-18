import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../app/luna-threshold.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const assets = [
  ["wine.webp", 13_082, "9439fe9d4b6faa8abc8fabc5750c6e9bf6d2883c794cb956e912755a037475cf"],
  ["tail.webp", 7_770, "d70770d23874693583f513f4212b0492ca8be8cafe4398f2c954383015abc0ea"],
  ["veil.webp", 6_902, "f1daaf9d0dd5dadc293a44f5d21f122e712767ffc4ce4d93b709142696d7e4b0"],
] as const;

test("threshold requires an explicit player gesture and never shows provisional character text", () => {
  assert.match(component, /!pending && !outcome \? \(/);
  assert.match(component, /className="luna-action" type="button" onClick=\{onOpen\}/);
  assert.doesNotMatch(component, /tabIndex=\{[1-9]/);
  assert.match(component, /pending \? \([\s\S]*THE THRESHOLD GATHERS/);
  assert.match(component, /outcome \? \([\s\S]*<blockquote/);
  assert.doesNotMatch(component, /registry\.fallback|setTimeout|fetch\(|new Audio|<audio/);
});

test("pending, generated, fallback, failed, and recovered states are machine-distinguishable", () => {
  assert.match(component, /data-luna-state=\{presentationState\}/);
  assert.match(component, /data-luna-source=\{source\}/);
  assert.match(component, /data-luna-outcome=\{outcome\?\.state \|\| "none"\}/);
  assert.match(component, /"recovered"/);
  assert.match(component, /"pending"/);
  assert.match(component, /outcome\?\.state === "generated"/);
  assert.match(component, /outcome\?\.state === "authored_fallback"/);
  assert.match(component, /outcome\?\.state === "failed"/);
  assert.match(component, /WORDS SHAPED BY GPT-5\.6 LUNA/);
  assert.match(component, /THE AUTHORED WORDS REMAIN/);
});

test("keyboard, screen-reader, scene-native motion, mobile, and reduced-motion contracts are present", () => {
  assert.match(component, /aria-labelledby=/);
  assert.match(component, /aria-label=\{!outcome/);
  assert.match(component, /aria-describedby=/);
  assert.match(component, /role="status" aria-live="polite" aria-busy=\{pending\}/);
  assert.doesNotMatch(component, /<img|imageSrc|setImageFailed/);
  assert.match(component, /className="luna-scene-effect"/);
  assert.match(component, /CONTINUE TO THE SHORE/);
  assert.match(styles, /\.luna-action:focus-visible,[^{]*\.luna-continue:focus-visible \{[^}]*outline:/);
  assert.match(styles, /@media \(min-width: 851px\) and \(max-height: 760px\)[\s\S]*\.narrative-has-luna \{[^}]*grid-template-rows:/);
  assert.match(styles, /@media \(max-width: 850px\)[\s\S]*\.journey-luna-active \.island-art \{[^}]*position: fixed/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.luna-scene-effect span, \.luna-scene-effect i, \.luna-pending \{[^}]*animation: none !important/);
});

test("invitation hierarchy preserves a labeled Homer control and scene-specific reading zones", () => {
  assert.match(styles, /data-luna-state="threshold"[\s\S]*\.homer-audio-controls > button/);
  assert.match(styles, /data-luna-state="threshold"[^}]*\) > \.homer-witness \{ animation-name: luna-homer-recede-soft/);
  assert.match(styles, /\.luna-threshold:not\(\[data-luna-state="threshold"\]\)[^}]*> :not\(\.luna-threshold\) \{ animation-name: luna-homer-recede-deep; animation-delay: 0s/);
  assert.match(styles, /@keyframes luna-homer-recede-soft \{ from \{ opacity: 1;/);
  assert.match(styles, /@keyframes luna-homer-recede-deep \{ from \{ opacity: \.22;[^}]*\} to \{ opacity: 0;/);
  assert.match(styles, /\.luna-material-pearl \.luna-threshold-copy:has\(\.luna-utterance\) \{ top: 55%/);
  assert.match(styles, /\.luna-material-veil \.luna-threshold-copy:has\(\.luna-utterance\)[^}]*right: 5vw; top: 54%/);
  assert.match(styles, /\.luna-material-wine \.luna-scene-effect i \{ display: none; \}/);
  assert.doesNotMatch(styles, /\.luna-material-wine \.luna-scene-effect span \{[^}]*border-(?:top|radius)/);
});

test("approved optimized threshold assets remain exact", () => {
  for (const [name, bytes, hash] of assets) {
    const asset = readFileSync(new URL(`../public/luna/v1/${name}`, import.meta.url));
    assert.equal(asset.length, bytes, name);
    assert.equal(createHash("sha256").update(asset).digest("hex"), hash, name);
    assert.equal(asset.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(asset.subarray(8, 12).toString("ascii"), "WEBP");
  }
});
