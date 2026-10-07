// Test the parser
import { parseGoogleMapsHTML } from './src/utils/parser.js';
import fs from 'fs';
import { JSDOM } from 'jsdom';

// Polyfill DOMParser for Node
const dom = new JSDOM('');
global.DOMParser = new dom.window.DOMParser().constructor;
global.crypto = { randomUUID: () => Math.random().toString(36).substring(2) };

const html = fs.readFileSync('scratch/test.html', 'utf8');
const leads = parseGoogleMapsHTML(html);

console.log(`Parsed ${leads.length} leads.`);
const deduped = deduplicateLeads(leads);
console.log(`Deduped ${deduped.length} leads.`);

function deduplicateLeads(leadsList) {
  const seen = new Set();
  return leadsList.filter(l => {
    const key = `${l.name || ''}|${l.phone || ''}|${l.gmapsLink || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
