/**
 * WaveGlyph — the Swymble wave mark as an inline SVG, used wherever the brand
 * needs to be present without the full wordmark (nav, window title bars, boot).
 * Colour comes from CSS (stroke: currentColor by default).
 */

type WaveGlyphProps = {
  className?: string;
};

export default function WaveGlyph({ className }: WaveGlyphProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" aria-hidden="true" fill="none" stroke="currentColor">
      <path d="M2 9 C 18 1, 34 17, 62 7" />
      <path d="M2 17 C 20 9, 36 25, 62 15" />
      <path d="M2 25 C 22 17, 38 33, 62 23" />
    </svg>
  );
}
