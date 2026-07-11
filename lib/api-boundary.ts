const DEFAULT_MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const MAX_BUCKETS = 10_000;

// Per-isolate best-effort protection. Cloudflare-level enforcement must be verified in Preview.
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function readJsonWithLimit(request: Request, maxBytes = DEFAULT_MAX_BODY_BYTES): Promise<{ ok: true; value: unknown } | { ok: false; status: number; field: string }> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > maxBytes) return { ok: false, status: 413, field: "request body" };

  if (!request.body) return { ok: false, status: 400, field: "json" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel("request body too large").catch(() => undefined);
        return { ok: false, status: 413, field: "request body" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, field: "json" };
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const raw = new TextDecoder().decode(bytes);

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, status: 400, field: "json" };
  }
}

export function isRateLimited(request: Request, namespace: "homer" | "audio", now = Date.now()): boolean {
  pruneBuckets(now);
  const key = `${namespace}:${clientKey(request)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

export function resetRateLimitForTests() {
  buckets.clear();
}

function clientKey(request: Request) {
  return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

function pruneBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}
