import assert from "node:assert/strict";
import test from "node:test";
import {
  authoredDivineFallback,
  DIVINE_ATTEMPT_TIMEOUT_MS,
  DIVINE_DEFAULT_RETRY_AFTER_MS,
  DIVINE_MAX_RETRY_AFTER_MS,
  DIVINE_MIN_PENDING_MS,
  DIVINE_MIN_RETRY_AFTER_MS,
  DIVINE_PRESENTATION_TIMEOUT_MS,
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

function fakeClock(start = 0) {
  let current = start;
  const waits: number[] = [];
  return {
    now: () => current,
    sleep: async (milliseconds: number) => {
      waits.push(milliseconds);
      current += milliseconds;
    },
    advance: (milliseconds: number) => { current += milliseconds; },
    waits,
  };
}

test("Divine client sends only the bounded public contract and normally makes one request", async () => {
  assert.equal(DIVINE_PRESENTATION_TIMEOUT_MS, 10_000);
  assert.equal(DIVINE_ATTEMPT_TIMEOUT_MS, 7_000);
  const bodies: unknown[] = [];
  const clock = fakeClock();
  const encounter = await requestDivineEncounter(payload(), {
    now: clock.now,
    sleep: clock.sleep,
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
  assert.deepEqual(clock.waits, [DIVINE_MIN_PENDING_MS]);
});

test("pending receipts are polled with one payload until the terminal encounter arrives", async () => {
  let calls = 0;
  const bodies: string[] = [];
  const clock = fakeClock();
  const encounter = await requestDivineEncounter(payload(), {
    now: clock.now,
    sleep: clock.sleep,
    minimumPendingMs: 0,
    fetcher: async (_input, init) => {
      calls += 1;
      bodies.push(String(init?.body));
      if (calls < 3) return Response.json({ status: "pending", retryAfterMs: 750 }, { status: 202 });
      return Response.json(generatedEncounter());
    },
  });

  assert.equal(calls, 3);
  assert.deepEqual(clock.waits, [750, 750]);
  assert.equal(new Set(bodies).size, 1);
  assert.equal(encounter.source, "generated");
});

test("persistent pending uses one ten-second presentation deadline without a hot loop", async () => {
  let calls = 0;
  const clock = fakeClock();
  const encounter = await requestDivineEncounter(payload(), {
    now: clock.now,
    sleep: clock.sleep,
    minimumPendingMs: 0,
    fetcher: async () => {
      calls += 1;
      return Response.json({ status: "pending", retryAfterMs: 750 }, { status: 202 });
    },
  });

  assert.ok(calls > 2);
  assert.ok(calls <= Math.ceil(DIVINE_PRESENTATION_TIMEOUT_MS / DIVINE_MIN_RETRY_AFTER_MS) + 1);
  assert.equal(clock.waits.reduce((total, wait) => total + wait, 0), DIVINE_PRESENTATION_TIMEOUT_MS);
  assert.ok(clock.waits.every((wait) => wait >= DIVINE_MIN_RETRY_AFTER_MS && wait <= DIVINE_MAX_RETRY_AFTER_MS));
  assert.deepEqual(encounter, authoredDivineFallback("cyclops_departure"));
});

test("pending retry hints are bounded and invalid hints use the stable default", async () => {
  const cases = [
    [{ status: "pending" }, {}, DIVINE_DEFAULT_RETRY_AFTER_MS],
    [{ status: "pending", retryAfterMs: "soon" }, {}, DIVINE_DEFAULT_RETRY_AFTER_MS],
    [{ status: "pending", retryAfterMs: 999_999 }, {}, DIVINE_MAX_RETRY_AFTER_MS],
    [{ status: "pending", retryAfterMs: 1 }, {}, DIVINE_MIN_RETRY_AFTER_MS],
    [{ status: "pending" }, { "Retry-After": "45" }, DIVINE_MAX_RETRY_AFTER_MS],
  ] as const;

  for (const [pendingBody, headers, expectedWait] of cases) {
    let calls = 0;
    const clock = fakeClock();
    const encounter = await requestDivineEncounter(payload(), {
      now: clock.now,
      sleep: clock.sleep,
      minimumPendingMs: 0,
      fetcher: async () => {
        calls += 1;
        return calls === 1
          ? Response.json(pendingBody, { status: 202, headers })
          : Response.json(generatedEncounter());
      },
    });
    assert.deepEqual(clock.waits, [expectedWait]);
    assert.equal(encounter.source, "generated");
  }
});

test("a generated response arriving after the shared deadline cannot replace fallback", async () => {
  const clock = fakeClock();
  const encounter = await requestDivineEncounter(payload(), {
    now: clock.now,
    sleep: clock.sleep,
    minimumPendingMs: 0,
    fetcher: async () => {
      clock.advance(DIVINE_PRESENTATION_TIMEOUT_MS + 1);
      return Response.json(generatedEncounter());
    },
  });
  assert.deepEqual(encounter, authoredDivineFallback("cyclops_departure"));
});

test("the client cannot start another attempt after consecutive clock reads cross the deadline", async () => {
  const readings = [0, DIVINE_PRESENTATION_TIMEOUT_MS - 1, DIVINE_PRESENTATION_TIMEOUT_MS + 1];
  let last = readings.at(-1) || 0;
  let calls = 0;
  const encounter = await requestDivineEncounter(payload(), {
    now: () => {
      const next = readings.shift();
      if (typeof next === "number") last = next;
      return last;
    },
    sleep: async () => {},
    minimumPendingMs: 0,
    fetcher: async () => {
      calls += 1;
      return Response.json(generatedEncounter());
    },
  });
  assert.equal(calls, 0);
  assert.deepEqual(encounter, authoredDivineFallback("cyclops_departure"));
});

test("response body parsing remains inside the shared presentation deadline", async () => {
  const clock = fakeClock();
  const encounter = await requestDivineEncounter(payload(), {
    now: clock.now,
    sleep: clock.sleep,
    minimumPendingMs: 0,
    fetcher: async () => ({
      status: 200,
      headers: new Headers(),
      json: async () => {
        clock.advance(DIVINE_PRESENTATION_TIMEOUT_MS + 1);
        return generatedEncounter();
      },
    }) as unknown as Response,
  });
  assert.deepEqual(encounter, authoredDivineFallback("cyclops_departure"));
});

test("a body that never settles cannot hold the pending stage indefinitely", async () => {
  const startedAt = Date.now();
  const encounter = await requestDivineEncounter(payload(), {
    timeoutMs: 20,
    minimumPendingMs: 0,
    fetcher: async () => ({
      status: 200,
      headers: new Headers(),
      json: async () => new Promise<never>(() => {}),
    }) as Response,
  });
  assert.deepEqual(encounter, authoredDivineFallback("cyclops_departure"));
  assert.ok(Date.now() - startedAt < 500);
});

test("a server terminal authored fallback remains the only visible oracle", async () => {
  let calls = 0;
  const clock = fakeClock();
  const encounter = await requestDivineEncounter(payload(), {
    now: clock.now,
    sleep: clock.sleep,
    minimumPendingMs: 0,
    fetcher: async () => {
      calls += 1;
      return calls === 1
        ? Response.json({ status: "pending", retryAfterMs: 250 }, { status: 202 })
        : Response.json(authoredDivineFallback("cyclops_departure"));
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
    const clock = fakeClock();
    assert.deepEqual(await requestDivineEncounter(payload(), {
      fetcher,
      now: clock.now,
      sleep: clock.sleep,
      minimumPendingMs: 0,
    }), fallback);
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
    minimumPendingMs: 0,
    fetcher: async (_input, init) => {
      sent = JSON.parse(String(init?.body));
      return Response.json(authoredDivineFallback("cyclops_departure"));
    },
  });
  assert.deepEqual(Object.keys(sent || {}).sort(), ["context", "journeyId", "triggerId"]);
});
