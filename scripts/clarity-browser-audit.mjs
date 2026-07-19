import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9223";
const baseUrl = "http://localhost:4173";
const mobile = process.env.AUDIT_MOBILE === "1";
const label = mobile ? "mobile" : "desktop";
const evidenceDir = path.resolve("docs/qa/clarity-local");
fs.mkdirSync(evidenceDir, { recursive: true });

const server = spawn("npm", ["exec", "vinext", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], { stdio: ["ignore", "pipe", "pipe"] });
server.stdout.on("data", (chunk) => process.stderr.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));
process.on("exit", () => server.kill("SIGTERM"));
for (let attempt = 0; attempt < 60; attempt += 1) {
  try { if ((await fetch(baseUrl)).ok) break; } catch { /* compiling */ }
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (attempt === 59) throw new Error("Local Odyssey server did not become ready.");
}

const target = await fetch(`${endpoint}/json/new?${encodeURIComponent(baseUrl)}`, { method: "PUT" }).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let sequence = 0;
const pending = new Map();
const events = { consoleErrors: [], exceptions: [], failedRequests: [] };
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const request = pending.get(message.id); pending.delete(message.id);
    return message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") events.consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description).join(" "));
  if (message.method === "Runtime.exceptionThrown") events.exceptions.push(message.params.exceptionDetails.text);
  if (message.method === "Network.loadingFailed" && !message.params.canceled) events.failedRequests.push(message.params.errorText);
});
function send(method, params = {}) {
  const id = ++sequence; socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const screenshot = async (name) => {
  const capture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(path.join(evidenceDir, `${label}-${name}.png`), Buffer.from(capture.data, "base64"));
};

await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
await send("Emulation.setDeviceMetricsOverride", mobile
  ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
  : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: baseUrl });
await delay(900);
const landing = await evaluate(`(()=>{
  const input=document.querySelector('#ithaca-goal');const primary=document.querySelector('.world-form button');
  return {title:document.querySelector('.world-entry h1')?.textContent,prompt:document.querySelector('.world-prompt')?.textContent,label:document.querySelector('label[for="ithaca-goal"]')?.textContent,placeholder:input?.getAttribute('placeholder'),accessibleName:input?.getAttribute('aria-label'),primary:primary?.textContent,stakes:document.querySelector('.world-stakes')?.textContent,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,primaryHeight:primary?.getBoundingClientRect().height,inputHeight:input?.getBoundingClientRect().height};
})()`);
await screenshot("landing");

await evaluate(`(()=>{sessionStorage.setItem('odyssey.fourteen-islands.v1',JSON.stringify({goal:'home',phase:'island',memory:{homeGoal:'home',stats:{metis:0,hubris:0,nostos:0,trust:0,temptation:0,compassion:0,hope:0},timeline:[],currentIsland:0},scene:{narrative:'Troy is behind you; the first shore waits.',question:'What will you carry from the city of ash?'},answer:'',resolution:'',summary:null,card:null}));location.reload()})()`);
await delay(3000);
if (mobile) {
  await evaluate(`document.querySelector('.response-band')?.scrollIntoView({block:'center'})`);
  await delay(250);
}
const island = await evaluate(`(()=>{
  const primary=document.querySelector('.answer-shore');const restart=document.querySelector('.new-voyage');const focusables=[...document.querySelectorAll('button,input,textarea,[tabindex]:not([tabindex="-1"])')];
  return {label:document.querySelector('.choice-label')?.textContent,question:document.querySelector('.island-question')?.textContent,primary:primary?.textContent,note:document.querySelector('.answer-memory-note')?.textContent,restart:restart?.textContent,primaryHeight:primary?.getBoundingClientRect().height,restartHeight:restart?.getBoundingClientRect().height,primaryBeforeRestart:focusables.indexOf(primary)<focusables.indexOf(restart),width:innerWidth,scrollWidth:document.documentElement.scrollWidth};
})()`);
await screenshot("ordinary-island");

const result = { baseCommit: "114cbf1", viewport: label, landing, island, events };
if (landing.title !== "SPEAK YOUR ITHACA" || landing.primary !== "BEGIN THE JOURNEY" || landing.scrollWidth > landing.width || landing.primaryHeight < 44 || landing.inputHeight < 44) throw new Error(`Landing clarity failed: ${JSON.stringify(landing)}`);
if (island.label !== "THE SHORE ASKS" || island.primary !== "CONTINUE THE JOURNEY" || island.restart !== "Restart journey" || island.note !== "Your words will be remembered." || island.primaryHeight < 44 || island.restartHeight < 44 || !island.primaryBeforeRestart || island.scrollWidth > island.width) throw new Error(`Island clarity failed: ${JSON.stringify(island)}`);
if (events.consoleErrors.length || events.exceptions.length || events.failedRequests.length) throw new Error(`Browser errors: ${JSON.stringify(events)}`);
fs.writeFileSync(path.join(evidenceDir, `${label}.json`), `${JSON.stringify(result, null, 2)}\n`);
await send("Target.closeTarget", { targetId: target.id }); socket.close(); server.kill("SIGTERM");
console.log(JSON.stringify(result, null, 2));
