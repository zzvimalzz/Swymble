import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SWYMBLE_DATA } from '../data/config';

const SITE_NAME = 'SWYMBLE';
const SITE_URL = 'https://swymble.com';
const DEFAULT_IMAGE = `${SITE_URL}/ibsolutions_website.png`;

type SeoPayload = {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  shouldIndex?: boolean;
};

const ensureMetaTag = (selector: string, attributes: Record<string, string>) => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    const createdTag = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => createdTag.setAttribute(key, value));
    document.head.appendChild(createdTag);
    tag = createdTag;
  }

  return tag;
};

const setNamedMeta = (name: string, content: string) => {
  const tag = ensureMetaTag(`meta[name="${name}"]`, { name });
  tag.setAttribute('content', content);
};

const setPropertyMeta = (property: string, content: string) => {
  const tag = ensureMetaTag(`meta[property="${property}"]`, { property });
  tag.setAttribute('content', content);
};

const setCanonical = (url: string) => {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }

  canonical.setAttribute('href', url);
};

const toAbsoluteUrl = (pathOrUrl: string) => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${normalizedPath}`;
};

const buildSeoPayload = (pathname: string): SeoPayload => {
  if (pathname === '/') {
    return {
      title: `${SITE_NAME} | Digital Experiences That Elevate Your Brand`,
      description:
        'SWYMBLE builds modern digital experiences, product websites, and intelligent web solutions for brands and businesses.',
      type: 'website',
      shouldIndex: true,
    };
  }

  if (pathname === '/projects') {
    return {
      title: `Projects | ${SITE_NAME}`,
      description:
        'Explore recent SWYMBLE projects, client work, and digital product builds delivered with performance and clarity in mind.',
      type: 'website',
      shouldIndex: true,
    };
  }

  if (pathname === '/labs') {
    return {
      title: `Labs | ${SITE_NAME}`,
      description:
        'See SWYMBLE Labs experiments across AI, product R&D, and private concept development.',
      type: 'website',
      shouldIndex: true,
    };
  }

  if (pathname === '/services') {
    return {
      title: `Services | ${SITE_NAME}`,
      description:
        'Web design, development, and maintenance services by SWYMBLE. End-to-end digital solutions for brands and businesses.',
      type: 'website',
      shouldIndex: true,
    };
  }

  if (pathname === '/about') {
    return {
      title: `About | ${SITE_NAME}`,
      description:
        'Learn about the engineer behind SWYMBLE and the approach used to build scalable, production-grade digital experiences.',
      type: 'website',
      shouldIndex: true,
    };
  }

  if (pathname === '/blog') {
    return {
      title: `Blog | ${SITE_NAME}`,
      description:
        'Read SWYMBLE insights on software engineering, AI systems, and product architecture.',
      type: 'website',
      shouldIndex: true,
    };
  }

  if (pathname.startsWith('/blog/')) {
    const postId = pathname.replace('/blog/', '').replace(/\/$/, '');
    const post = SWYMBLE_DATA.blog.posts.find((entry) => entry.id === postId);

    if (post) {
      return {
        title: `${post.title} | ${SITE_NAME} Blog`,
        description: post.summary,
        image: post.coverImage ? toAbsoluteUrl(post.coverImage) : DEFAULT_IMAGE,
        type: 'article',
        shouldIndex: true,
      };
    }
  }

  return {
    title: `Page Not Found | ${SITE_NAME}`,
    description: 'The page you are looking for does not exist.',
    type: 'website',
    shouldIndex: false,
  };
};

export function useRouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const payload = buildSeoPayload(location.pathname);
    const canonicalUrl = toAbsoluteUrl(location.pathname === '' ? '/' : location.pathname);
    const imageUrl = payload.image ?? DEFAULT_IMAGE;
    const robotsContent = payload.shouldIndex
      ? 'index, follow, max-image-preview:large'
      : 'noindex, nofollow';

    document.title = payload.title;
    setCanonical(canonicalUrl);

    setNamedMeta('description', payload.description);
    setNamedMeta('robots', robotsContent);
    setNamedMeta('twitter:card', 'summary_large_image');
    setNamedMeta('twitter:title', payload.title);
    setNamedMeta('twitter:description', payload.description);
    setNamedMeta('twitter:image', imageUrl);

    setPropertyMeta('og:type', payload.type ?? 'website');
    setPropertyMeta('og:site_name', SITE_NAME);
    setPropertyMeta('og:title', payload.title);
    setPropertyMeta('og:description', payload.description);
    setPropertyMeta('og:url', canonicalUrl);
    setPropertyMeta('og:image', imageUrl);
  }, [location.pathname]);
}
