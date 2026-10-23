import type { Metadata } from "next";
import { SimulatorHome } from "@/modules/qb-lab/training/SimulatorHome";
export const metadata: Metadata = { title: "Simulator | QB LAB", alternates: { canonical: "/qb-lab/simulator" } };
export default function Page() {return <SimulatorHome />;}
