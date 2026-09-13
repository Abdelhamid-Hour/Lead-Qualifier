const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const html = fs.readFileSync('test.html', 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const feed = doc.querySelector('[role="feed"]');
if (feed) {
  // Usually the feed has direct child divs that are the cards, or one wrapper div then cards.
  console.log('Feed direct children:', feed.children.length);
  const wrapper = feed.children[0];
  if (wrapper) {
    console.log('Wrapper direct children:', wrapper.children.length);
    const firstCard = wrapper.children[2] || wrapper.children[1];
    if (firstCard) {
      console.log('Sample card text length:', firstCard.textContent.length);
      console.log('Sample card text (first 100 chars):', firstCard.textContent.trim().substring(0, 100));
    }
  }
}
