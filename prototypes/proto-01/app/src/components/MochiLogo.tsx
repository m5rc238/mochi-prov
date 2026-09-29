/** The product mark. A mochi is a soft, pillowy shape, so the mark is built
 *  from the system's pill radius rather than a hard-edged box, and the colours
 *  come from Palette A accents — fills only, never text. */
export const MochiLogo = ({ size = 26 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 26 26"
    aria-hidden="true"
    focusable="false"
    className="shrink-0"
  >
    <ellipse cx="13" cy="13.5" rx="10.5" ry="9.5" fill="var(--color-accent-mint)" />
    <ellipse cx="13" cy="8.5" rx="7" ry="3.5" fill="#ffffff" opacity="0.45" />
    <circle cx="9.5" cy="13" r="3.25" fill="var(--color-accent-pink)" />
    <circle cx="16.75" cy="16.5" r="1.75" fill="var(--color-accent-peri)" />
  </svg>
)
