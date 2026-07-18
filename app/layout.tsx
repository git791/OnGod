import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OnGod — Squad Prediction Markets",
  description:
    "Turn any group-chat claim into a real on-chain prediction market in 10 seconds. On God or Cap — let the odds decide.",
  keywords: ["prediction market", "friends", "bets", "on god", "cap"],
  openGraph: {
    title: "OnGod — Squad Prediction Markets",
    description: "Turn group-chat bets into real stakes. Powered by Bento.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&family=Permanent+Marker&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="app-background text-soot min-h-screen antialiased">
        <svg width="0" height="0" style={{ display: "none" }}>
          <filter id="grain-texture" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise"/>
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0"/>
          </filter>
          <filter id="halftone-dots">
            <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="1" stitchTiles="stitch" result="noise"/>
            <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 8 -4"/>
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
