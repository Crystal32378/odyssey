import assert from "node:assert/strict";
import test from "node:test";
import { requestHomer } from "../lib/homer-client.ts";

test("Homer client returns structured JSON without changing the request count", async () => {
  let calls = 0;
  const result = await requestHomer<{ title: string }>({ phase: "card" }, {
    fetcher: async () => {
      calls += 1;
      return new Response(JSON.stringify({ title: "The Sea-Road Home" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { title: "The Sea-Road Home" });
});

test("Homer client aborts a stalled ending request", async () => {
  let aborted = false;
  const fetcher = (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => {
      aborted = true;
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    }, { once: true });
  });

  await assert.rejects(
    requestHomer({ phase: "card" }, { fetcher, timeoutMs: 5 }),
    /longer than the tide allows/,
  );
  assert.equal(aborted, true);
});
