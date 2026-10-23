import Link from "next/link";
import type { Metadata } from "next";
import { workoutBySlug } from "@/modules/qb-lab/training/workouts";
import { CoachTip, InstructionSteps, MetadataChip, TrainingHeader } from "@/modules/qb-lab/training/AthleteUI";
export const metadata: Metadata = { title: "Sample drill | QB LAB", alternates: { canonical: "/qb-lab/sample" } };
/** Server-rendered, read-only content. Never mounts InstructionDetail or records a start/completion. */
export default function Page() {
  const drill = workoutBySlug("reset-your-feet")!;
  return <article className="public-sample train-page qb-lab">
    <TrainingHeader title={drill.title} subtitle={drill.purpose} backHref="/qb-lab/welcome" backLabel="QB LAB introduction" />
    <p className="public-readonly">Public sample · Read only · No activity is recorded</p>
    <p className="train-draft">Draft instruction · Coach Tae’s approval is pending. This is not a personalized training prescription.</p>
    <div className="train-metadata"><MetadataChip>{drill.equipment}</MetadataChip><MetadataChip>Reps and timing pending coaching review</MetadataChip></div>
    <p className="train-safety">{drill.safety.join(" ")} Stop for pain or discomfort. Younger athletes should review the movement with a trusted adult.</p>
    <section className="instruction-start"><h2>Starting position</h2><p>{drill.start}</p></section>
    <InstructionSteps steps={drill.steps} /><CoachTip>{drill.tip}</CoachTip>
    <p className="public-availability">This sample does not save progress or complete an assignment. Full training and personal history require an approved account.</p>
    <div className="public-actions"><Link className="train-button" href="/qb-lab/create-account">Get Started</Link><Link className="train-back" href="/qb-lab/welcome">Back to QB LAB →</Link></div>
  </article>;
}
