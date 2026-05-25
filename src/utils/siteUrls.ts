export const SWYMBLE_SITE_URL = 'https://swymble.com';

export function createSubdomainUrl(subdomain: string, path = '') {
  const normalizedSubdomain = subdomain.trim().replace(/[^a-z0-9-]/gi, '').toLowerCase();
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '';
  return `https://${normalizedSubdomain}.swymble.com${normalizedPath}`;
}