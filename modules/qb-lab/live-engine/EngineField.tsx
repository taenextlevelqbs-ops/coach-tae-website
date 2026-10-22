"use client";
import type { EngineState } from "./types";
export function EngineField({ state: s }: { state: EngineState }) {
  const r = s.config.rules;
  const sx = (x: number) => 20 + (x / r.width) * 600;
  const low = Math.max(0, r.los - 15),
    high = Math.min(r.length, r.los + 35);
  const sy = (y: number) => 640 - ((y - low) / (high - low)) * 600;
  const qb = s.players.find((p) => p.job === "qb")!;
  const phase = ((s.tick % 16) / 16) * Math.PI * 2;
  const gait =
    s.qbState === "drop" || s.qbState === "hitch" || s.qbState === "escape"
      ? Math.sin(phase) * 5
      : 0;
  const release = s.qbState === "release";
  return (
    <svg
      viewBox="0 0 640 690"
      role="img"
      aria-label={`Live engine field. ${s.players.filter((p) => p.team === "offense").length} offense and ${s.players.filter((p) => p.team === "defense").length} defense. QB ${s.qbState}. ${s.engagements.length} active block engagements.`}
      className="engine-field"
    >
      <rect width="640" height="690" rx="10" fill="#102e37" />
      {Array.from(
        { length: Math.floor((high - low) / 5) + 1 },
        (_, i) => low + i * 5,
      ).map((y) => (
        <g key={y}>
          <path d={`M20 ${sy(y)}H620`} stroke="#96b8bf" strokeOpacity=".25" />
          <text x="23" y={sy(y) - 5} fontSize="11" fill="#c0d9db">
            {Math.round(y)} yd
          </text>
        </g>
      ))}
      <path
        d={`M20 ${sy(r.los)}H620`}
        stroke="#efc778"
        strokeWidth="2"
        strokeDasharray="6 5"
      />
      <text
        x="620"
        y={sy(r.los) - 8}
        textAnchor="end"
        fontSize="11"
        fill="#efc778"
      >
        LOS · offense ↑
      </text>
      {r.format.startsWith("flag") && (
        <g>
          <path
            d={`M20 ${sy(r.los + r.rushDistance)}H620`}
            stroke="#efc778"
            strokeDasharray="3 6"
          />
          <text
            x="620"
            y={sy(r.los + r.rushDistance) - 7}
            textAnchor="end"
            fontSize="11"
            fill="#efc778"
          >
            {r.rushDistance}-yard rush line
          </text>
        </g>
      )}
      {s.phase === "ready" &&
        s.players
          .filter((p) => p.job === "route")
          .map((p) => (
            <polyline
              key={p.id}
              points={[p.start, ...p.route]
                .map((v) => `${sx(v.x)},${sy(v.y)}`)
                .join(" ")}
              stroke="#bad4c8"
              opacity=".6"
              fill="none"
              strokeDasharray="4 5"
            />
          ))}
      {s.engagements.map((e) => {
        const b = s.players.find((p) => p.id === e.blocker)!;
        const d = s.players.find((p) => p.id === e.rusher)!;
        return (
          <path
            key={e.blocker}
            d={`M${sx(b.pos.x)} ${sy(b.pos.y)}L${sx(d.pos.x)} ${sy(d.pos.y)}`}
            stroke="#f5ce7e"
            strokeWidth="6"
            opacity=".8"
          />
        );
      })}
      {s.players
        .filter((p) => p.job !== "qb")
        .map((p) => (
          <g key={p.id}>
            <title>
              {p.label}: {p.responsibility}
            </title>
            <circle
              cx={sx(p.pos.x)}
              cy={sy(p.pos.y)}
              r={p.team === "offense" ? 10 : 11}
              fill={p.team === "offense" ? "#edf3ec" : "#72cbea"}
              stroke={p.job === "rush" ? "#f5ce7e" : "#12323d"}
              strokeWidth="2"
            />
            <text
              x={sx(p.pos.x)}
              y={sy(p.pos.y) + 4}
              fontSize="9"
              textAnchor="middle"
              fill="#102b35"
              fontWeight="700"
            >
              {p.label}
            </text>
          </g>
        ))}
      <g
        transform={`translate(${sx(qb.pos.x)},${sy(qb.pos.y)})`}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <ellipse cy="9" rx="12" ry="5" fill="#06151b" opacity=".5" />
        <path
          d={`M-4 3l${-3 - gait} 9M4 3l${3 + gait} 9`}
          stroke="#e5edf4"
          strokeWidth="4"
        />
        <path
          d="M-6-4L6-4L5 5L-5 5Z"
          fill="#ecc16e"
          stroke="#fff0cc"
          strokeWidth="1.5"
        />
        <path
          d={release ? "M4-3L13-11M-5-3L-11 1" : "M4-3L9 1M-5-3L-9 1"}
          stroke="#f4d19e"
          strokeWidth="3"
        />
        <circle cy="-10" r="5" fill="#f1f5f3" />
        <text
          x="0"
          y="-21"
          fontSize="10"
          textAnchor="middle"
          stroke="none"
          fill="#fff1c9"
        >
          QB
        </text>
      </g>
      {s.ball && (
        <g>
          <ellipse
            cx={sx(s.ball.pos.x)}
            cy={sy(s.ball.pos.y)}
            rx="5"
            ry="3"
            fill="#071a21"
            opacity=".5"
          />
          <ellipse
            cx={sx(s.ball.pos.x)}
            cy={sy(s.ball.pos.y) - s.ball.height * 4}
            rx="6"
            ry="4"
            fill="#f0bf69"
            stroke="#fff4d8"
          />
        </g>
      )}
      <text x="25" y="675" fontSize="12" fill="#dae8eb">
        Yards · synthetic attributes · simplified positional contact
      </text>
    </svg>
  );
}
