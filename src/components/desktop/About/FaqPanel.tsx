import Reveal from '../../motion/Reveal';
import type { SwymbleFaqEntry } from '../../../data/types';
import { serializeJsonLd } from '../../../utils/jsonLd';
import { SWYMBLE_SITE_URL } from '../../../utils/siteUrls';

/**
 * The site's plain-language self-description, rendered as questions.
 *
 * Two audiences, one block. A reader gets straight answers to the things they would otherwise
 * have to infer from the design; a crawler or an AI assistant gets the first place on the site
 * that states, in indexable prose, what "Swymble" actually refers to — plus the FAQPage
 * structured data that answer engines lift verbatim.
 *
 * Rendered on /about and only there: FAQPage markup repeated across pages competes with itself,
 * and /about is the page that should win the "what is Swymble" query.
 */
export default function FaqPanel({ faq }: { faq: SwymbleFaqEntry[] }) {
  if (!faq.length) {
    return null;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SWYMBLE_SITE_URL}/about#faq`,
    isPartOf: { '@id': `${SWYMBLE_SITE_URL}/#website` },
    about: { '@id': `${SWYMBLE_SITE_URL}/#organization` },
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };

  return (
    <Reveal as="section" className="about-faq" id="faq" y={24} margin="-80px">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="about-faq__head">
        <p className="about-section__kicker">02 &middot; FAQ.md</p>
        <h2 className="about-section__heading">In plain language</h2>
      </div>

      <div className="about-faq__list">
        {faq.map((entry) => (
          <article key={entry.question} className="about-faq__item">
            <h3 className="about-faq__question">
              <span className="about-faq__hash">Q.</span> {entry.question}
            </h3>
            <p className="about-faq__answer">{entry.answer}</p>
          </article>
        ))}
      </div>
    </Reveal>
  );
}
