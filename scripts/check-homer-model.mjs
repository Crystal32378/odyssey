import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const cacheDir = path.join(root, ".odyssey-cache");
const cachePath = path.join(cacheDir, "homer-model-check.json");
const today = new Date().toISOString().slice(0, 10);

function loadEnvFile() {
  const target = path.join(root, ".env.local");
  if (!fs.existsSync(target)) return;
  for (const line of fs.readFileSync(target, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

async function checkModel(model) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      input: "Return the Odyssey Homer model readiness check.",
      store: false,
      reasoning: { effort: "none" },
      text: {
        format: {
          type: "json_schema",
          name: "homer_readiness",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: { ready: { type: "boolean" } },
            required: ["ready"],
          },
        },
      },
      max_output_tokens: 32,
    }),
  });
  const result = await response.json().catch(() => ({}));
  return {
    model,
    available: response.ok,
    status: response.status,
    code: result?.error?.code || null,
    requestId: response.headers.get("x-request-id"),
  };
}

export function requiredModelSet(environment = process.env) {
  return [...new Set([
    environment.HOMER_MODEL || "gpt-5.6-sol",
    environment.DIVINE_MODEL || "gpt-5.6-terra",
    environment.LUNA_MODEL,
    environment.HOMER_MODEL_CANDIDATE,
    environment.HOMER_MODEL_FALLBACK || "gpt-5.5",
  ].filter(Boolean))].sort();
}

export function modelSetCacheMatches(cached, date, models) {
  return cached?.date === date
    && Array.isArray(cached.models)
    && cached.models.length === models.length
    && cached.models.every((model, index) => model === models[index]);
}

export async function runPreflight() {
  loadEnvFile();
  if (!process.env.OPENAI_API_KEY) {
    console.log("Odyssey model preflight: OPENAI_API_KEY is missing.");
    return;
  }

  const models = requiredModelSet();
  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (modelSetCacheMatches(cached, today, models)) {
      console.log(`Odyssey model preflight: already checked ${today} for ${models.join(", ")}.`);
      return;
    }
  }

  const results = [];
  for (const model of models) {
    try {
      results.push(await checkModel(model));
    } catch {
      results.push({ model, available: false, status: 0, code: "NETWORK_ERROR", requestId: null });
    }
  }

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    cachePath,
    JSON.stringify({ date: today, models, checkedAt: new Date().toISOString(), results }, null, 2),
    { mode: 0o600 },
  );

  for (const result of results) {
    console.log(
      `Odyssey model preflight: ${result.model} ${result.available ? "available" : `unavailable (${result.code || result.status})`}`,
    );
  }
  console.log("Odyssey model preflight is non-blocking; model promotion is always manual.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await runPreflight();
}
