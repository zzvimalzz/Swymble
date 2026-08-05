import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from './jsonLd';

// The reason this escaping exists cannot be observed in the current output — none of the site's
// copy contains a `<` — so without a test the protection could be removed by a well-meaning
// simplification and nothing would fail until the day it mattered.

describe('serializeJsonLd', () => {
  it('escapes < so a closing script tag in the data cannot end the script element', () => {
    const serialized = serializeJsonLd({ name: 'x</script><script>alert(1)</script>' });

    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c/script');
  });

  it('round-trips to the same object, so consumers see the unescaped value', () => {
    const payload = { '@type': 'FAQPage', name: 'a < b </script>', nested: { list: ['<x>', 'y'] } };

    expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  });

  it('leaves data without angle brackets byte-identical to JSON.stringify', () => {
    const payload = { '@context': 'https://schema.org', '@type': 'Organization', name: 'SWYMBLE' };

    expect(serializeJsonLd(payload)).toBe(JSON.stringify(payload));
  });
});
