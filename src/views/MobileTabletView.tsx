import { SWYMBLE_DATA } from '../data/config';
import '../styles/mobile-tablet.css';

export default function MobileTabletView() {
  return (
    <div className="mobile-view">
      <header className="mobile-hero" id="top">
        <img src="/white-logo.png" alt="Swymble Logo" className="mobile-logo" />
        <h1 className="mobile-title">{SWYMBLE_DATA.name}</h1>
      </header>
    </div>
  );
}
