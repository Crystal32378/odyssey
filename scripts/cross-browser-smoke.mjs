import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const baseUrl = "http://localhost:4173";
const evidenceDir = path.resolve("docs/qa/soundscape-local");
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

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve(output) : reject(new Error(`${command} exited ${code}: ${output}`)));
  });
}

const firefox = "/Applications/Firefox.app/Contents/MacOS/firefox";
await run(firefox, ["--headless", "--no-remote", "--profile", "/private/tmp/odyssey-firefox-desktop", "--window-size", "1440,900", "--screenshot", path.join(evidenceDir, "firefox-desktop.png"), baseUrl]);
await run(firefox, ["--headless", "--no-remote", "--profile", "/private/tmp/odyssey-firefox-mobile", "--window-size", "390,844", "--screenshot", path.join(evidenceDir, "firefox-mobile.png"), baseUrl]);

async function webdriver(pathname, options = {}) {
  const response = await fetch(`http://127.0.0.1:4444${pathname}`, options);
  const result = await response.json();
  if (!response.ok || result.value?.error) throw new Error(`Safari WebDriver: ${JSON.stringify(result)}`);
  return result.value;
}

let safari = { available: false };
try {
  const session = await webdriver("/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ capabilities: { alwaysMatch: { browserName: "safari" } } }) });
  const sessionId = session.sessionId;
  await webdriver(`/session/${sessionId}/window/rect`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ width: 1280, height: 800 }) });
  await webdriver(`/session/${sessionId}/url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: baseUrl }) });
  await new Promise((resolve) => setTimeout(resolve, 900));
  const metrics = await webdriver(`/session/${sessionId}/execute/sync`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ script: "const rect=document.querySelector('.soundscape-control').getBoundingClientRect(); return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, mute: document.querySelector('.soundscape-control')?.getAttribute('aria-label'), controlWidth: rect.width, controlHeight: rect.height, title: document.title };", args: [] }) });
  const screenshot = await webdriver(`/session/${sessionId}/screenshot`);
  fs.writeFileSync(path.join(evidenceDir, "safari-desktop.png"), Buffer.from(screenshot, "base64"));
  await webdriver(`/session/${sessionId}`, { method: "DELETE" });
  safari = { available: true, ...metrics };
  if (metrics.scrollWidth > metrics.width || metrics.mute !== "Mute journey soundscape" || metrics.controlWidth < 44 || metrics.controlHeight < 44) throw new Error(`Safari layout/accessibility smoke failed: ${JSON.stringify(metrics)}`);
} catch (error) {
  safari = { available: false, reason: error.message };
}

const result = {
  firefox: {
    desktopScreenshot: "docs/qa/soundscape-local/firefox-desktop.png",
    mobileScreenshot: "docs/qa/soundscape-local/firefox-mobile.png",
  },
  safari,
};
fs.writeFileSync(path.join(evidenceDir, "cross-browser-smoke.json"), `${JSON.stringify(result, null, 2)}\n`);
server.kill("SIGTERM");
console.log(JSON.stringify(result, null, 2));
