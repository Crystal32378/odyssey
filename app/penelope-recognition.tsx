"use client";

import { useState } from "react";

const PENELOPE_IMAGE = "/characters/v1/penelope.webp";

export function PenelopeRecognition() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      className={`penelope-recognition${imageFailed ? " penelope-image-failed" : ""}`}
      aria-labelledby="penelope-recognition-name"
      aria-describedby="penelope-recognition-mark penelope-recognition-line"
    >
      {!imageFailed ? (
        // This authored scene remains optional; its text and the Restart path do not depend on the image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={PENELOPE_IMAGE}
          alt="Penelope beside her loom, looking toward the returning sea"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <div className="penelope-veil" aria-hidden="true" />
      <div className="penelope-copy">
        <p className="penelope-kicker">A RECOGNITION AT HOME</p>
        <h2 id="penelope-recognition-name">Penelope</h2>
        <p id="penelope-recognition-mark" className="penelope-mark">THE THREAD REMEMBERS</p>
        <blockquote id="penelope-recognition-line">
          “I did not remain unchanged while you crossed the sea. Do not ask whether I waited; show me what in you has truly returned.”
        </blockquote>
      </div>
    </section>
  );
}
