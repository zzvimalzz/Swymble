import type { SwymbleCareerBranch, SwymbleCareerNode } from '../../../data/types';
import { COMMIT_VERB_BY_TYPE } from './constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Deterministic 7-hex-character stand-in for a commit hash. It only has to be stable and look
 * plausible — it is decoration on the log panel, never an identifier anything reads back.
 * (FNV-1a, because it is four lines and has no collisions worth worrying about at this size.)
 */
export const commitSha = (id: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').slice(0, 7);
};

/** 'MM-YYYY' / 'YYYY' → 'Apr 2025' / '2021'. */
export const formatCommitDate = (date: string): string => {
  const parts = date.split('-');
  if (parts.length === 1) return parts[0];
  const [month, year] = parts;
  return `${MONTHS[Number(month) - 1] ?? month} ${year}`;
};

export const formatDateRange = (node: SwymbleCareerNode): string =>
  node.endDate
    ? `${formatCommitDate(node.date)} → ${node.endDate === 'Present' ? 'Present' : formatCommitDate(node.endDate)}`
    : formatCommitDate(node.date);

/** The three parts of a conventional-commit subject, so the log can colour them separately. */
export const commitParts = (node: SwymbleCareerNode, branch: SwymbleCareerBranch) => ({
  verb: COMMIT_VERB_BY_TYPE[node.type],
  scope: branch.label.includes('/') ? (branch.label.split('/').pop() as string) : branch.label,
  subject: node.title,
});

/** Conventional-commit rendering of a career node: `feat(employment): JurisTech`. */
export const commitMessage = (node: SwymbleCareerNode, branch: SwymbleCareerBranch): string => {
  const { verb, scope, subject } = commitParts(node, branch);
  return `${verb}(${scope}): ${subject}`;
};

/** Year a node belongs to, used to group the log. */
export const commitYear = (node: SwymbleCareerNode): string => node.date.split('-').pop() as string;
