import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Literata } from "next/font/google";
import "./globals.css";

/**
 * Three faces, and each one has the job the product has.
 *
 * Archivo is the display voice — a grotesque with a width axis, set wide and
 * heavy so the headline reads like the legend printed on studio hardware. It
 * appears twice on the page and nowhere else.
 *
 * Literata is the reading voice. It was drawn for long-form reading on screen,
 * which is exactly what someone does while a passage is read to them, and its
 * even colour and squared serifs hold a per-word highlight without going lumpy.
 *
 * IBM Plex Mono is the machine voice: code, timecode, labels, and the package
 * name itself, which is an npm identifier before it is a word.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["wdth"],
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

const TITLE = "spoken-text — hear your text read, watch each word light up";
const DESCRIPTION =
  "A React component that reads a passage aloud and highlights every word as it is spoken. Bring any speech and transcription; timings are aligned to what you render and cached.";
// The demo has lived at this address since before the package was named, and
// it is linked to from elsewhere. Renaming the Vercel project would break it.
const SITE_URL = "https://talksync-six.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
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
      className={`${archivo.variable} ${literata.variable} ${plexMono.variable}`}
    >
      <body className="font-serif">{children}</body>
    </html>
  );
}
