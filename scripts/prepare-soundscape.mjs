import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "assets", "audio-sources");
const workDir = path.join(root, "work", "soundscape");

function readPcm16Wave(source) {
  const file = fs.readFileSync(source);
  let offset = 12;
  let format;
  let data;
  while (offset + 8 <= file.length) {
    const id = file.toString("ascii", offset, offset + 4);
    const size = file.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      format = {
        audioFormat: file.readUInt16LE(offset + 8),
        channels: file.readUInt16LE(offset + 10),
        sampleRate: file.readUInt32LE(offset + 12),
        bitsPerSample: file.readUInt16LE(offset + 22),
      };
    }
    if (id === "data") data = file.subarray(offset + 8, offset + 8 + size);
    offset += 8 + size + (size % 2);
  }
  if (!format || !data || format.audioFormat !== 1 || format.bitsPerSample !== 16) {
    throw new Error(`${source} must be 16-bit PCM WAV.`);
  }
  return { ...format, data };
}

function writeWave(target, source, { startSeconds, durationSeconds, gain, fadeSeconds }) {
  const bytesPerFrame = source.channels * 2;
  const startFrame = Math.floor(startSeconds * source.sampleRate);
  const frameCount = Math.floor(durationSeconds * source.sampleRate);
  const fadeFrames = Math.floor(fadeSeconds * source.sampleRate);
  const outputData = Buffer.alloc(frameCount * bytesPerFrame);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const fadeIn = Math.min(1, frame / fadeFrames);
    const fadeOut = Math.min(1, (frameCount - frame - 1) / fadeFrames);
    const envelope = gain * Math.min(fadeIn, fadeOut);
    for (let channel = 0; channel < source.channels; channel += 1) {
      const inputOffset = ((startFrame + frame) * source.channels + channel) * 2;
      const outputOffset = (frame * source.channels + channel) * 2;
      const sample = Math.round(source.data.readInt16LE(inputOffset) * envelope);
      outputData.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), outputOffset);
    }
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + outputData.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(source.channels, 22);
  header.writeUInt32LE(source.sampleRate, 24);
  header.writeUInt32LE(source.sampleRate * bytesPerFrame, 28);
  header.writeUInt16LE(bytesPerFrame, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(outputData.length, 40);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.concat([header, outputData]));
}

fs.mkdirSync(workDir, { recursive: true });
writeWave(
  path.join(workDir, "ship-sailing-master.wav"),
  readPcm16Wave(path.join(sourceDir, "mixkit-wooden-ship-on-the-sea-1187.wav")),
  { startSeconds: 8, durationSeconds: 4, gain: 0.25, fadeSeconds: 0.35 },
);

console.log("Prepared work/soundscape/ship-sailing-master.wav (8–12s excerpt, -12.04 dB gain, 350ms linear fades).");
console.log("Encode commands are documented in docs/audio-assets.md so CoreAudio output remains reproducible.");
