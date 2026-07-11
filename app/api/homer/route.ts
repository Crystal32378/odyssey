import { NextResponse } from "next/server";
import { getIsland, HomerScene, HomerTransition, ISLANDS, JourneyCard, JourneySummary } from "../../../lib/journey";

const sceneSchema = objectSchema({ narrative: { type: "string", maxLength: 150 }, question: { type: "string", maxLength: 120 } });
const transitionSchema = (tags: readonly string[]) => objectSchema({
  resolution: { type: "string", maxLength: 120 }, action_tag: { type: "string", enum: tags }, next_narrative: { type: "string", maxLength: 150 }, next_question: { type: "string", maxLength: 120 },
});
const summarySchema = objectSchema({ summary: { type: "string", maxLength: 1400 } });
const cardSchema = objectSchema({ title: bounded(90), strength: bounded(220), temptation: bounded(220), turningPoint: bounded(280), ithaca: bounded(280), quote: bounded(220) });

function bounded(maxLength: number) { return { type: "string", maxLength }; }
function objectSchema(properties: Record<string, unknown>) { return { type: "object", additionalProperties: false, properties, required: Object.keys(properties) }; }
function outputText(data: { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> }) { return data.output?.find((item) => item.type === "message")?.content?.find((item) => item.type === "output_text")?.text; }
function text(value: unknown, max: number): value is string { return typeof value === "string" && value.length > 0 && value.length <= max; }
function validScene(value: unknown): value is HomerScene { const v = value as Record<string, unknown>; return !!v && Object.keys(v).length === 2 && text(v.narrative, 150) && text(v.question, 120); }
function validTransition(value: unknown, tags: readonly string[]): value is HomerTransition { const v = value as Record<string, unknown>; return !!v && Object.keys(v).length === 4 && text(v.resolution, 120) && typeof v.action_tag === "string" && tags.includes(v.action_tag) && text(v.next_narrative, 150) && text(v.next_question, 120); }
function validSummary(value: unknown): value is JourneySummary { const v = value as Record<string, unknown>; return !!v && Object.keys(v).length === 1 && text(v.summary, 1400); }
function validCard(value: unknown): value is JourneyCard { const v = value as Record<string, unknown>; return !!v && Object.keys(v).length === 6 && text(v.title, 90) && text(v.strength, 220) && text(v.temptation, 220) && text(v.turningPoint, 280) && text(v.ithaca, 280) && text(v.quote, 220); }

const constitution = `You are Homer, the oral poet of Odyssey—not a coach, therapist, personality analyst, or chatbot.
Preserve the classical world. Never replace myth with modern objects. The player is the hero; you are the witness.
Use only the Home Goal, exact player words, and timeline as evidence. Never claim hidden motives.
Write restrained, resonant English suitable for oral recitation. No praise, advice, fortune telling, or motivational language.
Narratives are at most 150 characters and questions at most 120 characters. Return only strict structured output.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "HOMER_KEY_MISSING", message: "The sea is silent." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const phases = ["enter", "resolve", "summary", "card"] as const;
  if (!body || !phases.includes(body.phase)) return invalidInput("phase");
  const phase = body.phase as (typeof phases)[number];
  const islandIndex = body.islandIndex;
  if ((phase === "enter" || phase === "resolve") && (!Number.isInteger(islandIndex) || islandIndex < 0 || islandIndex >= ISLANDS.length)) return invalidInput("islandIndex");
  if (!validJourneyInput(body, phase)) return invalidInput("journey payload");
  const current = getIsland(islandIndex ?? 0) || ISLANDS[0];
  const next = getIsland(islandIndex + 1);
  let schema: ReturnType<typeof objectSchema>;
  let name: string;
  let instruction: string;
  let validate: (value: unknown) => boolean;

  if (phase === "summary") {
    schema = summarySchema; name = "journey_summary"; validate = validSummary;
    instruction = `Write a conclusive journey summary in 140–220 words. Cite at least three different named islands and concrete recorded choices. If ending is Calypso, honor it as a valid ending without pretending Ithaca was reached.`;
  } else if (phase === "card") {
    schema = cardSchema; name = "journey_card"; validate = validCard;
    instruction = `Create a concise Journey Card grounded in the supplied stats, summary, and timeline. Mention at least three islands across the fields. "ithaca" means the traveler's true object of return; for a Calypso ending, clearly preserve that unresolved distance. Return quote as plain text without surrounding quotation marks.`;
  } else if (phase === "resolve") {
    schema = transitionSchema(current.allowedActionTags); name = "island_transition"; validate = (v) => validTransition(v, current.allowedActionTags);
    const nextContext = next ? `Next shore: ${next.name}\nNext epithet: ${next.epithet}\nNext mythic ground: ${next.myth}` : "This is Ithaca. Write a brief closing threshold in the next fields.";
    instruction = `Resolve ${current.name} from the player's exact answer. Mythic ground: ${current.myth}. Choose exactly one action_tag from ${current.allowedActionTags.join(", ")}; use UNRESOLVED if evidence is insufficient. Echo evidence without diagnosis. ${nextContext}`;
  } else {
    schema = sceneSchema; name = "island_scene"; validate = validScene;
    instruction = `Open ${current.name} (${current.epithet}). Mythic ground: ${current.myth}. Transform the Home Goal and recorded journey into a classical metaphor, visibly recalling prior evidence when available, then ask one answerable question.`;
  }

  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: process.env.HOMER_MODEL || "gpt-5.5", reasoning: { effort: "low" }, input: [{ role: "system", content: `${constitution}\n${instruction}` }, { role: "user", content: JSON.stringify(body) }], text: { format: { type: "json_schema", name, strict: true, schema } }, max_output_tokens: phase === "summary" || phase === "card" ? 900 : 500 }) });
  const requestId = response.headers.get("x-request-id");
  if (!response.ok) { const safe = await response.json().catch(() => ({})); console.error("Homer API failure", { status: response.status, requestId, code: safe?.error?.code }); return NextResponse.json({ error: "HOMER_UNAVAILABLE", message: "The sea has not answered. Your words are still here.", requestId }, { status: 502 }); }
  const raw = outputText(await response.json());
  if (!raw) return NextResponse.json({ error: "HOMER_INVALID_OUTPUT", message: "Homer's voice was lost at sea.", requestId }, { status: 502 });
  try { const parsed = JSON.parse(raw); if (!validate(parsed)) throw new Error(); return NextResponse.json(parsed); }
  catch { console.error("Homer returned invalid structured output", { requestId, phase }); return NextResponse.json({ error: "HOMER_INVALID_OUTPUT", message: "Homer's words arrived broken.", requestId }, { status: 502 }); }
}

function invalidInput(field: string) { return NextResponse.json({ error: "HOMER_INPUT_INVALID", message: `Invalid ${field}.` }, { status: 400 }); }
function validJourneyInput(body: Record<string, unknown>, phase: string) {
  const homeGoal = phase === "summary" || phase === "card" ? (body.memory as Record<string, unknown> | undefined)?.homeGoal : body.homeGoal;
  if (typeof homeGoal !== "string" || !homeGoal.trim() || homeGoal.length > 300) return false;
  if (phase === "resolve" && (typeof body.playerInput !== "string" || !body.playerInput.trim() || body.playerInput.length > 1000)) return false;
  const timeline = phase === "summary" || phase === "card" ? (body.memory as Record<string, unknown> | undefined)?.timeline : body.timeline;
  if (!Array.isArray(timeline) || timeline.length > 14) return false;
  return timeline.every((entry) => entry && typeof entry === "object" && typeof (entry as Record<string, unknown>).quote === "string" && ((entry as Record<string, unknown>).quote as string).length <= 1000);
}
