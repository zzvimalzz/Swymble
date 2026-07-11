import { useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { MobileHomeSectionId } from '../routes';
import { getMobileHomeSectionFromPath } from '../routes';

const HOME_SECTIONS: MobileHomeSectionId[] = [
  'top',
  'focus-section',
  'latest-updates',
  'projects',
  'studio-section',
  'contact-section',
];

type UseMobileSectionNavigationOptions = {
  isHomeRoute: boolean;
  pathname: string;
  hash: string;
  navigate: NavigateFunction;
};

export function useMobileSectionNavigation({ isHomeRoute, pathname, hash, navigate }: UseMobileSectionNavigationOptions) {
  const [activeSection, setActiveSection] = useState<MobileHomeSectionId>('top');

  useEffect(() => {
    const className = 'mobile-snap-enabled';

    if (isHomeRoute) {
      document.documentElement.classList.add(className);
      document.body.classList.add(className);
    } else {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    }

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [isHomeRoute]);

  useEffect(() => {
    if (!isHomeRoute) {
      return;
    }

    let frameId: number | null = null;

    const updateActiveSection = () => {
      const anchorY = window.scrollY + window.innerHeight * 0.42;
      let nextSection: MobileHomeSectionId = 'top';

      HOME_SECTIONS.forEach((sectionId) => {
        const node = document.getElementById(sectionId);
        if (!node) return;

        if (node.offsetTop <= anchorY) {
          nextSection = sectionId;
        }
      });

      setActiveSection((prev) => (prev === nextSection ? prev : nextSection));
    };

    const handleScroll = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateActiveSection();
      });
    };

    updateActiveSection();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isHomeRoute, pathname]);

  useEffect(() => {
    if (!isHomeRoute) {
      return;
    }

    const hashId = hash ? decodeURIComponent(hash.slice(1)) : '';
    const targetSectionId = (hashId || getMobileHomeSectionFromPath(pathname)) as MobileHomeSectionId;

    const frame = window.setTimeout(() => {
      if (targetSectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveSection('top');
        return;
      }

      const targetNode = document.getElementById(targetSectionId);
      if (targetNode) {
        targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(targetSectionId);
      }
    }, 30);

    return () => window.clearTimeout(frame);
  }, [isHomeRoute, pathname, hash]);

  const jumpToSection = (sectionId: MobileHomeSectionId) => {
    if (!isHomeRoute) {
      navigate(`/#${sectionId}`);
      return;
    }

    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('top');
      return;
    }

    const targetNode = document.getElementById(sectionId);
    if (targetNode) {
      targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  return { activeSection, jumpToSection };
}
