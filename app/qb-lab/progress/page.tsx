import type { Metadata } from "next";
import { Progress } from "@/modules/qb-lab/platform/Progress";
export const metadata: Metadata = { title: "Progress | QB LAB", alternates: { canonical: "/qb-lab/progress" } };
export default function Page() {return <Progress />;}
