"use client";

import { useState } from "react";
import type { ActiveLunaEncounter } from "../lib/luna-session";
import { LUNA_REGISTRY, type LunaTriggerId } from "../lib/luna";

export interface LunaThresholdProps {
  readonly triggerId: LunaTriggerId;
  readonly pending: boolean;
  readonly outcome: ActiveLunaEncounter | null;
  readonly recovered: boolean;
  readonly onOpen: () => void;
}

export function LunaThreshold({ triggerId, pending, outcome, recovered, onOpen }: LunaThresholdProps) {
  const registry = LUNA_REGISTRY[triggerId];
  const [imageFailed, setImageFailed] = useState(false);
  const presentationState = outcome ? recovered ? "recovered" : outcome.state : pending ? "pending" : "threshold";
  const source = outcome?.encounter.source || "none";
  const provenance = outcome?.state === "generated"
    ? "WORDS SHAPED BY GPT-5.6 LUNA"
    : outcome?.state === "authored_fallback"
      ? "THE AUTHORED WORDS REMAIN"
      : outcome?.state === "failed"
        ? "THE THRESHOLD COULD NOT ANSWER · THE AUTHORED WORDS REMAIN"
        : null;

  return (
    <section
      className={`luna-threshold stage-step stage-step-luna luna-material-${registry.presentation.material}${imageFailed ? " luna-image-failed" : ""}`}
      data-luna-state={presentationState}
      data-luna-source={source}
      data-luna-outcome={outcome?.state || "none"}
      aria-label={!outcome ? `${registry.displayName} literary threshold` : undefined}
      aria-labelledby={outcome ? `luna-name-${triggerId}` : undefined}
      aria-describedby={outcome ? `luna-mark-${triggerId} luna-line-${triggerId} luna-provenance-${triggerId}` : undefined}
    >
      <div className="luna-threshold-object" aria-hidden="true">
        {!imageFailed ? (
          // This image is presentation-only; the text control and fallback remain complete without it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={registry.presentation.imageSrc} alt="" decoding="async" onError={() => setImageFailed(true)} />
        ) : <span />}
      </div>

      <div className="luna-threshold-copy" role="status" aria-live="polite" aria-busy={pending}>
        {!pending && !outcome ? (
          <button type="button" onClick={onOpen}>
            <span>A LITERARY THRESHOLD</span>
            <strong>{registry.presentation.thresholdLabel}</strong>
          </button>
        ) : pending ? (
          <p className="luna-pending">THE THRESHOLD GATHERS</p>
        ) : outcome ? (
          <div className="luna-utterance">
            <p className="luna-character" id={`luna-name-${triggerId}`}>{registry.displayName}</p>
            <p className="luna-mark" id={`luna-mark-${triggerId}`}>{outcome.encounter.mark}</p>
            <blockquote id={`luna-line-${triggerId}`}>{outcome.encounter.spokenLine}</blockquote>
            <small id={`luna-provenance-${triggerId}`}>
              {recovered ? "RECOVERED FROM THIS JOURNEY · " : ""}{provenance}
            </small>
          </div>
        ) : null}
      </div>
    </section>
  );
}
