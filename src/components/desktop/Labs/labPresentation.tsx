import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { SwymbleLab } from '../../../data/types';
import { isMailtoLink } from '../../../utils/mailto';

/** Status to CSS modifier. Typed against SwymbleLab['status'], so adding a status without giving
 *  it a colour is a compile error rather than a silently unstyled badge. */
export const STATUS_MODIFIER: Record<SwymbleLab['status'], string> = {
  Live: 'live',
  'In Development': 'development',
  'Private Beta': 'beta',
};

/** The lab's own actions, falling back to its single primaryAction. */
export const labActionsOf = (lab: SwymbleLab) =>
  lab.actions?.length ? lab.actions : lab.primaryAction ? [lab.primaryAction] : [];

function ActionLink({ href, label, className }: { href: string; label: string; className: string }) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    );
  }

  const isMailto = isMailtoLink(href);

  return (
    <a
      href={href}
      {...(isMailto ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      className={className}
    >
      {label}
    </a>
  );
}

/**
 * The button row at the foot of a lab, shared by the desktop card and the mobile accordion so
 * the two can't drift on which lab offers which action.
 */
export function LabActions({
  lab,
  showDetailLink = false,
}: {
  lab: SwymbleLab;
  /** Adds a link through to /labs/<id>. Set on the index (card and accordion), left off on the
   *  detail page itself, which would otherwise link to where the reader already is. */
  showDetailLink?: boolean;
}): ReactNode {
  const actions = labActionsOf(lab);
  const blogHref = lab.blogCategoryId
    ? `/blog?category=${encodeURIComponent(lab.blogCategoryId)}`
    : lab.blogLink;
  const hasAnyAction = actions.length > 0 || Boolean(blogHref) || showDetailLink;

  return (
    <div className="lab-actions">
      {showDetailLink && (
        <Link to={`/labs/${lab.id}`} className="lab-btn">
          FULL DETAILS
        </Link>
      )}

      {actions.map((action, index) => (
        <ActionLink
          key={`${lab.id}-${action.label}`}
          href={action.href}
          label={action.label}
          className={`lab-btn${showDetailLink || action.variant === 'secondary' || index > 0 ? ' secondary' : ''}`}
        />
      ))}

      {blogHref && (
        <Link to={blogHref} className={`lab-btn ${showDetailLink || actions.length > 0 ? 'secondary' : ''}`}>
          READ BLOG
        </Link>
      )}

      {!hasAnyAction && <div className="lab-btn disabled">NO PUBLIC ACTION</div>}
    </div>
  );
}
