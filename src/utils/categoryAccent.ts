import type { CSSProperties } from 'react';

type CategoryAccentStyle = CSSProperties & {
  '--category-accent'?: string;
  '--category-accent-soft'?: string;
  '--category-accent-strong'?: string;
  '--category-accent-muted'?: string;
};

const DEFAULT_CATEGORY_ACCENT = '#efff04';

function selectAccentColor(override?: string) {
  if (override) {
    return override;
  }

  return DEFAULT_CATEGORY_ACCENT;
}

function hexToRgb(hex: string) {
  const normalizedHex = hex.replace('#', '');
  const safeHex = normalizedHex.length === 3
    ? normalizedHex
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalizedHex;

  const parsedValue = Number.parseInt(safeHex, 16);

  return {
    red: (parsedValue >> 16) & 255,
    green: (parsedValue >> 8) & 255,
    blue: parsedValue & 255,
  };
}

function withAlpha(hex: string, alpha: number) {
  const { red, green, blue } = hexToRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getCategoryAccentStyle(category: string, override?: string): CategoryAccentStyle {
  void category;
  const accent = selectAccentColor(override);

  return {
    '--category-accent': accent,
    '--category-accent-soft': withAlpha(accent, 0.12),
    '--category-accent-strong': withAlpha(accent, 0.42),
    '--category-accent-muted': withAlpha(accent, 0.18),
  };
}