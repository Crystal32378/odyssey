const DEFAULT_MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const buckets = new Map<string, { count: number; resetAt: number }>();

export async function readJsonWithLimit(request: Request, maxBytes = DEFAULT_MAX_BODY_BYTES): Promise<{ ok: true; value: unknown } | { ok: false; status: number; field: string }> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && Number(declaredLength) > maxBytes) return { ok: false, status: 413, field: "request body" };

  const raw = await request.text().catch(() => "");
  if (new TextEncoder().encode(raw).length > maxBytes) return { ok: false, status: 413, field: "request body" };

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, status: 400, field: "json" };
  }
}

export function isRateLimited(request: Request, now = Date.now()): boolean {
  const key = clientKey(request);
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
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
