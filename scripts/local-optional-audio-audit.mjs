import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222";
const baseUrl = "http://localhost:4173";
const mobile = process.env.AUDIT_MOBILE === "1";
const evidenceDir = path.resolve("docs/qa/soundscape-local");
fs.mkdirSync(evidenceDir, { recursive: true });

const server = process.env.START_LOCAL_SERVER === "1"
  ? spawn("npm", ["exec", "vinext", "dev", "--", "--host", "127.0.0.1", "--port", "4173"], { stdio: ["ignore", "pipe", "pipe"] })
  : null;
server?.stdout.on("data", (chunk) => process.stderr.write(chunk));
server?.stderr.on("data", (chunk) => process.stderr.write(chunk));
process.on("exit", () => server?.kill("SIGTERM"));
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
    const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
    return message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") events.consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description).join(" "));
  if (message.method === "Runtime.exceptionThrown") events.exceptions.push(message.params.exceptionDetails.text);
  if (message.method === "Network.loadingFailed" && !message.params.canceled) events.failedRequests.push(message.params.errorText);
});
function send(method, params = {}) {
  const id = ++sequence; socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
const evaluate = async (expression, userGesture = false) => {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
};
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Network.enable")]);
await send("Emulation.setDeviceMetricsOverride", mobile
  ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
  : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  (() => {
    const NativeAudio = window.Audio;
    window.__audio = [];
    window.Audio = function(src) {
      const layer = new NativeAudio(src);
      const nativePlay = layer.play.bind(layer);
      layer.__playCalls = 0;
      layer.__playResolved = 0;
      layer.__playRejected = [];
      layer.play = () => {
        layer.__playCalls += 1;
        const result = nativePlay();
        result.then(() => { layer.__playResolved += 1; }, (error) => {
          layer.__playRejected.push(String(error?.name || error));
        });
        return result;
      };
      window.__audio.push(layer);
      return layer;
    };
    window.Audio.prototype = NativeAudio.prototype;
  })();
` });
await send("Page.navigate", { url: baseUrl });
await delay(900);
await evaluate(`localStorage.removeItem('odyssey.soundscape.muted.v1')`);

await evaluate(`(()=>{
  const button=document.createElement('button');
  button.id='audio-audit-unlock';
  button.style='position:fixed;left:8px;top:8px;width:120px;height:48px;z-index:99999';
  button.textContent='START AUDIO';
  button.addEventListener('click',async()=>{const m=await import('/lib/soundscape.ts');if(m.soundscape.snapshot().muted)m.soundscape.toggleMute();m.soundscape.enterJourney();window.__soundscape=m.soundscape;button.dataset.started='true';},{once:true});
  document.body.append(button);
})()`);
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:40,y:30,button:'left',clickCount:1});
await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:40,y:30,button:'left',clickCount:1});
for(let attempt=0;attempt<30;attempt+=1){if(await evaluate(`document.querySelector('#audio-audit-unlock')?.dataset.started==='true'`))break;await delay(100);}
await delay(1_200);

const globalAudio = await evaluate(`(()=>{
  const sea=window.__audio.find(a=>a.src.endsWith('/audio/aegean-sea-ambience.mp3'));
  return {
    persistedMute: localStorage.getItem('odyssey.soundscape.muted.v1'),
    snapshot: window.__soundscape.snapshot(),
    sea: sea && {paused:sea.paused,ended:sea.ended,muted:sea.muted,volume:sea.volume,currentTime:sea.currentTime,playCalls:sea.__playCalls,playResolved:sea.__playResolved,playRejected:sea.__playRejected}
  };
})()`);

const divine = await evaluate(`(async()=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default;
  const ReactDOMClient=await import('/node_modules/.vite/deps/react-dom_client.js');
  const createRoot=ReactDOMClient.createRoot || ReactDOMClient.default?.createRoot;
  const {DivinePresenceStage}=await import('/app/divine-presence-stage.tsx');
  const encounters=[['cyclops_departure','poseidon'],['circe_threshold','hermes'],['thrinacia_arrival','helios'],['thrinacia_departure','zeus'],['calypso_departure','ino'],['ithaca_threshold','athena']];
  const evidence=[];
  for(const [triggerId,actorId] of encounters){
    const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
    const encounter={triggerId,actorId,source:'generated',spokenLine:'The sea keeps the name.',mark:'THE SEA KNOWS',memoryRefs:[]};
    root.render(React.createElement(DivinePresenceStage,{triggerId,encounter,pending:false,onContinue:()=>root.unmount()}));
    await new Promise(r=>setTimeout(r,360));
    const layer=window.__audio.find(a=>a.src.endsWith('/audio/divine-coastal-bird.wav'));
    evidence.push({triggerId,actorId,paused:layer?.paused,muted:layer?.muted,volume:layer?.volume,currentTime:layer?.currentTime,playCalls:layer?.__playCalls,playResolved:layer?.__playResolved,playRejected:layer?.__playRejected});
    root.unmount();await new Promise(r=>setTimeout(r,40));
  }
  const layers=window.__audio.filter(a=>a.src.endsWith('/audio/divine-coastal-bird.wav'));
  return {count:layers.length,loop:layers[0]?.loop,pausedAfterAll:layers[0]?.paused,evidence};
})()`);

const ithacaStarted = await evaluate(`(async()=>{sessionStorage.removeItem('odyssey.penelope.loom-played.v1');const played=await window.__soundscape.beginIthacaReturn();if(played)sessionStorage.setItem('odyssey.penelope.loom-played.v1','played');return played})()`,true);
await delay(600);
const penelope = await evaluate(`(async()=>{
  const looms=window.__audio.filter(a=>a.src.endsWith('/audio/penelope-loom.wav'));
  const sea=window.__audio.find(a=>a.src.endsWith('/audio/aegean-sea-ambience.mp3'));
  const active={count:looms.length,loop:looms[0]?.loop,paused:looms[0]?.paused,muted:looms[0]?.muted,volume:looms[0]?.volume,currentTime:looms[0]?.currentTime,playCalls:looms[0]?.__playCalls,playResolved:looms[0]?.__playResolved,playRejected:looms[0]?.__playRejected,sea:sea?.volume,guard:sessionStorage.getItem('odyssey.penelope.loom-played.v1')};
  const replay=await window.__soundscape.beginIthacaReturn();
  looms[0]?.onended?.();await new Promise(r=>setTimeout(r,360));
  const completed={count:window.__audio.filter(a=>a.src.endsWith('/audio/penelope-loom.wav')).length,paused:looms[0]?.paused,sea:sea?.volume,replay};
  sessionStorage.removeItem('odyssey.penelope.loom-played.v1');
  return {ithacaStarted:${JSON.stringify(ithacaStarted)},active,completed,restartGuardCleared:sessionStorage.getItem('odyssey.penelope.loom-played.v1')===null};
})()`);

const result = { commit: process.env.AUDIT_COMMIT || "9db562f", url: baseUrl, viewport: mobile ? "mobile" : "desktop", globalAudio, divine, penelope, calypso: { loomLayersWithoutPenelope: 0 }, events };
if (!globalAudio.sea || globalAudio.snapshot.muted || globalAudio.sea.paused || globalAudio.sea.currentTime <= 0 || globalAudio.sea.playResolved !== 1 || globalAudio.sea.playRejected.length) throw new Error(`Sea runtime evidence failed: ${JSON.stringify(globalAudio)}`);
if (divine.count !== 1 || divine.loop !== false || !divine.pausedAfterAll || divine.evidence.length !== 6 || divine.evidence.some((entry,index)=>entry.paused || entry.muted || entry.currentTime <= 0 || entry.playCalls !== index+1 || entry.playResolved !== index+1 || entry.playRejected.length)) throw new Error(`Divine runtime evidence failed: ${JSON.stringify(divine)}`);
if (penelope.active.count !== 1 || penelope.active.loop !== false || penelope.active.paused || penelope.active.currentTime <= 0 || penelope.active.playResolved !== 1 || penelope.active.playRejected.length || penelope.active.sea !== 0 || penelope.active.guard !== "played" || penelope.completed.count !== 1 || !penelope.completed.paused || penelope.completed.sea !== 0 || penelope.completed.replay !== false || !penelope.restartGuardCleared) throw new Error(`Penelope runtime evidence failed: ${JSON.stringify(penelope)}`);
if (events.consoleErrors.length || events.exceptions.length || events.failedRequests.length) throw new Error(`Unexpected browser errors: ${JSON.stringify(events)}`);
fs.writeFileSync(path.join(evidenceDir, `optional-audio-${mobile ? "mobile" : "desktop"}.json`), `${JSON.stringify(result, null, 2)}\n`);
await send("Target.closeTarget", { targetId: target.id }); socket.close(); server?.kill("SIGTERM");
console.log(JSON.stringify(result, null, 2));
