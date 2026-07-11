import { motion } from 'framer-motion';
import DesktopContactSection from '../../components/desktop/DesktopContactSection';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-contact.css';

export default function DesktopContact() {
  return (
    <section className="layout-content desktop-page-layout desktop-contact-page">
      <div className="section-header">
        <h1>LET'S TALK</h1>
      </div>

      <motion.p
        className="contact-intro"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {SWYMBLE_DATA.contactIntro}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.8 }}
      >
        <DesktopContactSection headline="START A PROJECT" />
      </motion.div>

      <motion.div
        className="contact-availability-strip"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <span className="status-dot" />
        <span className="contact-availability-text">AVAILABLE FOR NEW PROJECTS</span>
      </motion.div>
    </section>
  );
}
