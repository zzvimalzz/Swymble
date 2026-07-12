import type { CSSProperties } from 'react';
import { TYPE_MS_PER_CHAR } from '../motion/motionTokens';

/**
 * TerminalBlock — the machine voice as a container. Typing is CSS-only
 * (steps() on width), so screen readers and crawlers always have the full
 * text, and the global reduced-motion kill renders it instantly.
 * Rule from the motion system: at most one typed TerminalBlock per page.
 */

export type TerminalLine = {
  text: string;
  /** prompt = volt prefix line · ok = main text · muted = secondary */
  kind?: 'prompt' | 'ok' | 'muted';
};

type TerminalBlockProps = {
  lines: TerminalLine[];
  /** Animate the type-on. Leave false for any second terminal on a page. */
  typed?: boolean;
  className?: string;
};

export default function TerminalBlock({ lines, typed = true, className }: TerminalBlockProps) {
  let elapsedMs = 0;

  return (
    <div className={`terminal-block ${typed ? 'terminal-block--typed' : ''} ${className ?? ''}`.trim()}>
      {lines.map((line) => {
        const delay = elapsedMs;
        elapsedMs += line.text.length * TYPE_MS_PER_CHAR + 180;
        return (
          <p
            key={line.text}
            className={`terminal-line terminal-line--${line.kind ?? 'ok'}`}
            style={{ '--chars': line.text.length, '--type-delay': `${delay}ms` } as CSSProperties}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
