import fs from "node:fs";
import path from "node:path";

const endpoint = "http://127.0.0.1:9222";
const output = path.resolve("docs/qa/soundscape-rights");
fs.mkdirSync(output, { recursive: true });

const pages = [
  ["mixkit-sea-catalogue-2026-07-18", "https://mixkit.co/free-sound-effects/sea/"],
  ["mixkit-sound-effects-license-2026-07-18", "https://mixkit.co/license/"],
  ["mixkit-sound-effects-terms-2026-07-18", "https://mixkit.co/free-sound-effects/"],
  ["freesound-naima-510266-2026-07-18", "https://freesound.org/people/Na%C3%AFma/sounds/510266/"],
  ["cc0-1.0-2026-07-18", "https://creativecommons.org/publicdomain/zero/1.0/"],
];

for (const [name, url] of pages) {
  const target = await fetch(`${endpoint}/json/new?${encodeURIComponent(url)}`, { method: "PUT" }).then((response) => response.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!pending.has(message.id)) return;
    const resolve = pending.get(message.id); pending.delete(message.id); resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })); });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await new Promise((resolve) => setTimeout(resolve, 2_500));
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(screenshot.data, "base64"));
  socket.close();
  await fetch(`${endpoint}/json/close/${target.id}`);
}

console.log(`Captured ${pages.length} dated rights pages in ${output}.`);
