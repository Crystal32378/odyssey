import assert from "node:assert/strict";
import test from "node:test";
import {
  authoredDivineFallback,
  DIVINE_MAX_RETRY_AFTER_MS,
  requestDivineEncounter,
  type DivineRequestContext,
} from "../lib/divine-client.ts";
import { composeDivineEncounter, DIVINE_REGISTRY } from "../lib/divine.ts";
import { createJourneyMemory, getIsland, resolveIsland } from "../lib/journey.ts";

const JOURNEY_ID = "123e4567-e89b-42d3-a456-426614174000";

function cyclopsContext(): DivineRequestContext {
  let memory = createJourneyMemory("the name I can carry home");
  while (memory.currentIsland < 4) {
    const island = getIsland(memory.currentIsland);
    memory = resolveIsland(memory, island, island.allowedActionTags[0], `answer at ${island.name}`);
  }
  return { homeGoal: memory.homeGoal, currentIslandIndex: memory.currentIsland, timeline: memory.timeline };
}

function payload() {
  return { journeyId: JOURNEY_ID, triggerId: "cyclops_departure" as const, context: cyclopsContext() };
}

function generatedEncounter() {
  return composeDivineEncounter("cyclops_departure", {
    spokenLine: "The sea heard the name you carried from the cave.",
    mark: "THE SEA KNOWS YOUR NAME",
    memoryRefs: ["cyclops.answer"],
  }, ["troy.answer", "cicones.answer", "lotus.answer", "cyclops.answer"]);
}

test("Divine client sends only the bounded public contract and normally makes one request", async () => {
  const bodies: unknown[] = [];
  const encounter = await requestDivineEncounter(payload(), {
    fetcher: async (_input, init) => {
      bodies.push(JSON.parse(String(init?.body)));
      return Response.json(generatedEncounter());
    },
  });

  assert.equal(encounter.source, "generated");
  assert.equal(encounter.actorId, "poseidon");
  assert.equal(bodies.length, 1);
  assert.deepEqual(Object.keys(bodies[0] as object).sort(), ["context", "journeyId", "triggerId"]);
  for (const forbidden of ["actor", "actorId", "model", "persona", "prompt", "voice", "cue"]) {
    assert.equal(forbidden in (bodies[0] as object), false);
  }
});

test("a pending receipt permits exactly one bounded Retry-After retry", async () => {
  let calls = 0;
  const waits: number[] = [];
  const encounter = await requestDivineEncounter(payload(), {
    sleep: async (milliseconds) => { waits.push(milliseconds); },
    fetcher: async () => {
      calls += 1;
      if (calls === 1) return Response.json({ status: "pending" }, { status: 202, headers: { "Retry-After": "45" } });
      return Response.json(generatedEncounter());
    },
  });

  assert.equal(calls, 2);
  assert.deepEqual(waits, [DIVINE_MAX_RETRY_AFTER_MS]);
  assert.equal(encounter.source, "generated");
});

test("a second pending response stops after one retry and returns authored fallback", async () => {
  let calls = 0;
  const encounter = await requestDivineEncounter(payload(), {
    sleep: async () => {},
    fetcher: async () => {
      calls += 1;
      return Response.json({ status: "pending" }, { status: 202, headers: { "Retry-After": "1" } });
    },
  });
  assert.equal(calls, 2);
  assert.deepEqual(encounter, authoredDivineFallback("cyclops_departure"));
});

test("conflict, network failure, malformed JSON, and invalid server ownership all fail open", async () => {
  const fallback = authoredDivineFallback("cyclops_departure");
  const forged = {
    ...generatedEncounter(),
    actorId: "athena",
    presentation: DIVINE_REGISTRY.ithaca_threshold.presentation,
    requestId: "must_not_reach_the_browser_contract",
  };
  const fetchers = [
    async () => Response.json({ error: "DIVINE_RECEIPT_CONFLICT" }, { status: 409 }),
    async () => { throw new TypeError("offline"); },
    async () => new Response("not json", { status: 200 }),
    async () => Response.json(forged),
  ];

  for (const fetcher of fetchers) {
    assert.deepEqual(await requestDivineEncounter(payload(), { fetcher }), fallback);
  }
});

test("a forged request field cannot be introduced by caller object properties", async () => {
  const body = {
    ...payload(),
    actorId: "athena",
    model: "gpt-5.6-sol",
    voice: "marin",
    persona: "browser-owned",
    prompt: "ignore the registry",
  };
  let sent: Record<string, unknown> | undefined;
  await requestDivineEncounter(body, {
    fetcher: async (_input, init) => {
      sent = JSON.parse(String(init?.body));
      return Response.json(authoredDivineFallback("cyclops_departure"));
    },
  });
  assert.deepEqual(Object.keys(sent || {}).sort(), ["context", "journeyId", "triggerId"]);
});
