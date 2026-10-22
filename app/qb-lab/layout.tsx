import type { Metadata } from "next";
import { LabShell } from "@/modules/qb-lab/LabShell";
import "./lab.css";
export const metadata: Metadata = {
  title: "QB LAB Preview",
  description:
    "Explore the Coach Tae QB LAB interactive demonstration for athletes and families.",
  alternates: { canonical: "/qb-lab" },
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <LabShell>{children}</LabShell>;
}
