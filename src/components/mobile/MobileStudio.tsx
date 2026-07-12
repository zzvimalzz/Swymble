import React from 'react';
import Reveal from '../motion/Reveal';
import type { SwymbleProcessStep, SwymbleService } from '../../data/config';

type MobileStudioProps = {
  services: SwymbleService[];
  process: SwymbleProcessStep[];
};

export default function MobileStudio({ services, process }: MobileStudioProps) {
  return (
    <div className="mobile-studio-wrapper" id="studio">
      <div className="section-header">
        <h2>WORK WITH ME</h2>
      </div>

      <div className="services-list">
        {services.map((service, idx) => (
          <Reveal
            key={service.id}
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

      <div className="mobile-process-list">
        {process.map((step, idx) => (
          <Reveal
            key={step.id}
            className="mobile-process-step"
            y={28}
            x={-20}
            margin="-50px"
            delay={idx * 0.1}
          >
            <span className="mobile-process-number">{step.step}</span>
            <div className="mobile-process-copy">
              <h3 className="mobile-process-title">{step.title}</h3>
              <p className="mobile-process-desc">{step.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
