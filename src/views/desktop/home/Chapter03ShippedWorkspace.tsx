import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SmartImage from '../../../components/SmartImage';
import { MOTION, EASE } from '../../../components/motion/motionTokens';
import { SWYMBLE_DATA } from '../../../data/config';
import { getCategoryAccentStyle } from '../../../utils/categoryAccent';

/**
 * Chapter 03 — shipped work. Interim: the existing project carousel, extracted
 * from DesktopHome. The next pass replaces this with the unified workspace
 * (client work + labs in SystemWindow chrome).
 */
export default function Chapter03ShippedWorkspace() {
  const navigate = useNavigate();

  return (
    <div className="work-carousel-section">
      <div className="section-header">
        <h2>PROJECTS</h2>
      </div>

      <div className={`carousel-container ${SWYMBLE_DATA.projects.length <= 3 ? 'grid-mode' : ''}`}>
        <div className={`carousel-inner ${SWYMBLE_DATA.projects.length <= 3 ? 'grid-mode' : ''}`}>
          {SWYMBLE_DATA.projects.map((workItem, index) => {
            const projectId = workItem.title.replace(/\s+/g, '-').toLowerCase();
            const categoryAccentStyle = getCategoryAccentStyle(workItem.category, workItem.categoryColor);
            return (
              <motion.div
                key={workItem.title}
                className="carousel-card"
                data-cursor="hover"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '50px' }}
                transition={{ delay: index * 0.1, duration: MOTION.scene, ease: EASE.standard }}
                onClick={() => navigate(`/projects#${projectId}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="carousel-image-wrapper">
                  <SmartImage
                    src={workItem.image}
                    alt={workItem.title}
                    className="carousel-image"
                    draggable="false"
                  />
                </div>
                <div className="carousel-info">
                  <h3 className="w-client">{workItem.title}</h3>
                  <div className="carousel-meta">
                    <span className="w-category category-accent-text" style={categoryAccentStyle}>{workItem.category}</span>
                    {workItem.client && <span className="w-impact">{workItem.client}</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
