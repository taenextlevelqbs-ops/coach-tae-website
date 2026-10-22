"use client";
import { useRef, useState } from "react";
/** URL shape checks prevent accidental external sources; server authentication/authorization is still mandatory on every media request. */
export function validMediaPaths(playback: string, captions: string) {
  const id = /^\/api\/qb-lab\/video\/([A-Za-z0-9_-]{1,80})\/playback$/.exec(
    playback,
  )?.[1];
  return !!id && captions === `/api/qb-lab/video/${id}/captions`;
}
/** Future protected HTML media adapter. The live demo deliberately uses illustrations and never supplies media URLs. */
export function ProtectedVideoPlayer({
  playbackPath,
  captionsPath,
}: {
  playbackPath: string;
  captionsPath: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  if (!validMediaPaths(playbackPath, captionsPath))
    return <p>No authorized media endpoint was provided.</p>;
  return (
    <section aria-label="Protected video player">
      <video
        ref={video}
        controls
        playsInline
        preload="none"
        controlsList="nodownload"
        disablePictureInPicture
        onError={() => setError(true)}
        style={{ width: "100%", borderRadius: 12, background: "#080d14" }}
      >
        <source src={playbackPath} type="video/mp4" />
        <track
          kind="captions"
          src={captionsPath}
          srcLang="en"
          label="English"
          default
        />
        Your browser does not support video playback.
      </video>
      <label>
        Video playback speed
        <select
          aria-label="Protected video playback speed"
          defaultValue="1"
          onChange={(e) => {
            if (video.current)
              video.current.playbackRate = Number(e.target.value);
          }}
        >
          {[0.5, 1, 1.5, 2].map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="status">
          Playback is unavailable. Ask your coach to check access; no public
          fallback is used.
        </p>
      )}
    </section>
  );
}
