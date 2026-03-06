import { useEffect, useRef } from 'react';

type StarLayer = 'bg' | 'mg' | 'fg';

type Star = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleDir: 1 | -1;
  parallaxFactor: number;
  layer: StarLayer;
};

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseX = event.clientX;
      targetMouseY = event.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const createStars = (
      count: number,
      size: number,
      speed: number,
      layer: StarLayer,
      parallaxFactor: number
    ): Star[] => {
      return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        size: Math.random() * size + 0.45,
        speed: speed + Math.random() * 0.18,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: 0.01 + Math.random() * 0.02,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        layer,
        parallaxFactor,
      }));
    };

    const stars: Star[] = [
      ...createStars(260, 1.1, 0.08, 'bg', 0.018),
      ...createStars(140, 1.7, 0.17, 'mg', 0.045),
      ...createStars(70, 2.2, 0.32, 'fg', 0.085),
    ];

    const drawStar = (star: Star, renderX: number, renderY: number) => {
      ctx.beginPath();
      ctx.arc(renderX, renderY, star.size, 0, Math.PI * 2);

      if (star.layer === 'fg') {
        ctx.fillStyle = 'rgba(255, 255, 255, ' + star.opacity.toFixed(3) + ')';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      } else if (star.layer === 'mg') {
        ctx.fillStyle = 'rgba(220, 232, 255, ' + (star.opacity * 0.8).toFixed(3) + ')';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'rgba(170, 195, 245, ' + (star.opacity * 0.52).toFixed(3) + ')';
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const mouseOffsetX = mouseX - width / 2;
      const mouseOffsetY = mouseY - height / 2;

      for (const star of stars) {
        star.baseY -= star.speed;

        if (star.baseY < -48) star.baseY = height + 48;
        if (star.baseX < -48) star.baseX = width + 48;
        if (star.baseX > width + 48) star.baseX = -48;

        star.x = star.baseX - mouseOffsetX * star.parallaxFactor;
        star.y = star.baseY - mouseOffsetY * star.parallaxFactor;

        let renderX = star.x;
        let renderY = star.y;

        if (renderX < 0) renderX = width - (Math.abs(renderX) % width);
        else renderX = renderX % width;

        if (renderY < 0) renderY = height - (Math.abs(renderY) % height);
        else renderY = renderY % height;

        star.opacity += star.twinkleSpeed * star.twinkleDir;
        if (star.opacity >= 1) {
          star.opacity = 1;
          star.twinkleDir = -1;
        } else if (star.opacity <= 0.12) {
          star.opacity = 0.12;
          star.twinkleDir = 1;
        }

        drawStar(star, renderX, renderY);
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="space-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="space-canvas" />
      <div className="space-nebula" />
      <div className="space-vignette" />
    </div>
  );
}