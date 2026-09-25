export function parseGoogleMapsHTML(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  const leads = [];
  
  // Extract all place links
  const allLinks = Array.from(doc.querySelectorAll('a'));
  const placeLinks = allLinks.filter(a => {
    const href = a.getAttribute('href') || '';
    return href.includes('/maps/place/');
  });
  
  const uniquePlaceLinks = [];
  const seenHrefs = new Set();
  for (const link of placeLinks) {
    const href = link.getAttribute('href');
    if (!seenHrefs.has(href)) {
      seenHrefs.add(href);
      uniquePlaceLinks.push(link);
    }
  }
  
  uniquePlaceLinks.forEach((link, index) => {
    let card = link;
    while (card.parentElement) {
      const parentPlaceLinks = Array.from(card.parentElement.querySelectorAll('a')).filter(a => {
        const h = a.getAttribute('href') || '';
        return h.includes('/maps/place/');
      });
      // Stop ascending when the parent contains links to OTHER places
      if (parentPlaceLinks.some(a => a.getAttribute('href') !== link.getAttribute('href'))) {
        break;
      }
      card = card.parentElement;
    }
    
    parseCard(link, card, leads, index);
  });
  
  function parseCard(link, card, leadsArray, index) {
    const name = link.getAttribute('aria-label') || link.textContent.trim();
    const gmapsLink = link.getAttribute('href') || '';
    
    let rating = '';
    let reviews = '';
    const ratingSpan = card.querySelector('span[role="img"][aria-label]');
    if (ratingSpan) {
      const ratingLabel = ratingSpan.getAttribute('aria-label') || '';
      const match = ratingLabel.match(/([\d.]+)\s*stars?\s+([\d,]+)\s*Reviews?/i) || ratingLabel.match(/([\d,]+)\s*étoiles?\s+([\d,]+)\s*avis/i);
      if (match) {
        rating = match[1].replace(',', '.');
        reviews = match[2].replace(/,/g, '').replace(/\s/g, '');
      }
    }
    
    const text = card.textContent;
    const phoneMatch = text.match(/(?:\+|00)[1-9][\s\d.-]{7,15}\d|(?:\(\d{2,5}\)|0\d{1,4}|1[\s.-]\d{3,4}|\d{3,4})[\s.-]*(?:\d{2,4}[\s.-]*){1,4}\d{2,4}/);
    let phone = phoneMatch ? phoneMatch[0].trim() : '';
    
    const websiteLink = Array.from(card.querySelectorAll('a')).find(a => {
      const t = a.textContent.toLowerCase();
      return t.includes('website') || t.includes('site web');
    });
    let website = '';
    if (websiteLink) {
      const href = websiteLink.getAttribute('href') || '';
      if (href.startsWith('http') && !href.includes('/aclk')) {
        website = href;
      }
    }
    
    const sponsored = text.toLowerCase().includes('sponsored') || text.toLowerCase().includes('sponsorisé');
    
    // Extract business type / category
    const spans = Array.from(card.querySelectorAll('.W4Efsd > span > span'));
    const typeSpan = spans.find(s => {
      const t = s.textContent.trim();
      return t.length > 2 && !t.includes('·') && !t.match(/^[\d.,()\s]+$/);
    });
    const type = typeSpan ? typeSpan.textContent.trim() : '';

    if (name) {
      leadsArray.push({
        id: crypto.randomUUID(),
        name,
        type, // Store the business type
        phone,
        rating,
        reviews,
        website,
        gmapsLink,
        category: 'not_checked',
        message: '',
        waLink: '',
        sponsored
      });
    }
  }

  return leads;
}
