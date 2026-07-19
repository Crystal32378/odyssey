import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../app/penelope-recognition.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const asset = readFileSync(new URL("../public/characters/v1/penelope.webp", import.meta.url));

test("Penelope appears only for a completed Ithaca Journey Card and before Restart", () => {
  assert.match(page, /\{card && <JourneyCardResult card=\{card\} shoreCount=\{memory\.timeline\.length\}\/\>\}/);
  assert.match(page, /\{!calypso && card && <PenelopeRecognition\/>\}/);

  const cardIndex = page.indexOf("{card && <JourneyCardResult");
  const penelopeIndex = page.indexOf("{!calypso && card && <PenelopeRecognition/>");
  const restartIndex = page.indexOf('<button className="restart" onClick={reset}', penelopeIndex);
  assert.ok(cardIndex >= 0 && cardIndex < penelopeIndex, "Journey Card must complete before Penelope");
  assert.ok(penelopeIndex < restartIndex, "Penelope must precede the ending Restart control");
});

test("the recognition remains authored, stable, and independent of its optional later soundscape", () => {
  assert.match(component, /THE THREAD REMEMBERS/);
  assert.match(component, /I did not remain unchanged while you crossed the sea\. Do not ask whether I waited; show me what in you has truly returned\./);
  assert.match(component, /onError=\{\(\) => setImageFailed\(true\)\}/);

  const imageStart = component.indexOf("{!imageFailed ? (");
  const imageEnd = component.indexOf(") : null}", imageStart);
  const lineIndex = component.indexOf("I did not remain unchanged");
  assert.ok(imageStart >= 0 && imageEnd < lineIndex, "canonical text must not depend on image success");
  assert.doesNotMatch(component, /gpt-5\.6-luna|AI-generated|fetch\(|<audio|new Audio|button/);
  assert.doesNotMatch(component, /soundscape|PENELOPE_LOOM_SESSION_KEY|playPenelopeLoom/, "Penelope mount is visual and cannot trigger or replay audio");
  assert.match(page, /memory\?\.ending !== "ithaca"[\s\S]*soundscape\?\.enterIthacaEnding\(\)/);
  assert.match(page, /memory\.ending === "ithaca"[\s\S]*soundscape\?\.playIthacaLoom\(\)/);
  assert.match(page, /sessionStorage\.getItem\(PENELOPE_LOOM_SESSION_KEY\) === "played"/);
  assert.match(page, /if \(!played\) return;[\s\S]*sessionStorage\.setItem\(PENELOPE_LOOM_SESSION_KEY, "played"\)/);
  assert.match(page, /sessionStorage\.removeItem\(PENELOPE_LOOM_SESSION_KEY\)/);
});

test("the optimized approved asset is the recorded immutable derivative", () => {
  assert.equal(asset.length, 56_142);
  assert.equal(createHash("sha256").update(asset).digest("hex"), "508423e62dc72d27ef1269aad79c5f3a461e63f8cd30c074ad5173b4e1a8638c");
  assert.equal(asset.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(asset.subarray(8, 12).toString("ascii"), "WEBP");
});

test("desktop, mobile, image-failure, and reduced-motion presentation remain complete", () => {
  assert.match(styles, /\.penelope-recognition \{[^}]*width: calc\(100% \+ 2 \* max\(6vw,24px\)\);[^}]*overflow: hidden;[^}]*border: 0;[^}]*box-shadow: none;/);
  assert.match(styles, /\.penelope-image-failed \{[^}]*background:/);
  assert.match(styles, /@media \(max-width: 850px\)[\s\S]*\.penelope-recognition \{[^}]*min-height: 100svh;/);
  assert.match(styles, /\.ending-ithaca \.penelope-recognition ~ \.restart \{[^}]*background: transparent;/);
  assert.match(styles, /\.ending-ithaca \.penelope-recognition ~ \.restart:focus-visible \{[^}]*outline:/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.penelope-recognition img, \.penelope-copy \{[^}]*animation: none !important;/);
});
