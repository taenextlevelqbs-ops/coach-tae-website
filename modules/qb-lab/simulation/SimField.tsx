"use client";
import {
  HS_FIELD_WIDTH,
  HS_HASH_INSET,
  toField,
  fromField,
  type Tactics,
} from "../football/geometry";
import { useRef } from "react";
import { position } from "./engine";
import type { Player, Point } from "./model";
export function SimField({
  players,
  tactics,
  defenders = [],
  time = 0,
  qb,
  selected,
  onSelect,
  onMove,
  onDraw,
  rushYards,
  showGaps,
  ball,
}: {
  tactics?: Tactics;
  rushYards?: number;
  showGaps?: boolean;
  ball?: { from: Point; to: Point; progress: number };
  players: Player[];
  defenders?: Player[];
  time?: number;
  qb?: Point;
  selected?: string;
  onSelect?: (id: string) => void;
  onMove?: (id: string, p: Point) => void;
  onDraw?: (p: Point) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const dragging = useRef<string | null>(null);
  const didDrag = useRef(false);
  const rigid = (player?: Player) =>
    ["OL", "C", "QB", "RB", "DL"].includes(player?.role ?? "");
  function project(point: Point, player?: Player, route = false): Point {
    if (!tactics) return point;
    const p = toField(
      point,
      HS_FIELD_WIDTH,
      0,
      tactics,
      route ? player?.start : undefined,
      !route && rigid(player),
    );
    return { x: (p.x / HS_FIELD_WIDTH) * 100, y: 70 - p.y * 2 };
  }
  function coords(clientX: number, clientY: number): Point {
    const element = svg.current!;
    const cursor = element.createSVGPoint();
    cursor.x = clientX;
    cursor.y = clientY;
    const inverse = element.getScreenCTM()?.inverse();
    const local = inverse ? cursor.matrixTransform(inverse) : cursor;
    const p = { x: local.x / 10, y: local.y / 7 };
    const player = players.find((p) => p.id === (dragging.current ?? selected));
    const raw = tactics
      ? fromField(
          { x: (p.x / 100) * HS_FIELD_WIDTH, y: (70 - p.y) * 0.5 },
          HS_FIELD_WIDTH,
          0,
          tactics,
          dragging.current ? undefined : player?.start,
          !!dragging.current && rigid(player),
        )
      : p;
    return {
      x: Math.max(0, Math.min(100, raw.x)),
      y: Math.max(0, Math.min(100, raw.y)),
    };
  }
  return (
    <svg
      ref={svg}
      viewBox="0 0 1000 700"
      className="lab-sim-field"
      role={onSelect ? "group" : "img"}
      aria-label={
        onSelect
          ? "Editable play field. Select a player; use arrow keys or coordinate inputs to move."
          : "Synthetic quarterback field. Offense moves upward. White offense, blue defense; positions use schematic units, not yards."
      }
      onPointerMove={(e) => {
        if (dragging.current && onMove) {
          didDrag.current = true;
          onMove(dragging.current, coords(e.clientX, e.clientY));
        }
      }}
      onPointerUp={() => {
        dragging.current = null;
      }}
      onPointerCancel={() => {
        dragging.current = null;
      }}
      onClick={(e) => {
        if (didDrag.current) {
          didDrag.current = false;
          return;
        }
        if (
          e.target === e.currentTarget ||
          (e.target as Element).getAttribute("data-field-surface")
        )
          onDraw?.(coords(e.clientX, e.clientY));
      }}
    >
      <rect
        data-field-surface="true"
        width="1000"
        height="700"
        fill="#102b35"
      />
      {Array.from({ length: 11 }, (_, i) => (
        <path
          key={i}
          data-field-surface="true"
          d={`M35 ${i * 60 + 40}H965`}
          stroke="#bad5da"
          strokeOpacity=".2"
        />
      ))}
      <path
        d={
          tactics
            ? `M${(HS_HASH_INSET / HS_FIELD_WIDTH) * 1000} 0V700M${(1 - HS_HASH_INSET / HS_FIELD_WIDTH) * 1000} 0V700`
            : "M320 40V660M680 40V660"
        }
        stroke="#bad5da"
        strokeOpacity=".25"
        strokeDasharray="3 14"
        pointerEvents="none"
      />
      <path
        d="M35 490H965"
        stroke="#efc778"
        strokeDasharray="8 8"
        opacity=".6"
        pointerEvents="none"
      />
      <text x="50" y="27" fill="#d9e7e8" fontSize="13">
        DIRECTION OF PLAY ↑ · SCHEMATIC / NO LEGALITY CHECK
      </text>
      {showGaps && (
        <g
          fill="#dce9f1"
          fontSize="13"
          textAnchor="middle"
          pointerEvents="none"
        >
          {[
            [47, "A"],
            [53, "A"],
            [41, "B"],
            [59, "B"],
            [35, "C"],
            [65, "C"],
          ].map(([x, label], i) => (
            <text key={i} x={Number(x) * 10} y="527">
              {label}
            </text>
          ))}
        </g>
      )}
      {rushYards !== undefined && (
        <g pointerEvents="none">
          <path
            d={`M35 ${(70 - 2 * rushYards) * 7}H965`}
            stroke="#f0c77a"
            strokeWidth="3"
            strokeDasharray="10 6"
          />
          <text
            x="45"
            y={(70 - 2 * rushYards) * 7 - 8}
            fill="#f0c77a"
            fontSize="15"
          >
            {rushYards}-yard rush line · configured scale 2 units/yard
          </text>
        </g>
      )}
      <rect
        x="300"
        y="294"
        width="400"
        height="196"
        fill="none"
        stroke="#9ebbc7"
        strokeDasharray="4 10"
        pointerEvents="none"
      />
      {players
        .filter((p) => p.route.length > 0)
        .map((p) => (
          <polyline
            key={`route-${p.id}`}
            points={[p.start, ...p.route]
              .map((point, i) => {
                const at = project(point, p, i > 0);
                return `${at.x * 10},${at.y * 7}`;
              })
              .join(" ")}
            fill="none"
            stroke={selected === p.id ? "#f0c77a" : "#e0ebd9"}
            strokeWidth={selected === p.id ? 4 : 2}
            strokeDasharray="7 5"
            opacity=".75"
            pointerEvents="none"
          />
        ))}
      {ball && (
        <g pointerEvents="none">
          <path
            d={`M${ball.from.x * 10} ${ball.from.y * 7}L${ball.to.x * 10} ${ball.to.y * 7}`}
            stroke="#efc778"
            strokeDasharray="4 6"
          />
          <ellipse
            cx={(ball.from.x + (ball.to.x - ball.from.x) * ball.progress) * 10}
            cy={(ball.from.y + (ball.to.y - ball.from.y) * ball.progress) * 7}
            rx="9"
            ry="6"
            fill="#efc778"
          />
        </g>
      )}
      {[...players, ...defenders].map((player) => {
        const defense = defenders.includes(player);
        const rawAt = player.id === "QB" && qb ? qb : position(player, time);
        const at = project(rawAt, player);
        return (
          <g
            key={player.id}
            role={onSelect && !defense ? "button" : undefined}
            tabIndex={onSelect && !defense ? 0 : undefined}
            aria-label={onSelect ? `Select ${player.label}` : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(player.id);
            }}
            onKeyDown={(e) => {
              if (!onSelect || defense) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(player.id);
              }
              const offsets: Record<string, Point> = {
                ArrowLeft: { x: -2, y: 0 },
                ArrowRight: { x: 2, y: 0 },
                ArrowUp: { x: 0, y: -2 },
                ArrowDown: { x: 0, y: 2 },
              };
              const delta = offsets[e.key];
              if (delta) {
                e.preventDefault();
                onSelect(player.id);
                onMove?.(player.id, {
                  x: Math.max(0, Math.min(100, rawAt.x + delta.x)),
                  y: Math.max(0, Math.min(100, rawAt.y + delta.y)),
                });
              }
            }}
            onPointerDown={(e) => {
              if (!onMove || defense) return;
              e.preventDefault();
              onSelect?.(player.id);
              didDrag.current = false;
              dragging.current = player.id;
              svg.current?.setPointerCapture(e.pointerId);
            }}
            style={onMove ? { cursor: "grab", touchAction: "none" } : undefined}
          >
            <circle
              cx={at.x * 10}
              cy={at.y * 7}
              r={player.id === "QB" ? 20 : 17}
              fill={defense ? "#74cef1" : "#f2f4e9"}
              stroke={selected === player.id ? "#f0c77a" : "#102b35"}
              strokeWidth={selected === player.id ? 5 : 2}
            />
            <text
              x={at.x * 10}
              y={at.y * 7 + 4}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#102b35"
              pointerEvents="none"
            >
              {player.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
