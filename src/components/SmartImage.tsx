import type { CSSProperties, ImgHTMLAttributes } from 'react';

type SmartImageFit = 'cover' | 'contain';

type SmartImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fit?: SmartImageFit;
  position?: string;
  padding?: CSSProperties['padding'];
};

type ResolvedImagePresentation = {
  fit: SmartImageFit;
  position: string;
  padding: CSSProperties['padding'];
};

function inferImagePresentation(src?: string): ResolvedImagePresentation {
  const normalizedSrc = src?.toLowerCase() ?? '';
  const isLogoLike = /(logo|wordmark|icon|badge|mark)/.test(normalizedSrc);
  const isDiagramLike = /(diagram|map|brain|schema|wireframe)/.test(normalizedSrc);
  const isUiShot = /(website|dashboard|screen|interface|app|panel|landing|mockup)/.test(normalizedSrc);

  if (isLogoLike || isDiagramLike) {
    return {
      fit: 'contain',
      position: 'center',
      padding: 'clamp(0.75rem, 2vw, 1.5rem)',
    };
  }

  if (isUiShot) {
    return {
      fit: 'contain',
      position: 'top center',
      padding: 'clamp(0.5rem, 1.5vw, 1rem)',
    };
  }

  return {
    fit: 'cover',
    position: 'center',
    padding: 0,
  };
}

export default function SmartImage({
  src,
  alt,
  fit,
  position,
  padding,
  style,
  ...rest
}: SmartImageProps) {
  const resolvedPresentation = inferImagePresentation(src);

  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      style={{
        objectFit: fit ?? resolvedPresentation.fit,
        objectPosition: position ?? resolvedPresentation.position,
        padding: padding ?? resolvedPresentation.padding,
        ...style,
      }}
    />
  );
}