/** The control that dismisses a pane.
 *
 * Icon rather than the word "Close" because the word is competing with the
 * column's own label for a header that is already narrow, and because these
 * controls repeat — one per column — in a row a reader learns to scan. The
 * shape is the same everywhere, so the label is carried by `aria-label` and the
 * glyph is hidden from assistive technology. */
export const CloseButton = ({
  label,
  onClick,
  testId,
}: {
  /** What is being closed, in the reader's terms. */
  label: string
  onClick: () => void
  testId: string
}) => (
  <button
    aria-label={label}
    className="action pane-close"
    data-testid={testId}
    onClick={onClick}
    title={label}
    type="button"
  >
    <svg
      aria-hidden="true"
      fill="none"
      height="12"
      viewBox="0 0 12 12"
      width="12"
    >
      <path
        d="M2.5 2.5l7 7M9.5 2.5l-7 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  </button>
)
