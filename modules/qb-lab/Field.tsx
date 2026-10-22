import { formation } from "./simulation/model";
import { position } from "./simulation/engine";
import type { Pathway } from "./demo";
import type { ReadFocus } from "./review-model";

export function Field({
  pathway = "tackle",
  progress = 0,
  routes = true,
  annotate = false,
  focusTarget,
}: {
  pathway?: Pathway;
  progress?: number;
  routes?: boolean;
  annotate?: boolean;
  focusTarget?: ReadFocus;
}) {
  const turn = Math.min(1, Math.max(0, (progress - 20) / 60));
  const play = formation(pathway === "tackle" ? "tackle" : "flag5");
  const offense = play.players.map((p) => {
    const at = position(p, turn * 6);
    return [at.x * 8, at.y * 5];
  });
  const underneath =
    pathway === "tackle"
      ? [
          [285, 290],
          [340, 290],
          [400, 290],
          [460, 290],
          [515, 290],
          [120, 220],
          [240, 220],
          [560, 220],
          [680, 220],
        ]
      : [
          [235, 220],
          [400, 260],
          [565, 220],
        ];
  return (
    <svg
      className="lab-field"
      viewBox="0 0 800 500"
      role="img"
      aria-label={`${pathway === "tackle" ? "Eleven" : "Five"} players per side. ${progress < 40 ? "Two deep defenders in the initial illustration" : "Illustrated defenders rotating from the initial two-high picture"}. Movement is illustrative, not a validated play outcome.`}
    >
      <desc>
        Offense moves toward the top. White circles represent offensive players.
        Blue circles represent defenders. This schematic is not to scale. The
        shaded deep area is a teaching aid, not a regulation field marking.
      </desc>
      <rect width="800" height="500" rx="0" fill="#102b35" />
      {Array.from({ length: 11 }, (_, index) => (
        <g key={index}>
          <path
            d={`M35 ${index * 45 + 25}H765`}
            stroke="#bfd1d5"
            strokeOpacity=".18"
          />
          <text
            x="45"
            y={index * 45 + 18}
            fill="#bfd1d5"
            opacity=".55"
            fontSize="12"
          >
            {index <= 5 ? index * 10 : (10 - index) * 10}
          </text>
        </g>
      ))}
      <path
        d="M160 20V480M640 20V480"
        stroke="#bfd1d5"
        strokeDasharray="3 12"
        strokeOpacity=".25"
      />
      <rect
        x="75"
        y="55"
        width="650"
        height="110"
        rx="10"
        fill="#91e2ec"
        fillOpacity=".07"
        stroke="#91e2ec"
        strokeDasharray="5 7"
        strokeOpacity=".35"
      />
      <text
        x="400"
        y="78"
        textAnchor="middle"
        fill="#a5e0e5"
        fontSize="12"
        letterSpacing="4"
      >
        DEEP AREA / OBSERVE FIRST
      </text>
      {routes && (
        <g
          fill="none"
          stroke="#e3efdd"
          strokeWidth="3"
          opacity=".55"
          strokeDasharray="7 6"
        >
          {play.players
            .filter((p) => p.eligible)
            .map((p) => (
              <polyline
                key={p.id}
                points={[p.start, ...p.route]
                  .map((a) => `${a.x * 8},${a.y * 5}`)
                  .join(" ")}
              />
            ))}
        </g>
      )}

      <path
        d="M75 350H725"
        stroke="#dfdaae"
        strokeDasharray="6 6"
        strokeOpacity=".55"
      />
      {offense.map(([x, y], i) => (
        <g key={`o${i}`}>
          <circle cx={x} cy={y} r="12" fill="#ecf0e5" />
          <text
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#0b2022"
          >
            {play.players[i].label}
          </text>
        </g>
      ))}
      {underneath.map(([x, y], i) => (
        <g key={`d${i}`}>
          <circle
            cx={x + (i % 2 ? 1 : -1) * turn * 15}
            cy={y - turn * 12}
            r="12"
            fill="#74cef1"
          />
          <text
            x={x + (i % 2 ? 1 : -1) * turn * 15}
            y={y + 4 - turn * 12}
            textAnchor="middle"
            fontSize="9"
            fill="#0b2022"
          >
            D
          </text>
        </g>
      ))}
      <g>
        <circle
          cx={240 + turn * 160}
          cy={110 - turn * 15}
          r="15"
          fill="#74cef1"
        />
        <text
          x={240 + turn * 160}
          y={114 - turn * 15}
          textAnchor="middle"
          fill="#0b2022"
          fontSize="10"
          fontWeight="bold"
        >
          D1
        </text>
        <circle
          cx={560 - turn * 50}
          cy={110 + turn * 120}
          r="15"
          fill="#74cef1"
        />
        <text
          x={560 - turn * 50}
          y={114 + turn * 120}
          textAnchor="middle"
          fill="#0b2022"
          fontSize="10"
          fontWeight="bold"
        >
          D2
        </text>
      </g>
      {focusTarget && (
        <g fill="none" stroke="#f0c77a" strokeWidth="3">
          {focusTarget === "D1" && (
            <rect
              x={215 + turn * 160}
              y={85 - turn * 15}
              width="50"
              height="50"
              rx="4"
            />
          )}
          {focusTarget === "D2" && (
            <rect
              x={535 - turn * 50}
              y={85 + turn * 120}
              width="50"
              height="50"
              rx="4"
            />
          )}
          {focusTarget === "routes" && (
            <path d="M80 315V175L235 107M680 315V160" strokeDasharray="6 5" />
          )}
        </g>
      )}
      {annotate && (
        <g>
          <ellipse
            cx="510"
            cy="230"
            rx="65"
            ry="45"
            fill="none"
            stroke="#f3d58b"
            strokeWidth="3"
          />
          <path d="M620 130L554 196" stroke="#f3d58b" strokeWidth="3" />
          <text x="545" y="160" fill="#f3d58b" fontSize="15">
            Depth changes
          </text>
        </g>
      )}
      <text
        x="400"
        y="484"
        textAnchor="middle"
        fill="#c7ddd6"
        fontSize="11"
        letterSpacing="3"
      >
        ILLUSTRATIVE MOVEMENT · NO OUTCOME PREDICTION
      </text>
    </svg>
  );
}
