"use client";

type Props = {
  tick: number | null;
  total: number;
  playing: boolean;
  reference: boolean;
  onSeek: (tick: number) => void;
  onToggle: () => void;
  onResult: () => void;
};

export function EngineReplay({ tick, total, playing, reference, onSeek, onToggle, onResult }: Props) {
  return (
    <section className="engine-replay" aria-label="Recorded rep replay">
      <h3>{reference ? "Review the authored reference" : "Review your actual rep"}</h3>
      <p>Session-only replay of the same seed and tick inputs. Seeking cannot change the result or record another completion.</p>
      <label>
        Replay timeline
        <input type="range" min={0} max={total} step={1} value={tick ?? total}
          onChange={e => onSeek(Number(e.target.value))} />
      </label>
      <div className="engine-actions">
        <button onClick={() => onSeek(0)}>Replay from snap</button>
        <button disabled={tick === null} onClick={onToggle}>
          {playing && tick !== null && tick < total ? "Pause replay" : "Play replay"}
        </button>
        <button disabled={tick === null} onClick={onResult}>Return to result</button>
      </div>
      <output aria-label="Replay position" aria-live="off">
        {((tick ?? total) / 30).toFixed(2)}s / {(total / 30).toFixed(2)}s · read only
      </output>
    </section>
  );
}
