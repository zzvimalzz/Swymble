import type { JSX } from 'react';

const INLINE_TOKEN_REGEX = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|`[^`]+`)/g;

type RichTextClassNames = {
  underline?: string;
  inlineCode?: string;
};

export function clampBlogIndent(indent?: 0 | 1 | 2 | 3) {
  if (indent === undefined) {
    return 0;
  }

  return Math.min(3, Math.max(0, indent));
}

export function normalizeRichText(text: string | string[]) {
  return Array.isArray(text) ? text.join('\n') : text;
}

export function renderInlineRichText(text: string | string[], keyPrefix: string, classNames: RichTextClassNames = {}) {
  const normalizedText = normalizeRichText(text);
  const lines = normalizedText.split('\n');

  return lines.flatMap((line, lineIndex) => {
    const nodes: Array<string | JSX.Element> = [];
    let cursor = 0;

    for (const match of line.matchAll(INLINE_TOKEN_REGEX)) {
      const token = match[0];
      const start = match.index ?? 0;
      const end = start + token.length;

      if (start > cursor) {
        nodes.push(line.slice(cursor, start));
      }

      if (token.startsWith('**') && token.endsWith('**')) {
        nodes.push(<strong key={`${keyPrefix}-b-${lineIndex}-${start}`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('__') && token.endsWith('__')) {
        nodes.push(
          <span className={classNames.underline} key={`${keyPrefix}-u-${lineIndex}-${start}`}>
            {token.slice(2, -2)}
          </span>,
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        nodes.push(<em key={`${keyPrefix}-i-${lineIndex}-${start}`}>{token.slice(1, -1)}</em>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        nodes.push(
          <code className={classNames.inlineCode} key={`${keyPrefix}-c-${lineIndex}-${start}`}>
            {token.slice(1, -1)}
          </code>,
        );
      } else {
        nodes.push(token);
      }

      cursor = end;
    }

    if (cursor < line.length) {
      nodes.push(line.slice(cursor));
    }

    if (lineIndex < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${lineIndex}`} />);
    }

    return nodes;
  });
}
