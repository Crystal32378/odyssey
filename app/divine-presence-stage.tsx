"use client";

import { useEffect, useRef, useState } from "react";
import {
  DIVINE_REGISTRY,
  type DivineEncounter,
  type DivineTriggerId,
} from "../lib/divine";

export interface DivinePresenceStageProps {
  readonly triggerId: DivineTriggerId;
  readonly encounter?: DivineEncounter | null;
  readonly pending?: boolean;
  readonly onContinue: () => void;
}

export function DivinePresenceStage({
  triggerId,
  encounter = null,
  pending = false,
  onContinue,
}: DivinePresenceStageProps) {
  const registry = DIVINE_REGISTRY[triggerId];
  const stageRef = useRef<HTMLElement>(null);
  const imageSrc = registry.presentation.imageSrc;
  const [loadedImageSrc, setLoadedImageSrc] = useState<string | null>(null);
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const imageState = failedImageSrc === imageSrc
    ? "error"
    : loadedImageSrc === imageSrc
      ? "ready"
      : "loading";
  const visibleEncounter = encounter ?? {
    version: 1,
    layer: "divine",
    actorId: registry.actorId,
    triggerId: registry.triggerId,
    spokenLine: registry.fallback.spokenLine,
    mark: registry.fallback.mark,
    memoryRefs: registry.fallback.memoryRefs,
    presentation: registry.presentation,
    source: "authored_fallback",
  } satisfies DivineEncounter;

  useEffect(() => {
    stageRef.current?.focus();
  }, []);

  const sourceState = pending
    ? "pending"
    : visibleEncounter.source === "generated"
      ? "generated"
      : "fallback";

  const status = sourceState === "pending"
    ? "THE SIGN HAS NOT YET SETTLED"
    : sourceState === "generated"
      ? "WORDS SHAPED BY GPT-5.6 TERRA"
      : "THE OLDER WORDS REMAIN";

  const disclosure = sourceState === "pending"
    ? "An authored oracle is present while Terra gathers the sign. It cannot alter your route or choice."
    : sourceState === "generated"
      ? "AI-generated text by GPT-5.6 Terra. It bears witness; it does not alter the route or outcome."
      : "Authored fallback. The road and every choice remain yours."

  return (
    <main
      ref={stageRef}
      className={`divine-presence divine-content-${registry.presentation.contentSide}`}
      data-divine-source={sourceState}
      data-divine-trigger={registry.triggerId}
      aria-labelledby="divine-presence-name"
      aria-describedby="divine-presence-line divine-presence-disclosure"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        onContinue();
      }}
    >
      <figure
        className={`divine-portrait divine-image-${imageState}`}
        aria-label={imageState === "error" ? `The marble sign of ${registry.displayName} could not be shown.` : undefined}
      >
        {imageState !== "error" ? (
          // A direct image element guarantees the request starts only when this stage mounts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={`A white marble vision of ${registry.displayName}`}
            decoding="async"
            onLoad={() => setLoadedImageSrc(imageSrc)}
            onError={() => setFailedImageSrc(imageSrc)}
          />
        ) : (
          <figcaption>
            <span>THE IMAGE WITHDRAWS</span>
            <p>{registry.displayName} remains present in words.</p>
          </figcaption>
        )}
      </figure>

      <section className="divine-copy">
        <p className="divine-kicker">A DIVINE PRESENCE</p>
        <header className="divine-heading">
          <h1 id="divine-presence-name">{registry.displayName}</h1>
          <p>{visibleEncounter.mark}</p>
        </header>

        <blockquote id="divine-presence-line" aria-live="polite">
          {visibleEncounter.spokenLine}
        </blockquote>

        <div className="divine-provenance" role="status" aria-live="polite" aria-busy={pending}>
          <strong>{status}</strong>
          <p id="divine-presence-disclosure">{disclosure}</p>
        </div>

        <div className="divine-presence-actions">
          <button type="button" onClick={onContinue}>
            CONTINUE TO THE SHORE
          </button>
          <small>THE ROAD REMAINS YOURS</small>
        </div>
      </section>
    </main>
  );
}
