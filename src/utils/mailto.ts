const MAILTO_PREFIX = 'mailto:';

export const isMailtoLink = (link: string) => link.toLowerCase().startsWith(MAILTO_PREFIX);
