import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arrows Puzzles",
  description:
    "A grid of arrows, each one blocking some of the others. Tap an arrow to slide it off the board, and work out the order that frees everything.",
  applicationName: "Arrows",
  metadataBase: new URL("https://arrows.taiotech.com"),
  openGraph: {
    title: "Arrows Puzzles",
    description: "Slide every arrow off the board. Order is the puzzle.",
    url: "https://arrows.taiotech.com",
    siteName: "Arrows",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The board sits under the thumb and the controls sit at the bottom edge, so
  // a zoomed page would hide them. Pinch zoom is suppressed for that reason.
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
