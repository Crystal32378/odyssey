"use client";

import { useEffect, useState } from "react";
import { soundscape, type SoundscapeSnapshot } from "../lib/soundscape";

const SILENT: SoundscapeSnapshot = { muted: false, active: false, voiceActive: false, sailing: false };

export function SoundscapeControl() {
  const [snapshot, setSnapshot] = useState(SILENT);
  useEffect(() => {
    if (!soundscape) return;
    const update = () => setSnapshot(soundscape.snapshot());
    update();
    return soundscape.subscribe(update);
  }, []);

  return <button
    className="soundscape-control"
    type="button"
    aria-pressed={snapshot.muted}
    aria-label={snapshot.muted ? "Unmute journey soundscape" : "Mute journey soundscape"}
    onClick={() => soundscape?.toggleMute()}
  >{snapshot.muted ? "UNMUTE" : "MUTE"}</button>;
}
