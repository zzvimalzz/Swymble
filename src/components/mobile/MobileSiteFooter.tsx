import { SWYMBLE_DATA } from '../../data/config';

type MobileSiteFooterProps = {
  className?: string;
};

export default function MobileSiteFooter({ className = '' }: MobileSiteFooterProps) {
  const baseUrl = import.meta.env.BASE_URL;
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`mobile-site-footer ${className}`.trim()}>
      <img
        src={`${baseUrl}images/logo-with-name.png`}
        alt={`${SWYMBLE_DATA.name} Logo`}
        className="mobile-site-footer-logo"
        loading="lazy"
        width={969}
        height={466}
      />

      <div className="mobile-site-footer-meta">
        <span className="mobile-site-footer-status">
          <span className="mobile-site-footer-dot" aria-hidden="true" />
          AVAILABLE FOR WORK
        </span>
        <span>BUILT WITH PASSION</span>
        <span>&copy; {currentYear} {SWYMBLE_DATA.name}</span>
      </div>
    </footer>
  );
}