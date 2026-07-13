import { motion } from 'framer-motion';
import StatusLine from '../system/StatusLine';
import { SWYMBLE_DATA } from '../../data/config';
import { useContactForm } from '../../hooks/useContactForm';
import { isMailtoLink } from '../../utils/mailto';

// Machine-voice submit states: the button itself acknowledges receipt.
const SUBMIT_LABEL: Record<string, string> = {
  idle: 'SEND MESSAGE',
  sending: 'TRANSMITTING…',
  success: 'ACK ✓ MESSAGE QUEUED',
  error: 'SEND MESSAGE',
};

type DesktopContactSectionProps = {
  headline?: string;
};

export default function DesktopContactSection({ headline = "LET'S TALK" }: DesktopContactSectionProps) {
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

  return (
    <motion.div
      className="footer-cta"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="footer-grid">
        <div id="work-with-me" className="form-container">
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <h2>{headline}</h2>
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
              className={`submit-btn ${formStatus === 'success' ? 'submit-btn--ack' : ''}`.trim()}
              disabled={formStatus === 'sending'}
            >
              {SUBMIT_LABEL[formStatus]}
            </button>
          </form>
        </div>

        <div className="find-me-container">
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <h2>FIND ME</h2>
          </div>

          <div className="contact-availability">
            <StatusLine variant="compact" />
            <p className="contact-reply-note">replies within 24 hours</p>
          </div>

          <div className="socials-list">
            {SWYMBLE_DATA.socials.map((social) => {
              const Icon = social.icon;
              const isMailto = isMailtoLink(social.link);
              return (
                <a
                  key={social.id}
                  href={social.link}
                  {...(isMailto ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  className="social-link w-client"
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
  );
}
