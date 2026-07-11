import { motion } from 'framer-motion';
import Reveal from '../../components/motion/Reveal';
import { SWYMBLE_DATA } from '../../data/config';

export default function DesktopAbout() {
  const { title, paragraphs } = SWYMBLE_DATA.about;

  return (
    <section className="layout-content desktop-page-layout">
      <div className="section-header">
        <h1>{title}</h1>
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

        <Reveal className="about-stack" y={24} margin="-80px">
          <h2 className="about-stack__heading">Stack</h2>
          <div className="about-stack__grid">
            {SWYMBLE_DATA.skills.map((category) => (
              <div className="about-stack__category" key={category.category}>
                <span className="about-stack__label">{category.category}</span>
                <div className="about-stack__chips">
                  {category.items.map((item) => (
                    <span className="about-stack__chip" key={item.name}>
                      <span className="about-stack__dot" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
