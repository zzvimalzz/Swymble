import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { ExternalLink, Info } from 'lucide-react';
import { type SwymbleProject, SWYMBLE_DATA } from '../../data/config';

interface TinderCardProps {
  project: SwymbleProject;
  isFront: boolean;
  onSwipe: () => void;
  index: number;
}

const TinderCard: React.FC<TinderCardProps> = ({ project, isFront, onSwipe, index }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const [tapped, setTapped] = useState(false);

  // Allow clicking/tapping anywhere on the card to flip/show info
  const handleTap = () => {
    if (isFront) {
      setTapped(!tapped);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      onSwipe();
    } else {
      // Snap back if not swiped far enough
      x.set(0);
      y.set(0);
    }
  };

  return (
    <motion.div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: isFront ? 10 : 10 - index,
        x: isFront ? x : 0,
        y: isFront ? y : 0,
        rotate: isFront ? rotate : 0,
        opacity: isFront ? opacity : 1 - index * 0.1,
        scale: isFront ? 1 : 1 - index * 0.05,
      }}
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      className={`tinder-card ${isFront && tapped ? 'flipped' : ''}`}
      onClick={handleTap}
      whileTap={isFront ? { scale: 1.02 } : {}}
      layout
    >
      <div className="card-content">
        {!tapped ? (
          <>
            <img
              src={project.mobileImage || project.landingImage || project.image}
              alt={project.title}
              className="card-image"
              draggable="false"
            />
            <div className="card-overlay">
              <div className="card-header">
                <h3>{project.title}</h3>
                {project.status && (
                  <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                    {project.status}
                  </span>
                )}
              </div>
              <p className="card-category">{project.category}</p>
              <div className="tap-hint">
                <Info size={16} /> Tap for details 
              </div>
            </div>
          </>
        ) : (
          <div className="card-details">
            <div className="details-header">
              <h3>{project.title}</h3>
              <p className="card-category">{project.category}</p>
            </div>
            
            <div className="details-body">
              <p>{project.description}</p>
              
              {project.client && (
                <div className="detail-item">
                  <strong>Client:</strong> {project.client}
                </div>
              )}
            </div>

            <div className="details-footer">
              {project.link && project.link !== '#' && (
                <a 
                  href={project.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="project-link-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={20} /> View Project
                </a>
              )}
              <div className="tap-hint">Tap to see image</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function MobileProjects({ projects }: { projects: SwymbleProject[] }) {
  const initialCards = [...projects, {
    title: "More projects coming soon!",
    category: "STAY TUNED",
    client: null,
    image: SWYMBLE_DATA.endCardMobileImage || "/white-logo.png",
    mobileImage: SWYMBLE_DATA.endCardMobileImage || "/white-logo.png",
    description: "I'm always working on new and exciting things. Check back later for updates! Swipe this card away to reload the deck.",
    link: "#",
    status: 'Pending'
  } as SwymbleProject];

  const [cards, setCards] = useState<SwymbleProject[]>(initialCards);

  // Restore the deck if empty (for endless swiping)
  useEffect(() => {
    if (cards.length === 0) {
      setTimeout(() => {
        setCards([...initialCards]);
      }, 300);
    }
  }, [cards, projects]);

  const handleSwipe = () => {
    setCards((prev) => prev.slice(1));
  };

  return (
    <div className="mobile-projects-wrapper">
      <div className="section-header">
        <h2>PROJECTS</h2>
      </div>
      <p className="swipe-tip">Swipe or tap the cards to explore</p>

      <div className="card-container">
        {cards.map((project, index) => (
          <TinderCard
            key={`${project.title}-${index}`}
            project={project}
            isFront={index === 0}
            index={index}
            onSwipe={handleSwipe}
          />
        ))}
      </div>
    </div>
  );
}
