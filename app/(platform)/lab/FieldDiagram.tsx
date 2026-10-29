import { useId } from "react";
const routes: Record<string, string[]> = {
  "slant-flat": ["80,270 80,225 200,175", "180,270 180,245 30,245"],
  stick: [
    "180,270 180,210 220,210",
    "80,270 80,100",
    "420,270 420,245 560,245",
  ],
  snag: [
    "80,270 160,225 160,220",
    "180,270 180,185 70,115",
    "420,270 420,245 560,245",
  ],
  mesh: ["180,270 180,235 455,225", "420,270 420,225 145,235"],
  smash: ["80,270 80,230", "180,270 180,170 65,100"],
  flood: [
    "520,270 520,80",
    "420,270 420,190 565,165",
    "300,295 360,250 560,250",
  ],
  verticals: [
    "80,270 80,70",
    "180,270 205,70",
    "420,270 395,70",
    "520,270 520,70",
  ],
  levels: ["180,270 180,225 460,225", "80,270 80,160 455,160"],
  "curl-flat": ["80,270 80,170 110,190", "180,270 180,245 30,245"],
  pocket: ["300,325 300,285 330,275"],
};
export default function FieldDiagram({ name }: { name: string }) {
  const arrowId = `field-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const zones =
    name === "cover1"
      ? [[220, 30, 160, 105]]
      : name === "cover2"
        ? [
            [25, 30, 265, 105],
            [310, 30, 265, 105],
          ]
        : name === "cover3"
          ? [
              [25, 30, 170, 105],
              [215, 30, 170, 105],
              [405, 30, 170, 105],
            ]
          : name === "cover4"
            ? [
                [25, 30, 125, 105],
                [165, 30, 125, 105],
                [310, 30, 125, 105],
                [450, 30, 125, 105],
              ]
            : name === "cover6"
              ? [
                  [25, 30, 125, 105],
                  [165, 30, 125, 105],
                  [310, 30, 265, 105],
                ]
              : [];
  const caption = name.startsWith("cover")
    ? `${name.replace("cover", "Cover ")}: simplified deep responsibilities. Matching and underneath rules vary by defense.`
    : name === "rotation"
      ? "A two-high starting shell can rotate toward a one-high structure. Confirm the moving defender after the snap."
      : `${name.replaceAll("-", " ")}: illustrative routes and movement, not a complete play call. Use your team’s landmarks and rules.`;
  return (
    <figure className="stack">
      <svg
        className="field-diagram"
        viewBox="0 0 600 360"
        role="img"
        aria-label={caption}
      >
        <title>{caption}</title>
        <defs>
          <marker
            id={arrowId}
            markerWidth="7"
            markerHeight="7"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6" fill="#ffe18a" />
          </marker>
        </defs>
        {[60, 110, 160, 210, 260, 310].map((y) => (
          <line
            key={y}
            x1="20"
            x2="580"
            y1={y}
            y2={y}
            stroke="#fff"
            opacity=".14"
          />
        ))}
        <line
          x1="20"
          x2="580"
          y1="270"
          y2="270"
          stroke="#80dcff"
          strokeDasharray="7 5"
        />
        <text x="28" y="265" fill="#80dcff" fontSize="12">
          LOS
        </text>
        {zones.map(([x, y, w, h], i) => (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="15"
              fill="#80dcff"
              opacity=".17"
              stroke="#80dcff"
            />
            <text
              x={x + w / 2}
              y={y + h / 2}
              textAnchor="middle"
              fill="#b4ecff"
              fontSize="13"
            >
              Deep help
            </text>
          </g>
        ))}
        {[80, 180, 420, 520].map((x) => (
          <g key={x}>
            <circle cx={x} cy="280" r="13" fill="#dce7e5" />
            <text
              x={x}
              y="285"
              textAnchor="middle"
              fontSize="13"
              fill="#06181a"
            >
              O
            </text>
            <text
              x={x}
              y="200"
              textAnchor="middle"
              fontSize="21"
              fill="#ff9e9e"
            >
              X
            </text>
          </g>
        ))}
        <circle cx="300" cy="325" r="15" fill="#80dcff" />
        <text x="300" y="330" textAnchor="middle" fill="#06181a" fontSize="12">
          QB
        </text>
        {name === "cover0" &&
          [80, 180, 420, 520].map((x) => (
            <line
              key={x}
              x1={x}
              y1="210"
              x2={x}
              y2="260"
              stroke="#ff9e9e"
              strokeDasharray="4 4"
            />
          ))}
        {name === "rotation" && (
          <>
            <text x="180" y="70" fill="#ff9e9e" fontSize="20">
              S
            </text>
            <text x="420" y="70" fill="#ff9e9e" fontSize="20">
              S
            </text>
            <polyline
              points="180,80 100,160 65,225"
              fill="none"
              stroke="#ffe18a"
              strokeWidth="4"
              strokeDasharray="7 5"
              markerEnd={`url(#${arrowId})`}
            />
            <polyline
              points="420,80 300,60"
              fill="none"
              stroke="#ffe18a"
              strokeWidth="4"
              markerEnd={`url(#${arrowId})`}
            />
          </>
        )}
        {(routes[name] || []).map((points, i) => (
          <polyline
            key={i}
            points={points}
            fill="none"
            stroke="#ffe18a"
            strokeWidth="4"
            strokeLinejoin="round"
            markerEnd={`url(#${arrowId})`}
          />
        ))}
      </svg>
      <figcaption className="muted">
        {caption} O = receiver, X = illustrative underneath defender; the
        diagram does not show all 11 defenders.
      </figcaption>
    </figure>
  );
}
