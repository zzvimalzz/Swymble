import React from 'react';
import Reveal from '../motion/Reveal';
import type { SwymbleWhatIDo } from '../../data/config';

export default function MobileFocus({ whatIDo }: { whatIDo: SwymbleWhatIDo[] }) {
  return (
    <div className="mobile-focus-wrapper" id="focus">
      <div className="section-header">
        <h2>WHAT YOU'LL FIND HERE</h2>
      </div>

      <div className="services-list">
        {whatIDo.map((service, idx) => (
          <Reveal
            key={service.title}
            className="service-card"
            y={40}
            margin="-50px"
            delay={idx * 0.1}
            style={
              {
                '--service-color': service.colorHex,
                '--card-index': idx,
              } as React.CSSProperties
            }
          >
            <h3 className="service-title">{service.title}</h3>
            <p className="service-desc">{service.desc}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}