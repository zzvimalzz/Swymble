const MAILTO_PREFIX = 'mailto:';

export const isMailtoLink = (link: string) => link.toLowerCase().startsWith(MAILTO_PREFIX);

export const buildMailtoHref = (
  mailtoHref: string,
  options: { subject?: string; body?: string },
) => {
  if (!isMailtoLink(mailtoHref)) {
    return mailtoHref;
  }

  const [toPart = ''] = mailtoHref.slice(MAILTO_PREFIX.length).split('?');
  const mailtoParams = new URLSearchParams();

  if (options.subject) {
    mailtoParams.set('subject', options.subject);
  }

  if (options.body) {
    mailtoParams.set('body', options.body);
  }

  const query = mailtoParams.toString();

  return `${MAILTO_PREFIX}${toPart}${query ? `?${query}` : ''}`;
};

export const buildGmailComposeUrl = (mailtoHref: string) => {
  if (!isMailtoLink(mailtoHref)) {
    return mailtoHref;
  }

  const [toPart = '', query = ''] = mailtoHref.slice(MAILTO_PREFIX.length).split('?');
  const decodedTo = decodeURIComponent(toPart);
  const mailtoParams = new URLSearchParams(query);
  const composeParams = new URLSearchParams();

  if (decodedTo) {
    composeParams.set('to', decodedTo);
  }

  const subject = mailtoParams.get('subject');
  if (subject) {
    composeParams.set('su', subject);
  }

  const body = mailtoParams.get('body');
  if (body) {
    composeParams.set('body', body);
  }

  return `https://mail.google.com/mail/?view=cm&fs=1&${composeParams.toString()}`;
};
