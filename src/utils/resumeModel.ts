import { formatDateRange } from '../components/desktop/CareerRepository/commitMessage';
import { parseDateKey } from '../components/desktop/CareerRepository/layout';
import type {
  SwymbleCareerNode,
  SwymbleCareerRepository,
  SwymbleResume,
} from '../data/types';

/**
 * Turns the career graph into the flat, newest-first lists a resume reads as.
 *
 * The graph is the single source of truth on purpose. A resume that duplicates its own copy of
 * every job goes stale the first time a role changes and nobody remembers there were two places
 * to edit — so everything here is derived, and data/resume.ts only supplies the parts a CV needs
 * that the site doesn't (summary, tighter bullets, skill groups, exclusions).
 */
export type ResumeEntry = {
  node: SwymbleCareerNode;
  /** Branch the entry came from — 'employment', 'swymble', 'products', … */
  branchId: string;
  branchLabel: string;
  /** 'Apr 2025 → Sep 2026', or just 'Apr 2025' for a point-in-time entry. */
  dateRange: string;
  /** The overlay's bullets if it has any, otherwise the node's own description. */
  bullets: string[];
  tech: string[];
};

export type ResumeModel = {
  /** Jobs, newest first. */
  experience: ResumeEntry[];
  /** Degrees, newest first, minus anything the overlay excludes. */
  education: ResumeEntry[];
  /** Client builds and shipped products, newest first. */
  projects: ResumeEntry[];
  /** Calendar year of the earliest role, used for the "years shipping" stat. */
  firstRoleYear: number;
};

const toBullets = (node: SwymbleCareerNode, overrides: Record<string, string[]>): string[] => {
  const override = overrides[node.id];
  if (override && override.length > 0) {
    return override;
  }
  if (Array.isArray(node.description)) {
    return node.description;
  }
  return node.description ? [node.description] : [];
};

export function buildResumeModel(
  career: SwymbleCareerRepository,
  resume: SwymbleResume,
): ResumeModel {
  const excluded = new Set(resume.excludeNodeIds);

  const entries: ResumeEntry[] = career
    .flatMap((branch) =>
      branch.nodes
        .filter((node) => !excluded.has(node.id))
        .map((node) => ({
          node,
          branchId: branch.id,
          branchLabel: branch.label,
          dateRange: formatDateRange(node),
          bullets: toBullets(node, resume.bullets),
          tech: node.tech ?? [],
        })),
    )
    // Newest first, the order a resume reads in.
    .sort((a, b) => parseDateKey(b.node.date) - parseDateKey(a.node.date));

  const experience = entries.filter((entry) => entry.node.type === 'employment');
  const education = entries.filter((entry) => entry.node.type === 'education');
  const projects = entries.filter((entry) => entry.node.type === 'project');

  // Oldest role on the list — the internship counts, it was paid production work.
  const firstRoleYear = experience.length
    ? Math.min(...experience.map((entry) => Number(entry.node.date.split('-').pop())))
    : new Date().getFullYear();

  return { experience, education, projects, firstRoleYear };
}
