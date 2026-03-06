import { motion } from 'framer-motion';
import { SWYMBLE_DATA } from '../../data/config';

export default function DesktopAbout() {
  const { title, paragraphs } = SWYMBLE_DATA.about;

  return (
    <section className="layout-content desktop-page-layout">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      
      <div className="page-content-wrapper">
        <div className="about-text-content">
          {paragraphs.map((para, i) => (
            <motion.p 
              key={i} 
              style={{ marginTop: i > 0 ? '2rem' : '0', fontSize: '1.2rem', lineHeight: '1.8' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.8 }}
            >
              {para}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
