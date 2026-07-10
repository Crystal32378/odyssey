import fs from "node:fs";
import path from "node:path";

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

loadEnvFile();
if (!process.env.OPENAI_API_KEY) {
  console.log("Homer preflight: OPENAI_API_KEY is missing.");
  process.exit(0);
}

if (fs.existsSync(cachePath)) {
  const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  if (cached.date === today) {
    console.log(`Homer preflight: already checked ${today}.`);
    process.exit(0);
  }
}

const active = process.env.HOMER_MODEL || "gpt-5.5";
const candidate = process.env.HOMER_MODEL_CANDIDATE || "gpt-5.6-sol";
const fallback = process.env.HOMER_MODEL_FALLBACK || "gpt-5.5";
const results = [];

for (const model of new Set([active, candidate, fallback])) {
  try {
    results.push(await checkModel(model));
  } catch {
    results.push({ model, available: false, status: 0, code: "NETWORK_ERROR", requestId: null });
  }
}

fs.mkdirSync(cacheDir, { recursive: true });
fs.writeFileSync(
  cachePath,
  JSON.stringify({ date: today, checkedAt: new Date().toISOString(), results }, null, 2),
  { mode: 0o600 },
);

for (const result of results) {
  console.log(
    `Homer preflight: ${result.model} ${result.available ? "available" : `unavailable (${result.code || result.status})`}`,
  );
}
console.log("Homer preflight is non-blocking; model promotion is always manual.");
