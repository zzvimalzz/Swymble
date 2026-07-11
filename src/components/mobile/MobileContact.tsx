import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileSiteFooter from './MobileSiteFooter';
import { SWYMBLE_DATA } from '../../data/config';
import { Rocket } from 'lucide-react';
import { isMailtoLink } from '../../utils/mailto';
import { useContactForm } from '../../hooks/useContactForm';

export default function MobileContact() {
  const [showRocket, setShowRocket] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const {
    name,
    nameError,
    handleNameChange,
    project,
    projectError,
    handleProjectChange,
    email,
    emailError,
    handleEmailChange,
    formStatus,
    formMessage,
    handleFormSubmit,
  } = useContactForm();

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
      <div className="mobile-contact-form-block" style={{ width: '100%' }}>
        <div className="section-header">
          <h2>LET&apos;S TALK</h2>
        </div>
        <p className="mobile-contact-intro">{SWYMBLE_DATA.contactIntro}</p>

        <form className="mobile-contact-form" onSubmit={handleFormSubmit} noValidate>
          <div className="mobile-contact-field">
            <label htmlFor="mobile-contact-name">Name</label>
            <input
              id="mobile-contact-name"
              type="text"
              placeholder="Your name"
              className={nameError ? 'error' : ''}
              value={name}
              onChange={handleNameChange}
              autoComplete="name"
              maxLength={60}
              required
            />
            {nameError && <span className="mobile-contact-field-error">{nameError}</span>}
          </div>

          <div className="mobile-contact-field">
            <label htmlFor="mobile-contact-email">Email</label>
            <input
              id="mobile-contact-email"
              type="email"
              placeholder="you@example.com"
              className={emailError ? 'error' : ''}
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              inputMode="email"
              maxLength={120}
              required
            />
            {emailError && <span className="mobile-contact-field-error">{emailError}</span>}
          </div>

          <div className="mobile-contact-field">
            <label htmlFor="mobile-contact-project">What do you want to build?</label>
            <input
              id="mobile-contact-project"
              type="text"
              placeholder="Website / app / brand"
              className={projectError ? 'error' : ''}
              value={project}
              onChange={handleProjectChange}
              autoComplete="off"
              maxLength={120}
              required
            />
            {projectError && <span className="mobile-contact-field-error">{projectError}</span>}
          </div>

          <input
            type="text"
            name="website"
            className="mobile-contact-honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {formMessage && (
            <p className={`mobile-contact-feedback ${formMessage.type}`} role="status" aria-live="polite">
              {formMessage.text}
            </p>
          )}

          <button type="submit" className="mobile-contact-submit" disabled={formStatus === 'sending'}>
            {formStatus === 'sending' ? 'SENDING...' : 'SEND MESSAGE'}
          </button>
        </form>
      </div>

      <div className="mobile-find-me" style={{ width: '100%' }}>
        <div className="section-header">
          <h2>FIND ME</h2>
        </div>
        <div className="socials-list" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {SWYMBLE_DATA.socials.map((social) => {
            const Icon = social.icon;
            const isMailto = isMailtoLink(social.link);
            return (
              <a
                key={social.id}
                href={social.link}
                {...(isMailto ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
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
