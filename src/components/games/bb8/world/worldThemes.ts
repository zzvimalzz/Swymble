// Four biome "skins" for bb8World.ts's generic mountain/dune-shaped state
// (stars, ridge layers, ground props, landmarks) — a theme only changes
// palette + silhouette style, never the underlying procedural geometry, so
// switching biomes on click is instant and free (no world regeneration).

export type DuneStyle = 'dune' | 'peak';

export interface WorldTheme {
  name: string;
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  sunPrimary: string;
  sunGlow: string;
  /** null = a single sun/moon instead of a Tatooine-style binary pair. */
  sunSecondary: string | null;
  /** "r, g, b" triplet — stars are drawn as rgba(starColor, opacity). */
  starColor: string;
  /** Near/far ridge silhouette: soft rolling 'dune' hump, or a jagged 'peak'. */
  duneStyle: DuneStyle;
  farDuneColor: string;
  nearDuneColor: string;
  farPeakColor: string;
  groundTop: string;
  groundBottom: string;
  propBlob: string;
  propTuft: string;
  landmarkColor: string;
}

export const WORLD_THEMES: WorldTheme[] = [
  {
    name: 'desert',
    skyTop: '#241a35',
    skyMid: '#6b3f45',
    skyHorizon: '#d8a35f',
    sunPrimary: '#ffb347',
    sunGlow: 'rgba(255, 200, 120, 0.16)',
    sunSecondary: '#fff1c2',
    starColor: '255, 255, 255',
    duneStyle: 'dune',
    farDuneColor: 'rgba(190, 140, 95, 0.55)',
    nearDuneColor: '#8a5a34',
    farPeakColor: 'rgba(120, 90, 70, 0.35)',
    groundTop: '#caa06a',
    groundBottom: '#6b4726',
    propBlob: 'rgba(70, 50, 34, 0.5)',
    propTuft: 'rgba(60, 70, 40, 0.6)',
    landmarkColor: 'rgba(28, 20, 14, 0.8)',
  },
  {
    name: 'ice',
    skyTop: '#0c1a2e',
    skyMid: '#274866',
    skyHorizon: '#bcd9e6',
    sunPrimary: '#eaf6ff',
    sunGlow: 'rgba(200, 230, 255, 0.2)',
    sunSecondary: null,
    starColor: '255, 255, 255',
    duneStyle: 'peak',
    farDuneColor: 'rgba(190, 215, 230, 0.55)',
    nearDuneColor: '#9fc2d6',
    farPeakColor: 'rgba(200, 220, 235, 0.4)',
    groundTop: '#eaf4fb',
    groundBottom: '#a9c4d6',
    propBlob: 'rgba(170, 200, 220, 0.6)',
    propTuft: 'rgba(210, 235, 245, 0.55)',
    landmarkColor: 'rgba(30, 40, 55, 0.75)',
  },
  {
    name: 'forest',
    skyTop: '#122318',
    skyMid: '#2f4a2f',
    skyHorizon: '#a9c98a',
    sunPrimary: '#fef3c2',
    sunGlow: 'rgba(230, 240, 180, 0.16)',
    sunSecondary: null,
    starColor: '235, 245, 225',
    duneStyle: 'dune',
    farDuneColor: 'rgba(70, 100, 60, 0.55)',
    nearDuneColor: '#345c34',
    farPeakColor: 'rgba(40, 70, 45, 0.4)',
    groundTop: '#6f8a4a',
    groundBottom: '#3c4d28',
    propBlob: 'rgba(60, 45, 30, 0.55)',
    propTuft: 'rgba(40, 80, 35, 0.65)',
    landmarkColor: 'rgba(18, 24, 14, 0.8)',
  },
  {
    name: 'volcanic',
    skyTop: '#1a0806',
    skyMid: '#4a1408',
    skyHorizon: '#e8602a',
    sunPrimary: '#ff5a1f',
    sunGlow: 'rgba(255, 110, 40, 0.22)',
    sunSecondary: null,
    starColor: '255, 200, 170',
    duneStyle: 'peak',
    farDuneColor: 'rgba(60, 30, 22, 0.6)',
    nearDuneColor: '#2c1712',
    farPeakColor: 'rgba(40, 18, 14, 0.5)',
    groundTop: '#3a1a10',
    groundBottom: '#170905',
    propBlob: 'rgba(255, 110, 40, 0.55)',
    propTuft: 'rgba(90, 40, 24, 0.6)',
    landmarkColor: 'rgba(10, 6, 4, 0.85)',
  },
];
