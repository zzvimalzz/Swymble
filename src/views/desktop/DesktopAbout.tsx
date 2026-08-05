import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CareerRepository from '../../components/desktop/CareerRepository/CareerRepository';
import CareerTerminal from '../../components/desktop/About/CareerTerminal';
import ConfigPanel from '../../components/desktop/About/ConfigPanel';
import FaqPanel from '../../components/desktop/About/FaqPanel';
import ReadmePanel from '../../components/desktop/About/ReadmePanel';
import RemotePanel from '../../components/desktop/About/RemotePanel';
import RepoHeader from '../../components/desktop/About/RepoHeader';
import StackSection from '../../components/desktop/About/StackSection';
import { SWYMBLE_DATA } from '../../data/config';
import '../../styles/desktop-about.css';

export default function DesktopAbout() {
  const location = useLocation();
  const { about, career, faq, labs, projects, socials } = SWYMBLE_DATA;
  const visibleLabs = labs.filter((lab) => lab.visibility !== 'private');
  // "Shipped and live" means exactly that: client projects plus the labs that are actually
  // reachable by a stranger. Everything else is still being built. Previously both numbers came
  // from raw array lengths, so the shipped count ignored the live products entirely and the lab
  // count included things that had already launched.
  const liveLabs = visibleLabs.filter((lab) => lab.status === 'Live');
  const unreleasedLabs = visibleLabs.filter((lab) => lab.status !== 'Live');

  // Depend on the primitive pathname, not the `location` object itself — see DesktopProjects.tsx
  // for why depending on the whole object causes a scroll-to-top mid-scroll.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <section className="layout-content desktop-about-page">
      <RepoHeader
        about={about}
        career={career}
        shippedCount={projects.length + liveLabs.length}
        labCount={unreleasedLabs.length}
      />

      <ReadmePanel sections={about.readme} pullQuote={about.pullQuote} />

      {/* Sits right behind the README rather than at the foot of the page: it answers the same
          question the README does, but in the literal words someone would type or ask. */}
      <FaqPanel faq={faq} />

      <StackSection stack={about.stack} domains={about.skillDomains} />

      <CareerRepository branches={career} />

      <ConfigPanel config={about.config} currently={about.currently} />

      <CareerTerminal context={{ about, career, labs, projects }} />

      <RemotePanel socials={socials} availabilityLabel={about.availability.label} />
    </section>
  );
}
