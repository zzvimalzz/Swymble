import type { ReactNode } from 'react';
import StatusLED from './StatusLED';
import WaveGlyph from './WaveGlyph';

/**
 * SystemWindow — the universal Swymble OS content frame. Honest chrome only:
 * the title bar carries the wave glyph (the totem as "app icon"), a mono title,
 * and a real status LED. No fake close/minimize buttons — every element of the
 * chrome means something.
 */

type SystemWindowProps = {
  title: string;
  status: 'Live' | 'In Development' | 'Private Beta' | 'Pending';
  /** Preview area content (image, canvas, anything). */
  children: ReactNode;
  /** Footer left: category chip. */
  category?: string;
  categoryColor?: string;
  /** Footer right: client name, year, or updated line. */
  meta?: string;
  /** Renders the redaction treatment over the preview (restricted work). */
  redacted?: boolean;
  size?: 'featured' | 'standard';
  className?: string;
};

export function windowGlyph() {
  return <WaveGlyph className="system-window-glyph" />;
}

export default function SystemWindow({
  title,
  status,
  children,
  category,
  categoryColor,
  meta,
  redacted = false,
  size = 'standard',
  className,
}: SystemWindowProps) {
  return (
    <div
      className={`system-window system-window--${size} ${redacted ? 'system-window--redacted' : ''} ${className ?? ''}`.trim()}
    >
      <div className="system-window-titlebar">
        {windowGlyph()}
        <span className="system-window-title">{title}</span>
        <StatusLED status={status} />
      </div>

      <div className="system-window-preview">
        {children}
        {redacted && (
          <div className="system-window-redaction" aria-hidden="true">
            <span className="system-window-access">ACCESS: PRIVATE BETA</span>
          </div>
        )}
      </div>

      {(category || meta) && (
        <div className="system-window-footer">
          {category && (
            <span
              className="system-window-category"
              style={categoryColor ? { color: categoryColor } : undefined}
            >
              {category}
            </span>
          )}
          {meta && <span className="system-window-meta">{meta}</span>}
        </div>
      )}
    </div>
  );
}
