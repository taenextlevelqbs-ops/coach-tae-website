import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://coachtaeqb.com"),

  title: "Coach Tae | QB Training & DMV Attack",

  description:
    "Quarterback development, private and group training, DMV Attack 7v7, mentorship, and athlete development throughout the DMV.",

  openGraph: {
    title: "Coach Tae | QB Training & DMV Attack",
    description:
      "Quarterback development, private and group training, DMV Attack 7v7, mentorship, and athlete development throughout the DMV.",
    url: "https://coachtaeqb.com",
    siteName: "Coach Tae",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Coach Tae | QB Training & DMV Attack",
    description:
      "Quarterback development, private and group training, DMV Attack 7v7, mentorship, and athlete development throughout the DMV.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}