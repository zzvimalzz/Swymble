import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileSiteFooter from './MobileSiteFooter';
import { SWYMBLE_DATA } from '../../data/config';
import { Rocket } from 'lucide-react';
import { buildGmailComposeUrl, isMailtoLink } from '../../utils/mailto';

export default function MobileContact() {
  const [showRocket, setShowRocket] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

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

  return (
    <div className="mobile-contact-wrapper" id="contact" style={{ paddingBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="mobile-find-me" style={{ width: '100%' }}>
        <div className="section-header">
          <h2>FIND ME</h2>
        </div>
        <div className="socials-list" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {SWYMBLE_DATA.socials.map((social) => {
            const Icon = social.icon;
            const isMailto = isMailtoLink(social.link);
            const socialHref = isMailto ? buildGmailComposeUrl(social.link) : social.link;
            return (
              <a
                key={social.id}
                href={socialHref}
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

      <MobileSiteFooter />

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
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Rocket size={30} style={{ transform: 'rotate(-45deg)' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
