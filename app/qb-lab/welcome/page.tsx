import type { Metadata } from "next";
import { Introduction } from "@/modules/qb-lab/entry/Introduction";
export const metadata: Metadata = { title: "Meet QB LAB", alternates: { canonical: "/qb-lab/welcome" } };
export default function Page() { return <Introduction />; }
