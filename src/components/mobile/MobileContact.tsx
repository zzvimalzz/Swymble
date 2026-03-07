import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SWYMBLE_DATA } from '../../data/config';
import { Rocket } from 'lucide-react';

export default function MobileContact() {
  const [showRocket, setShowRocket] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const baseUrl = import.meta.env.BASE_URL;

  useEffect(() => {
    const handleScroll = () => {
      setShowRocket(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    setIsLaunching(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
    setTimeout(() => {
      setIsLaunching(false);
    }, 1000);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="mobile-contact-wrapper" id="contact" style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="mobile-find-me" style={{ width: '100%' }}>
        <div className="section-header">
          <h2>FIND ME</h2>
        </div>
        <div className="socials-list" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {SWYMBLE_DATA.socials.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.id}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn"
                aria-label={social.name}
              >
                <Icon size={32} />
              </a>
            );
          })}
        </div>
      </div>

      <footer className="mobile-site-footer" style={{ marginTop: '5rem', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
        <img
          src={`${baseUrl}logo-with-name.png`}
          alt={`${SWYMBLE_DATA.name} Logo`}
          style={{ height: '30px', opacity: 0.8, marginBottom: '1rem' }}
        />
        <div className="footer-status" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
          <span>AVAILABLE FOR WORK</span>
        </div>
        <span>BUILT WITH PASSION</span>
        <span>&copy; {currentYear} {SWYMBLE_DATA.name}</span>
      </footer>

      <AnimatePresence>
        {showRocket && (
          <motion.button
            className="rocket-to-top"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={
              isLaunching
                ? {
                    y: [0, -4, 4, -4, 4, -8, -100],
                    x: [0, -2, 2, -2, 2, 0, 0],
                    opacity: [1, 1, 1, 1, 1, 1, 0]
                  }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={isLaunching ? { duration: 0.6 } : { duration: 0.3 }}
            onClick={scrollToTop}
            whileHover={!isLaunching ? { y: -5 } : {}}
            whileTap={!isLaunching ? { scale: 0.9 } : {}}
            aria-label="Scroll to top"
            style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3.6rem', height: '3.6rem', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
          >
            <Rocket size={30} style={{ transform: 'rotate(-45deg)' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
