import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("the opening explains Ithaca without adding another title layer", () => {
  assert.match(page, /<section className="world-entry"><h1>SPEAK YOUR ITHACA<\/h1>/);
  assert.match(page, /What are you trying to return to—<br\/>a person, a place, a promise, or a part of yourself\?/);
  assert.match(page, /<label htmlFor="ithaca-goal">YOUR ITHACA<\/label>/);
  assert.match(page, /id="ithaca-goal" aria-label="Your Ithaca"/);
  assert.match(page, /placeholder="For example: my family, my courage, a life that feels like mine…"/);
  assert.match(page, /<button onClick=\{begin\}>BEGIN THE JOURNEY<\/button>/);
  assert.match(page, /Your words will travel with you—and return to you at the end\./);
  assert.doesNotMatch(page, /BEGIN YOUR ODYSSEY|Speak your Ithaca…|Your return goal/);
});

test("ordinary shores use a clear primary action while Ithaca keeps its final action", () => {
  assert.match(page, /<p className="choice-label">THE SHORE ASKS<\/p>/);
  assert.match(page, /island\.id === "ithaca" \? "COMPLETE THE RETURN" : "CONTINUE THE JOURNEY"/);
  assert.match(page, /island\.id !== "ithaca" && <small className="answer-memory-note">Your words will be remembered\.<\/small>/);
  assert.doesNotMatch(page, /ANSWER THE SHORE/);
  assert.match(page, /REVEAL MY JOURNEY/);
});

test("Restart remains after the primary action in natural focus order and both targets meet 44px", () => {
  const primary = page.indexOf('<button className="answer-shore"');
  const restart = page.indexOf('<button className="new-voyage"', primary);
  assert.ok(primary >= 0 && restart > primary);
  assert.match(page, />Restart journey<\/button>/);
  assert.match(styles, /\.answer-shore \{[^}]*min-height: 44px;/);
  assert.match(styles, /\.new-voyage \{[^}]*min-height: 44px;/);
  assert.match(styles, /\.journey-system-actions \{[^}]*border-top:/);
});

test("the clarity pass does not alter the frozen Soundscape transition", () => {
  assert.match(page, /soundscape\?\.enterIthacaEnding\(\)/);
  assert.match(page, /soundscape\?\.playIthacaLoom\(\)/);
  assert.match(page, /<button className="restart" onClick=\{generate\}>REVEAL MY JOURNEY<\/button>/);
});
