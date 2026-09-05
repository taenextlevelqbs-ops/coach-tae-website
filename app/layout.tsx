import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://coachtaeqb.com"),

  title: {
    default: "Coach Tae | QB Development",
    template: "%s | Coach Tae",
  },

  description:
    "Quarterback development and private QB training in Northern Virginia and the DMV. Develop. Compete. Lead.",

  applicationName: "Coach Tae QB Development",

  alternates: {
    canonical: "/",
  },

  keywords: [
    "Coach Tae",
    "QB Training",
    "Quarterback Training",
    "Quarterback Development",
    "Northern Virginia QB Training",
    "DMV QB Training",
    "Virginia Quarterback Coach",
    "Youth Football Training",
  ],

  authors: [
    {
      name: "Coach Tae",
      url: "https://coachtaeqb.com",
    },
  ],

  creator: "Coach Tae",

  openGraph: {
    title: "Coach Tae | QB Development",

    description:
      "Quarterback development and private QB training in Northern Virginia and the DMV. Develop. Compete. Lead.",

    url: "https://coachtaeqb.com",

    siteName: "Coach Tae QB Development",

    type: "website",

    locale: "en_US",

    images: [
      {
        url: "/opengraph-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Coach Tae QB Development",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Coach Tae | QB Development",

    description:
      "Quarterback development and private QB training in Northern Virginia and the DMV.",

    images: [
      "/opengraph-image.jpeg",
    ],
  },

  icons: {
    icon: [
      {
        url: "/CTLOGO.jpeg",
        type: "image/jpeg",
      },
    ],

    shortcut: "/CTLOGO.jpeg",

    apple: "/CTLOGO.jpeg",
  },

  robots: {
    index: true,
    follow: true,
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
