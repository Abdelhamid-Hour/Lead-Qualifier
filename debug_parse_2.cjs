const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('C:/Users/houra/Desktop/lead-qualifier/user_test_2.html', 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

function parseGoogleMapsHTML(doc) {
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

  const leads = [];

  uniquePlaceLinks.forEach((link, index) => {
    let card = link;
    while (card.parentElement) {
      const parentPlaceLinks = Array.from(card.parentElement.querySelectorAll('a')).filter(a => {
        const h = a.getAttribute('href') || '';
        return h.includes('/maps/place/');
      });
      const hasOtherPlaces = parentPlaceLinks.some(a => a.getAttribute('href') !== link.getAttribute('href'));
      if (hasOtherPlaces) {
        break;
      }
      card = card.parentElement;
    }

    const name = link.getAttribute('aria-label') || link.textContent.trim();
    const gmapsLink = link.getAttribute('href') || '';

    const ratingSpan = card.querySelector('span[role="img"][aria-label]');
    let rating = '';
    let reviews = '';
    if (ratingSpan) {
      const ratingLabel = ratingSpan.getAttribute('aria-label') || '';
      const match = ratingLabel.match(/([\d.]+)\s*stars?\s+([\d,]+)\s*Reviews?/i) || ratingLabel.match(/([\d,]+)\s*étoiles?\s+([\d,]+)\s*avis/i);
      if (match) {
        rating = match[1].replace(',', '.');
        reviews = match[2].replace(/,/g, '').replace(/\s/g, '');
      }
    }

    const text = card.textContent;
    const phoneMatch = text.match(/(?:\+590|0590|0690|0596|0696|0594|0262|0692|0693)[\s\d]{8,12}/);
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

    if (name && (phone || website)) {
      leads.push({
        id: Date.now() + index,
        name,
        phone,
        rating,
        reviews,
        website,
        gmapsLink,
        category: 'not_checked',
        message: '',
        waLink: ''
      });
    }
  });

  const uniqueLeads = [];
  const seenNames = new Set();
  
  for (const lead of leads) {
    const normalizedName = lead.name.toLowerCase().trim();
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      uniqueLeads.push(lead);
    }
  }

  return uniqueLeads;
}

const leads = parseGoogleMapsHTML(doc);
console.log('Parser extracted unique leads: ' + leads.length);
leads.forEach((l, i) => console.log((i+1) + '. ' + l.name));

