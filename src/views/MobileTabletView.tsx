import { useState, useEffect } from 'react';
import { SWYMBLE_DATA } from '../data/config';
import MobileServices from '../components/mobile/MobileServices';
import MobileProjects from '../components/mobile/MobileProjects';
import MobileContact from '../components/mobile/MobileContact';
import { ChevronDown } from 'lucide-react';
import '../styles/mobile-tablet.css';

export default function MobileTabletView() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Hide the scroll indicator if user scrolls down more than 50px
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="mobile-view">
      <header className="mobile-hero" id="top">
        <img src="/white-logo.png" alt="Swymble Logo" className="mobile-logo" />
        <h1 className="mobile-title">{SWYMBLE_DATA.name}</h1>
        
        <a href="#services" className={`scroll-indicator ${scrolled ? 'hidden' : ''}`}>
          <span className="scroll-text">Scroll down</span>
          <ChevronDown className="scroll-arrow" size={32} />
        </a>
      </header>

      <section className="mobile-section" id="services-section" style={{ width: '100%' }}>
        <MobileServices whatIDo={SWYMBLE_DATA.whatIDo} />
      </section>

      <section className="mobile-section" id="projects" style={{ width: '100%' }}>
        <MobileProjects projects={SWYMBLE_DATA.projects} />
      </section>

      <section className="mobile-section" id="contact-section" style={{ width: '100%', marginBottom: '4rem' }}>
        <MobileContact />
      </section>
    </div>
  );
}
