export function parseGoogleMapsHTML(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  const leads = [];
  
  // Try to use Table Scraper rows first for perfect 1:1 Excel alignment
  const tableScraperRows = Array.from(doc.querySelectorAll('.tablescraper-selected-row'));
  
  if (tableScraperRows.length > 0) {
    tableScraperRows.forEach((row, index) => {
      const link = row.querySelector('a[href*="/maps/place/"]');
      
      if (!link) {
        // This is a header or empty row from Table Scraper. User wants to remove it.
        return;
      }
      
      parseCard(link, row, leads, index);
    });
  } else {
    // Fallback: If they didn't use Table Scraper, just extract all place links
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
        if (parentPlaceLinks.some(a => a.getAttribute('href') !== link.getAttribute('href'))) {
          break;
        }
        card = card.parentElement;
      }
      
      parseCard(link, card, leads, index);
    });
  }
  
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
    const phoneMatch = text.match(/(?:\+33|\+59[0-9]|\+262|0[1-9])(?:[\s.-]*\d){8,9}/);
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
