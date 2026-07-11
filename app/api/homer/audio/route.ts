import { NextResponse } from "next/server.js";
import { Buffer } from "node:buffer";
import { request as httpsRequest } from "node:https";
import { isRateLimited, readJsonWithLimit } from "../../../../lib/api-boundary.ts";

interface SpeechResponse {
  status: number;
  requestId: string | null;
  contentType: string | null;
  body: Buffer;
}

function createSpeech(apiKey: string, payload: object): Promise<SpeechResponse> {
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const request = httpsRequest(
      "https://api.openai.com/v1/audio/speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          const requestId = response.headers["x-request-id"];
          const contentType = response.headers["content-type"];
          resolve({
            status: response.statusCode ?? 500,
            requestId: Array.isArray(requestId) ? requestId[0] : requestId ?? null,
            contentType: Array.isArray(contentType) ? contentType[0] : contentType ?? null,
            body: Buffer.concat(chunks),
          });
        });
      },
    );

    request.on("error", reject);
    request.end(body);
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AUDIO_KEY_MISSING" }, { status: 503 });
  }

  if (isRateLimited(request, "audio")) {
    return NextResponse.json({ error: "AUDIO_RATE_LIMITED" }, { status: 429 });
  }

  const parsedBody = await readJsonWithLimit(request, 2_000);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: "AUDIO_INPUT_INVALID" }, { status: parsedBody.status });
  }

  const body = parsedBody.value as Record<string, unknown>;
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 600) {
    return NextResponse.json({ error: "AUDIO_INPUT_INVALID" }, { status: 400 });
  }

  const response = await createSpeech(apiKey, {
    model: process.env.HOMER_AUDIO_MODEL || "gpt-4o-mini-tts",
    voice: "onyx",
    input: text,
    instructions:
      "Homer does not perform. He remembers. Recite as an ancient witness who has carried this story through countless generations. Use a deep, weathered, restrained tone. Speak very slowly, with long deliberate pauses between thoughts. Never rush, never sound eager, theatrical, conversational, motivational, or like a movie trailer. Let silence carry as much weight as the words. Add no words and preserve the text exactly.",
    response_format: "mp3",
  });

  if (response.status < 200 || response.status >= 300) {
    let safeError: { error?: { code?: string; type?: string; message?: string } } = {};
    try {
      safeError = JSON.parse(response.body.toString("utf8") || "{}");
    } catch {
      // Keep upstream error bodies out of user-facing output.
    }
    console.error("Homer audio failure", {
      status: response.status,
      requestId: response.requestId,
      code: safeError?.error?.code,
      type: safeError?.error?.type,
    });
    return NextResponse.json(
      { error: "AUDIO_UNAVAILABLE", requestId: response.requestId },
      { status: 502 },
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": response.contentType || "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
