/**
 * The package mark: a speech bubble of word-bars with one bar lit. Drawn
 * rather than imported so it takes the page's own ink, accent and lit colours
 * and works in either theme.
 */
export const Mark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    role="img"
    aria-label="spoken-text"
    fill="none"
  >
    <path
      d="M7 3.5H25A4.5 4.5 0 0 1 29.5 8V18A4.5 4.5 0 0 1 25 22.5H13L8.5 28.2V22.5H7A4.5 4.5 0 0 1 2.5 18V8A4.5 4.5 0 0 1 7 3.5Z"
      stroke="hsl(var(--ink))"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <g fill="hsl(var(--ink))" opacity="0.3">
      <rect x="7" y="7.9" width="6.2" height="2.2" rx="1.1" />
      <rect x="15.2" y="7.9" width="7.8" height="2.2" rx="1.1" />
      <rect x="17.4" y="11.9" width="5.6" height="2.2" rx="1.1" />
    </g>
    <rect
      x="7"
      y="11.9"
      width="8.4"
      height="2.2"
      rx="1.1"
      fill="hsl(var(--accent))"
    />
    <rect
      x="7"
      y="15.9"
      width="6.6"
      height="2.2"
      rx="1.1"
      fill="hsl(var(--lit))"
    />
  </svg>
);
