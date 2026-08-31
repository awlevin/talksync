import type { Metadata } from "next";
import { IBM_Plex_Mono, Literata, Space_Grotesk } from "next/font/google";
import "./globals.css";

/**
 * Three faces, and each one has the job the product has.
 *
 * Space Grotesk is the display voice. It is the proportional cut drawn from
 * Space Mono, so its flat terminals and squared bowls carry the same machine
 * character as the code on the page without being stretched to get it.
 *
 * Literata is the reading voice. It was drawn for long-form reading on screen,
 * which is exactly what someone does while a passage is read to them, and its
 * even colour and squared serifs hold a per-word highlight without going lumpy.
 *
 * IBM Plex Mono is the machine voice: code, timecode, labels, and the package
 * name itself, which is an npm identifier before it is a word.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

const TITLE = "spoken-text: hear your text read, watch each word light up";
const DESCRIPTION =
  "A React component that reads a passage aloud and highlights every word as it is spoken. Bring any speech and transcription you like.";

/**
 * The only place the site's public origin is decided.
 *
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL to the project's production host
 * at build time, so renaming the project moves the site without a code change.
 * Set NEXT_PUBLIC_SITE_URL to pin a custom domain instead. Everything else on
 * the page uses relative URLs, which Next resolves against this.
 */
const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "spoken-text",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${literata.variable} ${plexMono.variable}`}
    >
      <body className="font-serif">{children}</body>
    </html>
  );
}
