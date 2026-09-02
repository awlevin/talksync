import type { SVGProps } from "react";

/**
 * The two glyphs `Player` needs, drawn inline. A play triangle and a pause
 * bar are not worth an icon dependency in a consumer's bundle, so the paths
 * are copied here (from Lucide, ISC licensed) rather than imported.
 */
const base: SVGProps<SVGSVGElement> = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden {...base} {...props}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

export const PauseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden {...base} {...props}>
    <rect x="14" y="4" width="4" height="16" rx="1" />
    <rect x="6" y="4" width="4" height="16" rx="1" />
  </svg>
);
