import type { Metadata } from "next";
import { Coach } from "@/modules/qb-lab/platform/Coach";
export const metadata: Metadata = { title: "Coach | QB LAB", alternates: { canonical: "/qb-lab/coach" } };
export default function Page() {return <Coach />;}
