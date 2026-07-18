import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("opening title keeps its exact copy and uses a restrained balanced measure", () => {
  assert.match(page, /<h1>The map remembers your name\.<\/h1>/);
  assert.match(styles, /\.voyage-loading h1 \{[^}]*max-width: min\(1180px,90vw\)[^}]*font-size: clamp\(2\.5rem,5\.2vw,5\.3rem\)[^}]*line-height: 1\.04[^}]*text-wrap: balance/);
});
