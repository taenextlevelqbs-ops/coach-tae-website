import type { Metadata } from "next";
export const metadata: Metadata = {
  title: { absolute: "Coach Tae Lab | Private Dashboard" },
  robots: { index: false, follow: false },
};
export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return children;
}
