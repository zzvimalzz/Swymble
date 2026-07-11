type DesktopFooterProps = {
  baseUrl: string;
  brandName: string;
};

export default function DesktopFooter({ baseUrl, brandName }: DesktopFooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-logo-center" data-cursor="hover">
        <img
          src={`${baseUrl}images/logo-with-name.png`}
          alt={`${brandName} Logo`}
          className="footer-logo-full-centered"
          loading="lazy"
          width={969}
          height={466}
        />
      </div>

      <div className="footer-bottom-bar">
        <div className="footer-brand">
          <span className="footer-copyright" data-cursor="hover">
            &copy; {new Date().getFullYear()} {brandName}
          </span>
        </div>

        <div className="footer-status">
          <span className="status-dot" />
          <span className="status-text">AVAILABLE FOR WORK</span>
        </div>

        <div className="footer-legal">
          <span data-cursor="hover">BUILT WITH PASSION</span>
        </div>
      </div>
    </footer>
  );
}
