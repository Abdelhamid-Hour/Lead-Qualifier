const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('C:/Users/houra/Desktop/lead-qualifier/user_test_2.html', 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const rows = doc.querySelectorAll('.tablescraper-selected-row');
console.log('Tablescraper rows: ' + rows.length);
const rowNames = [];
for (const row of rows) {
  const link = row.querySelector('a[href*="/maps/place/"]');
  if (link) {
    rowNames.push(link.getAttribute('aria-label') || link.textContent.trim());
  } else {
    rowNames.push('<no map link>');
  }
}
console.log('Row Names:');
rowNames.forEach((n, i) => console.log((i+1) + '. ' + n));
