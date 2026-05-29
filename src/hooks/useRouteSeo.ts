import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SWYMBLE_DATA } from '../data/config';
import { DEFAULT_SEO_IMAGE, SITE_NAME, SITE_URL, findSiteRoute } from '../routes';

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
  const route = findSiteRoute(pathname);

  if (route) {
    return {
      title: route.seoTitle,
      description: route.seoDescription,
      type: 'website',
      shouldIndex: route.shouldIndex,
    };
  }

  if (pathname.startsWith('/blog/')) {
    const postId = pathname.replace('/blog/', '').replace(/\/$/, '');
    const post = SWYMBLE_DATA.blog.posts.find((entry) => entry.id === postId);

    if (post) {
      return {
        title: `${post.title} | ${SITE_NAME} Blog`,
        description: post.summary,
        image: post.coverImage ? toAbsoluteUrl(post.coverImage) : DEFAULT_SEO_IMAGE,
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
    const imageUrl = payload.image ?? DEFAULT_SEO_IMAGE;
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
