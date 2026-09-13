const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM('<div contenteditable="true">&lt;a href="/maps/place/"&gt;Test&lt;/a&gt;</div>');
const doc = dom.window.document;
const editable = doc.querySelector('div');

const html = editable.innerHTML; // this is "&lt;a href..."
console.log('innerHTML has tags?', html.includes('<a')); // false

const text = editable.textContent; 
console.log('textContent has tags?', text.includes('<a')); // true
