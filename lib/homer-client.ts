export const ENDING_REQUEST_TIMEOUT_MS = 40_000;

type HomerFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface RequestHomerOptions {
  timeoutMs?: number;
  fetcher?: HomerFetch;
}

export async function requestHomer<T>(payload: object, options: RequestHomerOptions = {}): Promise<T> {
  const controller = options.timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), options.timeoutMs) : null;
  const fetcher = options.fetcher || fetch;

  try {
    const response = await fetcher("/api/homer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      ...(controller ? { signal: controller.signal } : {}),
    });
    const data = await response.json() as { message?: string; requestId?: string };
    if (!response.ok) {
      const error = new Error(data.message || "The sea has not answered.");
      Object.assign(error, { requestId: data.requestId });
      throw error;
    }
    return data as T;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Homer is taking longer than the tide allows.");
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
