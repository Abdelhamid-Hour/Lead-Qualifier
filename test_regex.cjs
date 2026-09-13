const fs = require('fs');
const html = fs.readFileSync('test.html', 'utf8');
const count = (html.match(/href=["'][^"']*\/maps\/place\//g) || []).length;
console.log('href maps count:', count);
