import type { ReactNode } from "react";
import { LandscapeSimulator } from "@/modules/qb-lab/LandscapeSimulator";
export default function Layout({ children }: { children: ReactNode }) { return <LandscapeSimulator>{children}</LandscapeSimulator>; }
