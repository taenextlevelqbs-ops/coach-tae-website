import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstructionDetail } from "@/modules/qb-lab/training/InstructionDetail";
import { workoutBySlug, workouts } from "@/modules/qb-lab/training/workouts";

export function generateStaticParams() {
  return workouts.map((item) => ({ slug: item.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = workoutBySlug(slug);
  return { title: item ? `${item.title} | QB LAB` : "Drill not found | QB LAB" };
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = workoutBySlug(slug);
  if (!item) notFound();
  return <InstructionDetail item={item} />;
}
