import type { Metadata } from "next";
import { Playbook } from "@/modules/qb-lab/platform/Playbook";
export const metadata: Metadata = { title: "Playbook | QB LAB", alternates: { canonical: "/qb-lab/playbook" } };
export default function Page() {return <Playbook />;}
