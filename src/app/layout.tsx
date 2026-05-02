import type { Metadata } from "next";
import { Fraunces, Newsreader } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "TalkSync — A Reading Companion",
  description:
    "Type a passage. Listen along. Words light up as they're spoken.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${newsreader.variable}`}>
      <body className="font-serif">
        <div
          aria-hidden
          className="paper-grain pointer-events-none fixed inset-0 z-0 opacity-[0.07] mix-blend-multiply"
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
