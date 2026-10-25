import type { Metadata } from "next";
import { Mechanics } from "@/modules/qb-lab/platform/Mechanics";
export const metadata: Metadata = { title: "Mechanics | QB LAB", alternates: { canonical: "/qb-lab/mechanics" } };
export default function Page() {return <Mechanics />;}
