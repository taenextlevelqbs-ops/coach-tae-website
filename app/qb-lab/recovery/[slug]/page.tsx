import { notFound } from "next/navigation";
import { InstructionDetail } from "@/modules/qb-lab/training/InstructionDetail";
import { getRecoveryExercise, recoveryExercises } from "@/modules/qb-lab/training/recovery";

export function generateStaticParams() {
  return recoveryExercises.map((item) => ({ slug: item.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getRecoveryExercise(slug);
  if (!item) notFound();
  return <InstructionDetail item={item} />;
}
