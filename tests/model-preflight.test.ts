import assert from "node:assert/strict";
import test from "node:test";
import { LUNA_MODEL } from "../lib/server/luna-handler.ts";
import {
  LUNA_RUNTIME_MODEL,
  modelSetCacheMatches,
  requiredModelSet,
} from "../scripts/check-homer-model.mjs";

test("model preflight key contains the complete requested model set", () => {
  assert.deepEqual(requiredModelSet({
    HOMER_MODEL: "gpt-5.6-sol",
    DIVINE_MODEL: "gpt-5.6-terra",
    LUNA_MODEL: "gpt-5.6-luna",
    HOMER_MODEL_FALLBACK: "gpt-5.5",
  }), ["gpt-5.5", "gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-terra"]);
  assert.deepEqual(requiredModelSet({}), ["gpt-5.5", "gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-terra"]);
});

test("a same-day cache cannot hide a newly requested model", () => {
  const date = "2026-07-16";
  const cached = { date, models: ["gpt-5.5", "gpt-5.6-sol", "gpt-5.6-terra"] };
  assert.equal(modelSetCacheMatches(cached, date, cached.models), true);
  assert.equal(modelSetCacheMatches(cached, date, [...cached.models, "gpt-5.6-luna"]), false);
  assert.equal(modelSetCacheMatches({ date }, date, cached.models), false);
});

test("Luna preflight cannot test a model different from the fixed runtime model", () => {
  assert.equal(LUNA_RUNTIME_MODEL, LUNA_MODEL);
  assert.throws(
    () => requiredModelSet({ LUNA_MODEL: "gpt-5.6-luna-candidate" }),
    /must match the server runtime model \(gpt-5\.6-luna\)/,
  );
});
