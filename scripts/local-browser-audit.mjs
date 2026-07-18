import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222";
const baseUrl = process.env.ODYSSEY_URL || "http://localhost:4173";
const evidenceDir = path.resolve("docs/qa/soundscape-local");
const mobileAudit = process.env.AUDIT_MOBILE === "1";
const reducedMotionAudit = process.env.REDUCED_MOTION === "1";
fs.mkdirSync(evidenceDir, { recursive: true });

let localServer;
if (process.env.START_LOCAL_SERVER === "1") {
  localServer = spawn("npm", ["exec", "vinext", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], { stdio: ["ignore", "pipe", "pipe"] });
  localServer.stdout.on("data", (chunk) => process.stderr.write(chunk));
  localServer.stderr.on("data", (chunk) => process.stderr.write(chunk));
  process.on("exit", () => localServer?.kill("SIGTERM"));
  process.on("uncaughtException", (error) => { localServer?.kill("SIGTERM"); console.error(error); process.exit(1); });
  process.on("unhandledRejection", (error) => { localServer?.kill("SIGTERM"); console.error(error); process.exit(1); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(baseUrl); if (response.ok) break; } catch { /* The local server is still compiling. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (attempt === 59) throw new Error("Local Odyssey server did not become ready.");
  }
}

for (const existing of await fetch(`${endpoint}/json/list`).then((response) => response.json())) {
  if (existing.type === "page" && existing.url.includes("localhost:4173")) {
    await fetch(`${endpoint}/json/close/${existing.id}`);
  }
}
const target = await fetch(`${endpoint}/json/new?${encodeURIComponent(baseUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });

let sequence = 0;
const pending = new Map();
const listeners = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    return;
  }
  for (const listener of listeners.get(message.method) || []) listener(message.params);
});

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function on(method, listener) {
  const values = listeners.get(method) || [];
  values.push(listener);
  listeners.set(method, values);
  return () => listeners.set(method, values.filter((value) => value !== listener));
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
async function typeText(text) {
  for (const character of text) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: character, text: character, unmodifiedText: character });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: character });
  }
}

const consoleErrors = [];
const exceptions = [];
const failedRequests = [];
on("Runtime.consoleAPICalled", (event) => { if (event.type === "error") consoleErrors.push(event.args.map((arg) => arg.value || arg.description).join(" ")); });
on("Runtime.exceptionThrown", (event) => exceptions.push(event.exceptionDetails.text));
on("Network.loadingFailed", (event) => { if (!event.canceled) failedRequests.push(`${event.errorText}: ${event.requestId}`); });

const voiceBody = fs.readFileSync("public/audio/wooden-ship-sailing.wav").toString("base64");
let holdEntryRequest = null;
on("Fetch.requestPaused", async (event) => {
  const url = event.request.url;
  if (url.endsWith("/api/homer/audio")) {
    await send("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "audio/wav" }], body: voiceBody });
    return;
  }
  if (url.endsWith("/api/homer")) {
    const payload = JSON.parse(event.request.postData || "{}");
    if (payload.phase === "enter" && holdEntryRequest) {
      holdEntryRequest(event.requestId);
      holdEntryRequest = null;
      return;
    }
    const body = payload.phase === "resolve"
      ? { resolution: "The answer remains aboard.", action_tag: "UNRESOLVED", next_narrative: "The next shore gathers from the mist.", next_question: "What will you carry onward?" }
      : { narrative: "The first shore waits beneath an old sky.", question: "What do you carry toward home?" };
    await send("Fetch.fulfillRequest", { requestId: event.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify(body)).toString("base64") });
    return;
  }
  await send("Fetch.continueRequest", { requestId: event.requestId });
});

await Promise.all([
  send("Page.enable"), send("Runtime.enable"), send("Network.enable"),
  send("Fetch.enable", { patterns: [{ urlPattern: "*/api/homer*", requestStage: "Request" }] }),
]);
if (reducedMotionAudit) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  (() => {
    const NativeAudio = window.Audio;
    window.__odysseyAudio = [];
    window.Audio = function(source) {
      const layer = new NativeAudio(source);
      window.__odysseyAudio.push(layer);
      return layer;
    };
    window.Audio.prototype = NativeAudio.prototype;
  })();
` });

async function screenshot(name) {
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(path.join(evidenceDir, `${name}.png`), Buffer.from(result.data, "base64"));
}

async function loadingScreenshot(name, width, height) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await send("Page.navigate", { url: baseUrl });
  await delay(900);
  await evaluate(`sessionStorage.clear()`);
  await send("Page.reload");
  await delay(700);
  const request = new Promise((resolve) => { holdEntryRequest = resolve; });
  await evaluate(`document.querySelector('input').focus()`);
  await typeText("home");
  await delay(300);
  await evaluate(`document.querySelector('.world-form button').click()`);
  const requestId = await request;
  await delay(80);
  await screenshot(name);
  const metrics = await evaluate(`({scrollWidth:document.documentElement.scrollWidth,innerWidth,heading:document.querySelector('.voyage-loading h1')?.textContent})`);
  if (metrics.heading !== "The map remembers your name." || metrics.scrollWidth > metrics.innerWidth) throw new Error(`${name} title/overflow check failed: ${JSON.stringify(metrics)}`);
  const body = Buffer.from(JSON.stringify({ narrative: "The first shore waits beneath an old sky.", question: "What do you carry toward home?" })).toString("base64");
  await send("Fetch.fulfillRequest", { requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body });
  await delay(400);
}

if (process.env.SKIP_TITLE !== "1") {
  for (const viewport of [
    ["opening-1440", 1440, 900], ["opening-1280", 1280, 800], ["opening-tablet", 820, 1180], ["opening-mobile", 390, 844],
  ]) await loadingScreenshot(...viewport);
}
process.stderr.write("Title viewport evidence complete.\n");

await send("Emulation.setDeviceMetricsOverride", mobileAudit
  ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
  : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: baseUrl });
await delay(900);
await evaluate(`sessionStorage.clear(); localStorage.removeItem('odyssey.soundscape.muted.v1')`);
await send("Page.reload");
await delay(700);
if (reducedMotionAudit) {
  const before = await evaluate(`(() => { const control=document.querySelector('.soundscape-control'); const rect=control.getBoundingClientRect(); return {matches:matchMedia('(prefers-reduced-motion: reduce)').matches,label:control.textContent,width:rect.width,height:rect.height,overflow:document.documentElement.scrollWidth>innerWidth}; })()`);
  await evaluate(`document.querySelector('.soundscape-control').click()`);
  const after = await evaluate(`({label:document.querySelector('.soundscape-control').textContent,pressed:document.querySelector('.soundscape-control').getAttribute('aria-pressed')})`);
  await screenshot(mobileAudit ? "soundscape-reduced-motion-mobile" : "soundscape-reduced-motion-desktop");
  const reducedResult = { consoleErrors, exceptions, failedRequests, before, after };
  if (!before.matches || before.width < 44 || before.height < 44 || before.overflow || after.label !== "UNMUTE" || after.pressed !== "true") throw new Error(`Reduced-motion audit failed: ${JSON.stringify(reducedResult)}`);
  fs.writeFileSync(path.join(evidenceDir, `chrome-reduced-motion-${mobileAudit ? "mobile" : "desktop"}-audit.json`), `${JSON.stringify(reducedResult, null, 2)}\n`);
  await send("Target.closeTarget", { targetId: target.id }); socket.close(); localServer?.kill("SIGTERM");
  console.log(JSON.stringify(reducedResult, null, 2));
  process.exit(0);
}
if (await evaluate(`window.__odysseyAudio.length`) !== 0) throw new Error("Audio existed before a user gesture.");
await evaluate(`document.querySelector('input').focus()`);
await typeText("home");
await delay(300);
await evaluate(`document.querySelector('.world-form button').click()`);
await delay(700);
const entered = await evaluate(`(() => { const rect=document.querySelector('.soundscape-control').getBoundingClientRect(); return {layers:window.__odysseyAudio.map(a=>({src:a.src,loop:a.loop,paused:a.paused,volume:a.volume})),label:document.querySelector('.soundscape-control')?.textContent,control:{width:rect.width,height:rect.height},island:Boolean(document.querySelector('.island-layout')),overflow:document.documentElement.scrollWidth>innerWidth}; })()`);
if (!entered.island || entered.control.width < 44 || entered.control.height < 44 || entered.layers.length !== 1 || !entered.layers[0].src.endsWith("/audio/aegean-sea-ambience.mp3") || !entered.layers[0].loop || entered.overflow) throw new Error(`Entry audit failed: ${JSON.stringify(entered)}`);
process.stderr.write("Gesture unlock evidence complete.\n");

await evaluate(`document.querySelector('.soundscape-control').click()`);
await delay(80);
const muted = await evaluate(`({label:document.querySelector('.soundscape-control').textContent,pressed:document.querySelector('.soundscape-control').getAttribute('aria-pressed'),paused:window.__odysseyAudio[0].paused,stored:localStorage.getItem('odyssey.soundscape.muted.v1')})`);
if (muted.label !== "UNMUTE" || muted.pressed !== "true" || muted.stored !== "true") throw new Error(`Mute audit failed: ${JSON.stringify(muted)}`);
await evaluate(`document.querySelector('.soundscape-control').click()`);
await delay(380);

await evaluate(`document.querySelector('textarea').focus()`);
await typeText("I continue.");
await delay(120);
await evaluate(`document.querySelector('.answer-shore').click()`);
await delay(250);
await screenshot(mobileAudit ? "soundscape-voyage-mobile" : "soundscape-voyage-desktop");
const sailing = await evaluate(`({layers:window.__odysseyAudio.map(a=>({src:a.src,loop:a.loop,paused:a.paused})),stage:Boolean(document.querySelector('.voyage-stage')),overflow:document.documentElement.scrollWidth>innerWidth})`);
if (sailing.layers.length !== 2 || !sailing.layers[1].src.endsWith("/audio/wooden-ship-sailing.wav") || sailing.layers[1].loop || !sailing.stage || sailing.overflow) throw new Error(`Sailing audit failed: ${JSON.stringify(sailing)}`);
process.stderr.write("Sailing and mute evidence complete.\n");
await delay(4_100);
if (!(await evaluate(`window.__odysseyAudio[1].paused`))) throw new Error("Sailing texture escaped the four-second boundary.");

await delay(300);
await evaluate(`document.querySelector('.homer-audio-controls button').click()`);
process.stderr.write("Homer request started.\n");
await delay(650);
const ducked = await evaluate(`({count:window.__odysseyAudio.length,sea:window.__odysseyAudio[0].volume,voicePaused:window.__odysseyAudio.at(-1).paused})`);
if (ducked.count !== 3 || ducked.sea > 0.04 || ducked.voicePaused) throw new Error(`Voice ducking failed: ${JSON.stringify(ducked)}`);
await evaluate(`document.querySelector('.homer-audio-controls button').click()`);
await delay(380);
const restored = await evaluate(`window.__odysseyAudio[0].volume`);
if (restored < 0.12) throw new Error(`Ambience did not recover after pause: ${restored}`);
process.stderr.write("Homer ducking evidence complete.\n");

const result = {
  consoleErrors,
  exceptions,
  failedRequests,
  entry: entered,
  muted,
  sailing,
  ducked,
  restored,
};
fs.writeFileSync(path.join(evidenceDir, mobileAudit ? "chrome-mobile-audit.json" : "chrome-audit.json"), `${JSON.stringify(result, null, 2)}\n`);
if (consoleErrors.length || exceptions.length || failedRequests.length) throw new Error(`Browser errors found: ${JSON.stringify(result)}`);
await send("Target.closeTarget", { targetId: target.id });
socket.close();
localServer?.kill("SIGTERM");
console.log(JSON.stringify(result, null, 2));
