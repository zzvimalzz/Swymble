import { useState } from 'react';
import type { SwymbleCareerRepository } from '../../../data/types';
import Reveal from '../../motion/Reveal';
import Filters, { type CareerFilter } from './Filters';
import RepositoryGraph from './RepositoryGraph';

type CareerRepositoryProps = {
  branches: SwymbleCareerRepository;
};

export default function CareerRepository({ branches }: CareerRepositoryProps) {
  const [filter, setFilter] = useState<CareerFilter>('all');

  return (
    <Reveal as="section" className="career-repository" y={24} margin="-80px">
      <div className="career-repository__header">
        <h2 className="career-repository__heading">The Repository</h2>
        <p className="career-repository__subheading">
          Education, employment, and the studio — laid out like the commit history it feels like.
        </p>
        <Filters active={filter} onChange={setFilter} />
      </div>
      <RepositoryGraph branches={branches} filter={filter} />
    </Reveal>
  );
}
