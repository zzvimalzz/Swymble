type DesktopFooterProps = {
  baseUrl: string;
  brandName: string;
  setIsHovering: (value: boolean) => void;
};

export default function DesktopFooter({ baseUrl, brandName, setIsHovering }: DesktopFooterProps) {
  return (
    <footer className="site-footer">
      <div
        className="footer-logo-center"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img
          src={`${baseUrl}logo-with-name.png`}
          alt={`${brandName} Logo`}
          className="footer-logo-full-centered"
        />
      </div>

      <div className="footer-bottom-bar">
        <div
          className="footer-brand"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <span className="footer-copyright">
            &copy; {new Date().getFullYear()} {brandName}
          </span>
        </div>

        <div className="footer-status">
          <span className="status-dot" />
          <span className="status-text">AVAILABLE FOR WORK</span>
        </div>

        <div className="footer-legal">
          <span onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
            BUILT WITH PASSION
          </span>
        </div>
      </div>
    </footer>
  );
}
