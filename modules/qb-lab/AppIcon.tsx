import type { CSSProperties } from "react";
export type AppIconName =
  | "home"
  | "train"
  | "plays"
  | "profile"
  | "iq"
  | "workout"
  | "film"
  | "simulator"
  | "progress"
  | "clock"
  | "arrow";
const paths: Record<AppIconName, string> = {
  home: "m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9",
  train: "m4 17 4-10 4 10 4-10 4 10M3 21h18M8 7V3m8 4V3",
  plays:
    "M5 20V8m0 0L2 11m3-3 3 3m4 9v-6c0-5 7-3 7-8m0 0-3 2m3-2 1 4M9 4h3m-3 0v3",
  profile:
    "M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3",
  iq: "M8 4H5v16h14V4h-3M8 3h8v4H8V3m0 9 2 2 5-4m-7 7h7",
  workout: "M5 7v10m-3-8v6m17-8v10m3-8v6M5 12h14",
  film: "M3 5h18v14H3V5m0 4h18M7 5l3 4m3-4 3 4m-6 3 5 2-5 2v-4",
  simulator: "M6 5h12v14H6V5m0 7h12M9 8h6m-6 8h6M3 8v8m18-8v8",
  progress: "M4 4v16h17M8 15l4-5 4 2 5-8m-4 0h4v4",
  clock: "M12 8v5l3 2M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0",
  arrow: "M4 12h16m-6-6 6 6-6 6",
};
export function AppIcon({
  name,
  style,
}: {
  name: AppIconName;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
