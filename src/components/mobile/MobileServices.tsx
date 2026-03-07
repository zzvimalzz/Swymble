import React from 'react';
import { motion } from 'framer-motion';
import type { SwymbleWhatIDo } from '../../data/config';

export default function MobileServices({ whatIDo }: { whatIDo: SwymbleWhatIDo[] }) {
  return (
    <div className="mobile-services-wrapper" id="services">
      <div className="section-header">
        <h2>WHAT I DO</h2>
      </div>
      <div className="services-list">
        {whatIDo.map((service, idx) => (
          <motion.div
            key={service.title}
            className="service-card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            style={
              { 
                '--service-color': service.colorHex,
                '--card-index': idx 
              } as React.CSSProperties
            }
          >
            <h3 className="service-title">{service.title}</h3>
            <p className="service-desc">{service.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}