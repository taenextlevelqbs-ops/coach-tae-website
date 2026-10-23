import Link from "next/link";
import type { ReactNode } from "react";
import { AppIcon, type AppIconName } from "../AppIcon";
import type { Instruction, TrainingDiagram } from "./types";

export function TrainingHeader({ title, subtitle, backHref, backLabel = "Train" }: {
  title: string; subtitle?: string; backHref?: string; backLabel?: string;
}) {
  return <header className="train-header">
    {backHref && <Link href={backHref} className="train-back">← {backLabel}</Link>}
    <h1>{title}</h1>
    {subtitle && <p>{subtitle}</p>}
  </header>;
}

export function MetadataChip({ children, icon }: { children: ReactNode; icon?: AppIconName }) {
  return <span className="train-chip">{icon && <AppIcon name={icon} />}{children}</span>;
}

export function InstructionSteps({ steps }: { steps: Instruction[] }) {
  return <section className="instruction-steps" aria-labelledby="instruction-steps-title">
    <h2 id="instruction-steps-title">Follow These Steps</h2>
    <ol>{steps.map((step, index) => <li key={step.title}>
      <span className="instruction-number" aria-hidden="true">{index + 1}</span>
      <div><h3>{step.title}</h3><p>{step.body}</p></div>
    </li>)}</ol>
  </section>;
}

export function CoachTip({ children }: { children: ReactNode }) {
  return <aside className="train-coach-tip">
    <span className="train-coach-monogram" aria-hidden="true">CT</span>
    <div><h2>Coach Tae’s Tip</h2><p>{children}</p>
      <small>Draft coaching cue · awaiting Coach Tae’s approval</small>
    </div>
  </aside>;
}

export function TrainingProgress({ complete, total, label = "Training progress" }: {
  complete: number; total: number; label?: string;
}) {
  return <div className="train-progress">
    <div><span>{label}</span><span>{complete} of {total}</span></div>
    <progress aria-label={label} value={complete} max={total} />
  </div>;
}

export function MovementDiagram({ diagram, title, markerId }: {
  diagram: TrainingDiagram; title: string; markerId: string;
}) {
  return <figure className="train-diagram">
    <svg viewBox="0 0 320 180" role="img" aria-label={`${title} movement diagram`}>
      <title>{diagram.caption}</title>
      <defs><marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
      <text x="16" y="16" className="train-diagram-direction">Downfield ↑</text>
      {diagram.points.slice(1).map((point, i) => <path key={`line-${i}`} d={`M${diagram.points[i].x} ${diagram.points[i].y}L${point.x} ${point.y}`} stroke="currentColor" strokeWidth="2" fill="none" markerEnd={`url(#${markerId})`} strokeDasharray={i % 2 ? "5 4" : undefined} />)}
      {diagram.points.map((point, i) => <g key={`${point.label}-${i}`}>
        <circle cx={point.x} cy={point.y} r="5" fill="currentColor" />
        <text x={point.x > 210 ? point.x - 12 : point.x + 12} y={point.y + 4} textAnchor={point.x > 210 ? "end" : "start"}>{i + 1}. {point.label}</text>
      </g>)}
    </svg>
    <figcaption>{diagram.caption}</figcaption>
  </figure>;
}
