import type { Metadata } from "next";
import { LabShell } from "@/modules/qb-lab/LabShell";
import "./lab.css";
import "./application.css";
import "./athlete.css";
export const metadata: Metadata = {
  title: "QB LAB Preview",
  manifest: "/qb-lab/manifest.webmanifest",
  appleWebApp: { capable: true, title: "QB LAB", statusBarStyle: "black-translucent" },
  description:
    "Explore the Coach Tae QB LAB interactive demonstration for athletes and families.",
  alternates: { canonical: "/qb-lab" },
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <LabShell>{children}</LabShell>;
}
