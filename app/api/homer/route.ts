import { NextResponse } from "next/server";
import {
  HomerScene,
  HomerTransition,
  TROY_ALLOWED_ACTION_TAGS,
} from "../../../lib/journey";

const sceneSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    narrative: { type: "string", maxLength: 150 },
    question: { type: "string", maxLength: 120 },
  },
  required: ["narrative", "question"],
};

const transitionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    resolution: { type: "string", maxLength: 120 },
    action_tag: { type: "string", enum: TROY_ALLOWED_ACTION_TAGS },
    next_narrative: { type: "string", maxLength: 150 },
    next_question: { type: "string", maxLength: 120 },
  },
  required: ["resolution", "action_tag", "next_narrative", "next_question"],
};

const constitution = `You are Homer, the oral poet of Odyssey—not a coach, therapist, personality analyst, or chatbot.
Preserve the classical world. Troy is ash, bronze, ships, memory, victory, and loss. Never replace myth with modern objects.
Use only the player's Home Goal, exact words, and recorded timeline as evidence. Never claim hidden motives.
Write restrained, resonant English suitable for oral recitation. No praise, advice, fortune telling, or motivational language.
Narrative must be at most 150 characters. Questions must be concise. Return only the strict structured output.`;

function outputText(data: {
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}) {
  return data.output
    ?.find((item) => item.type === "message")
    ?.content?.find((item) => item.type === "output_text")?.text;
}

function isBoundedText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function isHomerScene(value: unknown): value is HomerScene {
  if (!value || typeof value !== "object") return false;
  const scene = value as Record<string, unknown>;
  return (
    Object.keys(scene).length === 2 &&
    isBoundedText(scene.narrative, 150) &&
    isBoundedText(scene.question, 120)
  );
}

function isHomerTransition(value: unknown): value is HomerTransition {
  if (!value || typeof value !== "object") return false;
  const transition = value as Record<string, unknown>;
  return (
    Object.keys(transition).length === 4 &&
    isBoundedText(transition.resolution, 120) &&
    typeof transition.action_tag === "string" &&
    TROY_ALLOWED_ACTION_TAGS.includes(
      transition.action_tag as (typeof TROY_ALLOWED_ACTION_TAGS)[number],
    ) &&
    isBoundedText(transition.next_narrative, 150) &&
    isBoundedText(transition.next_question, 120)
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "HOMER_KEY_MISSING", message: "The sea is silent." },
      { status: 503 },
    );
  }

  const body = await request.json();

  const phase = body?.phase === "resolve" ? "resolve" : "enter";
  const schema = phase === "resolve" ? transitionSchema : sceneSchema;
  const model = process.env.HOMER_MODEL || "gpt-5.5";
  const phaseInstruction =
    phase === "resolve"
      ? `Resolve Troy from the player's exact answer. Choose exactly one action_tag from: ${TROY_ALLOWED_ACTION_TAGS.join(", ")}.
UNRESOLVED is required when the words do not support another tag. Do not invent tags.
Then open Cicones with a new classical narrative and one question. The resolution must visibly echo the player's evidence without diagnosing them.`
      : "Open the journey at Troy. Transform the Home Goal into a classical metaphor, then ask one answerable question about what the traveler carries from the fallen city.";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: `${constitution}\n${phaseInstruction}` },
        { role: "user", content: JSON.stringify(body) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: phase === "resolve" ? "troy_transition" : "troy_scene",
          strict: true,
          schema,
        },
      },
      max_output_tokens: 500,
    }),
  });

  const requestId = response.headers.get("x-request-id");
  if (!response.ok) {
    const safeError = await response.json().catch(() => ({}));
    console.error("Homer API failure", {
      status: response.status,
      requestId,
      code: safeError?.error?.code,
      type: safeError?.error?.type,
    });
    return NextResponse.json(
      {
        error: "HOMER_UNAVAILABLE",
        message: "The sea has not answered. Your words are still here.",
        requestId,
      },
      { status: 502 },
    );
  }

  const data = await response.json();
  const raw = outputText(data);
  if (!raw) {
    console.error("Homer returned no structured text", { requestId });
    return NextResponse.json(
      { error: "HOMER_INVALID_OUTPUT", message: "Homer's voice was lost at sea.", requestId },
      { status: 502 },
    );
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const isValid = phase === "resolve" ? isHomerTransition(parsed) : isHomerScene(parsed);
    if (!isValid) throw new Error("Structured output failed runtime validation");
    return NextResponse.json(parsed);
  } catch {
    console.error("Homer returned invalid structured output", { requestId });
    return NextResponse.json(
      { error: "HOMER_INVALID_OUTPUT", message: "Homer's words arrived broken.", requestId },
      { status: 502 },
    );
  }
}
