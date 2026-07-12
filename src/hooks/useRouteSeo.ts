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
  /** ISO date (YYYY-MM-DD); only set for blog posts, drives article:published_time + JSON-LD. */
  datePublished?: string;
  /** Human title used in article JSON-LD/breadcrumbs (without the "| SWYMBLE Blog" suffix). */
  articleTitle?: string;
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

const removePropertyMeta = (property: string) => {
  document.head.querySelector(`meta[property="${property}"]`)?.remove();
};

// Route-scoped JSON-LD blocks (article + breadcrumbs). The static Organization/WebSite blocks in
// index.html are untouched; these carry a data attribute so navigation can swap/remove only the
// blocks this hook owns. The prerender snapshot captures whatever is set here, so crawlers that
// don't run JS still see the structured data on prerendered routes.
const setRouteJsonLd = (id: string, data: object | null) => {
  const selector = `script[data-swymble-jsonld="${id}"]`;
  let tag = document.head.querySelector<HTMLScriptElement>(selector);

  if (!data) {
    tag?.remove();
    return;
  }

  if (!tag) {
    tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.setAttribute('data-swymble-jsonld', id);
    document.head.appendChild(tag);
  }

  tag.textContent = JSON.stringify(data);
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
        datePublished: post.date,
        articleTitle: post.title,
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

  // GitHub Pages 301-redirects a direct/refreshed load of a prerendered route (e.g. /about) to
  // its directory form (/about/), since prerender-meta.mjs writes dist/<route>/index.html.
  // React Router's own matching tolerates the trailing slash fine, but findSiteRoute's exact
  // string comparison doesn't — without normalizing, every non-home route would fail to match,
  // fall through to the "Page Not Found" payload, and get stamped noindex after render (see
  // MobileTabletView.tsx for the same fix applied to its own path comparisons).
  const pathname =
    location.pathname.length > 1 && location.pathname.endsWith('/')
      ? location.pathname.slice(0, -1)
      : location.pathname;

  useEffect(() => {
    const payload = buildSeoPayload(pathname);
    const canonicalUrl = toAbsoluteUrl(pathname === '' ? '/' : pathname);
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
    setPropertyMeta(
      'og:image:alt',
      payload.articleTitle ?? 'SWYMBLE wave logo: software studio, projects, experiments',
    );

    if (payload.type === 'article' && payload.datePublished) {
      setPropertyMeta('article:published_time', payload.datePublished);
      setRouteJsonLd('article', {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: payload.articleTitle ?? payload.title,
        description: payload.description,
        datePublished: payload.datePublished,
        image: imageUrl,
        url: canonicalUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/icon-512.png` },
        },
      });
      setRouteJsonLd('breadcrumbs', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: payload.articleTitle ?? payload.title },
        ],
      });
    } else {
      removePropertyMeta('article:published_time');
      setRouteJsonLd('article', null);
      setRouteJsonLd('breadcrumbs', null);
    }
  }, [pathname]);
}
