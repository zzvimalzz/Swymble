import { motion, MotionValue } from 'framer-motion';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ParallaxMarquee from '../../components/desktop/ParallaxMarquee';
import ProximityCard from '../../components/desktop/ProximityCard';
import { SWYMBLE_DATA } from '../../data/config';
import { buildGmailComposeUrl, isMailtoLink } from '../../utils/mailto';

type DesktopHomeProps = {
  baseUrl: string;
  heroY: MotionValue<number>;
  heroOpacity: MotionValue<number>;
  mousePos: { x: number; y: number };
  name: string;
  nameError: string;
  handleNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  project: string;
  projectError: string;
  handleProjectChange: (e: ChangeEvent<HTMLInputElement>) => void;
  email: string;
  emailError: string;
  handleEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  formStatus: 'idle' | 'sending' | 'success' | 'error';
  formMessage: { type: 'success' | 'error'; text: string } | null;
  handleFormSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setIsHovering: (val: boolean) => void;
};

export default function DesktopHome({
  baseUrl,
  heroY,
  heroOpacity,
  mousePos,
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
  setIsHovering,
}: DesktopHomeProps) {
  const navigate = useNavigate();

  return (
    <>
      <motion.section className="hero-section" style={{ y: heroY, opacity: heroOpacity }}>
        <div className="hero-bg-logo">
          <img src={`${baseUrl}white-logo.png`} alt="Swymble Background Logo" />
        </div>

        <h1
          className="hero-title glitch-mega"
          data-text={SWYMBLE_DATA.name}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {SWYMBLE_DATA.name}
        </h1>

        <motion.p
          className="hero-tagline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {SWYMBLE_DATA.tagline}
        </motion.p>
      </motion.section>

      <ParallaxMarquee text={SWYMBLE_DATA.marquee} setIsHovering={setIsHovering} />

      <section className="layout-content">
        <div className="section-header">
          <h2>What I Do</h2>
        </div>

        <div className="services-grid">
          {SWYMBLE_DATA.whatIDo.map((service, index) => (
            <ProximityCard key={service.title} service={service} index={index} mousePos={mousePos} />
          ))}
        </div>

        <div className="work-carousel-section">
          <div className="section-header">
            <h2>PROJECTS</h2>
          </div>

          <div className={`carousel-container ${SWYMBLE_DATA.projects.length <= 3 ? 'grid-mode' : ''}`}>
            <div className={`carousel-inner ${SWYMBLE_DATA.projects.length <= 3 ? 'grid-mode' : ''}`}>
              {SWYMBLE_DATA.projects.map((workItem, index) => {
                const projectId = workItem.title.replace(/\s+/g, '-').toLowerCase();
                return (
                  <motion.div
                    key={workItem.title}
                    className="carousel-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '50px' }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    onClick={() => navigate(`/projects#${projectId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="carousel-image-wrapper">
                      <img
                        src={workItem.image}
                        alt={workItem.title}
                        className="carousel-image"
                        draggable="false"
                      />
                    </div>
                    <div className="carousel-info">
                      <h3 className="w-client">{workItem.title}</h3>
                      <div className="carousel-meta">
                        <span className="w-category">{workItem.category}</span>
                        {workItem.client && <span className="w-impact">{workItem.client}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="info-row">
          <div className="info-column" style={{ width: '100%' }}>
            <div className="section-header">
              <h2>TECH & TOOLS</h2>
            </div>

            <div className="skills-container">
              {SWYMBLE_DATA.skills.map((skillCategory) => (
                <div key={skillCategory.category} className="skill-category">
                  <h3 className="w-category mb-2">{skillCategory.category}</h3>

                  <div className="skill-bar-wrapper">
                    {skillCategory.items.map((item, itemIndex) => (
                      <div
                        key={`${item.name}-${itemIndex}`}
                        className="skill-segment"
                        style={{ width: `${item.level}%`, backgroundColor: item.color }}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                      >
                        <div className="skill-tooltip">
                          <span className="tooltip-name">{item.name}</span>
                          <span className="tooltip-pct">{item.level}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="skill-legend">
                    {skillCategory.items.map((item, itemIndex) => (
                      <div key={`${item.name}-legend-${itemIndex}`} className="skill-legend-item">
                        <span className="skill-dot" style={{ backgroundColor: item.color }} />
                        <span className="skill-legend-name">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="footer-cta"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="footer-grid">
            <div className="form-container">
              <div className="section-header" style={{ marginBottom: '2rem' }}>
                <h2>LET'S TALK</h2>
              </div>

              <form className="first-person-form" onSubmit={handleFormSubmit} noValidate>
                <p className="form-sentence">
                  Hi, my name is{' '}
                  <span className="form-field-wrapper">
                    <input
                      type="text"
                      placeholder="your name"
                      className={`inline-input ${nameError ? 'error' : ''}`}
                      value={name}
                      onChange={handleNameChange}
                      autoComplete="name"
                      maxLength={60}
                      required
                    />
                    {nameError && <span className="custom-error">{nameError}</span>}
                  </span>
                  .
                  <br />
                  I&apos;m looking to build a{' '}
                  <span className="form-field-wrapper">
                    <input
                      type="text"
                      placeholder="website / app / brand"
                      className={`inline-input ${projectError ? 'error' : ''}`}
                      value={project}
                      onChange={handleProjectChange}
                      autoComplete="off"
                      maxLength={120}
                      required
                    />
                    {projectError && <span className="custom-error">{projectError}</span>}
                  </span>
                  .
                  <br />
                  You can reach me at{' '}
                  <span className="form-field-wrapper">
                    <input
                      type="email"
                      placeholder="email address"
                      className={`inline-input ${emailError ? 'error' : ''}`}
                      value={email}
                      onChange={handleEmailChange}
                      autoComplete="email"
                      inputMode="email"
                      maxLength={120}
                      required
                    />
                    {emailError && <span className="custom-error">{emailError}</span>}
                  </span>
                  .
                </p>

                <input
                  type="text"
                  name="website"
                  className="honeypot-field"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {formMessage && (
                  <p className={`form-feedback ${formMessage.type}`} role="status" aria-live="polite">
                    {formMessage.text}
                  </p>
                )}

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={formStatus === 'sending'}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  {formStatus === 'sending' ? 'SENDING...' : 'SEND IT'}
                </button>
              </form>
            </div>

            <div className="find-me-container">
              <div className="section-header" style={{ marginBottom: '2rem' }}>
                <h2>FIND ME</h2>
              </div>

              <div className="socials-list">
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
                      className="social-link w-client"
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                    >
                      <Icon size={32} className="social-icon" />
                      <span>{social.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}