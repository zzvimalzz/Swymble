import { useEffect, useRef, useState } from 'react';

export function useDesktopCursor() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isSocialHover, setIsSocialHover] = useState(false);
  const [hoverColorIndex, setHoverColorIndex] = useState(0);

  const hoverStateRef = useRef(false);
  const cursorVisibleRef = useRef(false);

  useEffect(() => {
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;

    const checkHover = () => {
      const hoveredElement = document.elementFromPoint(currentX, currentY);

      document
        .querySelectorAll('.service-card.force-hover, .carousel-card.force-hover')
        .forEach((node) => node.classList.remove('force-hover'));

      if (!hoveredElement) {
        return;
      }

      const serviceCard = hoveredElement.closest('.service-card');
      if (serviceCard) {
        serviceCard.classList.add('force-hover');
      }

      const carouselCard = hoveredElement.closest('.carousel-card');
      if (carouselCard) {
        carouselCard.classList.add('force-hover');
      }

      const isHoverTarget =
        hoveredElement.tagName.toLowerCase() === 'a' ||
        hoveredElement.tagName.toLowerCase() === 'button' ||
        hoveredElement.tagName.toLowerCase() === 'input' ||
        hoveredElement.tagName.toLowerCase() === 'select' ||
        Boolean(hoveredElement.closest('a')) ||
        Boolean(hoveredElement.closest('button')) ||
        Boolean(hoveredElement.closest('.service-card')) ||
        Boolean(hoveredElement.closest('.w-client')) ||
        Boolean(hoveredElement.closest('.carousel-card')) ||
        Boolean(hoveredElement.closest('.hero-title'));

      if (isHoverTarget) {
        if (!hoverStateRef.current) {
          setHoverColorIndex((prev) => (prev + 1) % 3);
          hoverStateRef.current = true;
        }
        setIsHovering(true);
      } else {
        hoverStateRef.current = false;
        setIsHovering(false);
      }

      setIsSocialHover(Boolean(hoveredElement.closest('.social-link')));
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!cursorVisibleRef.current) {
        cursorVisibleRef.current = true;
        setCursorVisible(true);
      }

      currentX = event.clientX;
      currentY = event.clientY;
      setMousePos({ x: currentX, y: currentY });
      checkHover();
    };

    const handleMouseLeave = () => {
      cursorVisibleRef.current = false;
      setCursorVisible(false);
    };

    const handleMouseEnter = () => {
      cursorVisibleRef.current = true;
      setCursorVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', checkHover, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', checkHover);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return {
    mousePos,
    cursorVisible,
    isHovering,
    isSocialHover,
    hoverColorIndex,
    setIsHovering,
  };
}
